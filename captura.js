/* ==========================================================================
   HanafudaON! - captura.js (motor comum dos jogos de "pescar" cartas por mês)

   Serve a Koi-Koi, Hachi-Hachi, Hana-Awase, Mushi, Roppyakken, Sudaoshi, Tensho e Bakappana.
   Cada jogo é só uma configuração (jogos-captura.js) que diz: quem joga, o baralho, quantas cartas,
   quanto vale cada carta e como se pontua. O jeito de jogar é sempre o mesmo:
     1. jogar uma carta da mão: se há carta do mesmo mês no campo, leva as duas; senão ela fica no campo;
     2. virar a carta de cima do monte: mesma regra;
     3. passa a vez. A rodada acaba quando as mãos esvaziam (ou quando o jogo manda parar).

   Interface do módulo (igual à dos outros jogos, veja robo.js):
     novo(opcoes) -> estado           estado é JSON puro (pode guardar no navegador e mandar ao Worker)
     vez(estado)  -> índice do jogador que decide agora (0 = quem abre a rodada), ou -1 se não há ninguém
     acoes(estado)-> lista de ações possíveis (objetos JSON)
     aplicar(estado, acao) -> novo estado (não mexe no original); aplicarM faz o mesmo no próprio estado
     fimRodada(estado), fimPartida(estado), proximaRodada(estado) -> novo estado
     visao(estado, j) -> o que o jogador j enxerga (mãos dos outros e monte viram -1)
     determinizar(estado, j, r) -> estado completo sorteado compatível com a visão de j
     utilidade(estado, j) -> número para o robô comparar finais (ganho do jogador j na rodada)
     assento(estado, j) -> cadeira da mesa do jogador j da rodada

   Estado (campos principais):
     jogo, n (jogadores na rodada), mesa (cadeiras), oya (cadeira de quem abre), assentos (cadeira de cada j),
     rod, rodadas, fase ('jogar' | 'virar' | 'decidir' | 'fimrod'), vez, mao[j], campo, monte (topo = último),
     capt[j], pts[cadeira] (placar acumulado), pend ({v}), x (dados do jogo), ev (eventos desta ação, para animar),
     res (resultado da rodada), sem (semente que avança).
   Ações:
     {t:'j', c, a}   joga a carta c da mão; a = carta do campo que leva junto (ou -1 se vai para o campo)
     {t:'v', a}      escolhe qual carta do campo leva a carta virada
     {t:'d', k}      decisão do jogo (Koi-Koi: k 'koi' ou 'parar'; Hachi-Hachi: 'sage' ou 'parar')
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };
  const N = (typeof require !== 'undefined' && typeof module !== 'undefined') ? require('./nucleo.js') : HON;
  const { mes, TIPOS, rng, proxSem, embaralhar, valorPadrao, mesmaClasse } = N;

  function clonar(e) {
    return {
      jogo: e.jogo, n: e.n, mesa: e.mesa, oya: e.oya, assentos: e.assentos, rod: e.rod, rodadas: e.rodadas,
      fase: e.fase, vez: e.vez, mao: e.mao.map((a) => a.slice()), campo: e.campo.slice(), monte: e.monte.slice(),
      capt: e.capt.map((a) => a.slice()), pts: e.pts.slice(), pend: e.pend ? { v: e.pend.v } : null,
      x: e.x ? JSON.parse(JSON.stringify(e.x)) : e.x, ev: [], res: e.res, sem: e.sem, ult: e.ult,
      opc: e.opc, jaCapt: e.jaCapt
    };
  }

  function criarJogo(cfg) {
    const coringa = cfg.coringa || null;
    const valor = cfg.valor || valorPadrao;

    /* ---------- como uma carta pode capturar ---------- */
    // devolve [{a, leva:[...]}], a = carta do campo que identifica a escolha
    function opcoes(e, c, origem) {
      const campo = e.campo, m = mes(c), lista = [];
      const ehOni = coringa && c === coringa.id;
      let mm = campo.filter((x) => mes(x) === m);
      if (coringa && coringa.soDoMonte) mm = mm.filter((x) => x !== coringa.id);
      if (mm.length === 3 && !(ehOni && !coringa.trio)) {
        lista.push({ a: mm[0], leva: mm.slice() });
      } else {
        mm.forEach((x) => { if (!lista.some((o) => mesmaClasse(o.a, x))) lista.push({ a: x, leva: [x] }); });
      }
      if (ehOni) {
        campo.forEach((x) => {
          if (mes(x) === m || !coringa.alvo(x)) return;
          const igual = campo.filter((y) => mes(y) === mes(x));
          if (igual.length === 3) {
            if (coringa.trio && !lista.some((o) => mes(o.a) === mes(x))) lista.push({ a: x, leva: igual.slice() });
            return;
          }
          if (!lista.some((o) => o.leva.length === 1 && mesmaClasse(o.a, x))) lista.push({ a: x, leva: [x] });
        });
      }
      if (coringa && coringa.soDoMonte && origem === 'monte' && !ehOni && mes(c) !== mes(coringa.id) && campo.indexOf(coringa.id) >= 0) {
        lista.push({ a: coringa.id, leva: [coringa.id] });
      }
      return lista;
    }

    function tirar(l, c) { const i = l.indexOf(c); if (i >= 0) l.splice(i, 1); }

    function levar(e, j, c, leva, de) {
      leva.forEach((x) => tirar(e.campo, x));
      const cs = [c].concat(leva);
      cs.forEach((x) => e.capt[j].push(x));
      e.ult = j;
      e.jaCapt = true;
      e.ev.push({ t: 'cap', j, cs, de, c });
    }

    function usar(e, j, c, origem, alvo) {
      const op = opcoes(e, c, origem);
      if (!op.length) {
        e.campo.push(c);
        e.ev.push({ t: 'campo', j, c, de: origem });
        return;
      }
      let o = op.find((q) => q.a === alvo);
      if (!o) o = op[0];
      levar(e, j, c, o.leva, origem);
    }

    /* ---------- turno ---------- */
    function virar(e) {
      const j = e.vez;
      if (!e.monte.length) { fimDeTurno(e); return; }
      const v = e.monte.pop();
      e.ev.push({ t: 'vira', j, c: v });
      const op = opcoes(e, v, 'monte');
      if (op.length > 1) { e.fase = 'virar'; e.pend = { v }; return; }
      usar(e, j, v, 'monte', op.length ? op[0].a : -1);
      fimDeTurno(e);
    }

    function fimDeTurno(e) {
      const j = e.vez;
      e.pend = null;
      if (cfg.aposTurno) {
        cfg.aposTurno(e, j, mod);
        if (e.fase === 'decidir' || e.fase === 'fimrod') return;
      }
      avancar(e);
    }

    function avancar(e) {
      if (e.mao.every((m) => !m.length)) { acabar(e); return; }
      e.vez = (e.vez + 1) % e.n;
      while (!e.mao[e.vez].length) e.vez = (e.vez + 1) % e.n;
      e.fase = 'jogar';
    }

    // fim normal: as cartas que sobram no campo vão para quem capturou por último
    function acabar(e) {
      if (e.campo.length && e.ult >= 0) {
        const cs = e.campo.slice();
        cs.forEach((x) => e.capt[e.ult].push(x));
        e.ev.push({ t: 'resto', j: e.ult, cs });
        e.campo = [];
      }
      terminar(e, cfg.fechar(e, mod));
    }

    function terminar(e, res) {
      e.res = res;
      e.fase = 'fimrod';
      e.pend = null;
      for (let j = 0; j < e.n; j++) e.pts[e.assentos[j]] += res.ganhos[j];
      e.ev.push({ t: 'fim', res });
    }

    function aplicarM(e, a) {
      e.ev = [];
      if (e.fase === 'jogar' && a.t === 'j') {
        const j = e.vez;
        tirar(e.mao[j], a.c);
        e.ev.push({ t: 'mao', j, c: a.c });
        usar(e, j, a.c, 'mao', a.a);
        virar(e);
      } else if (e.fase === 'virar' && a.t === 'v') {
        const v = e.pend.v;
        usar(e, e.vez, v, 'monte', a.a);
        fimDeTurno(e);
      } else if (e.fase === 'decidir' && a.t === 'd') {
        cfg.decidir(e, a, mod);
      } else {
        throw new Error('Ação inválida na fase ' + e.fase + ': ' + JSON.stringify(a));
      }
      return e;
    }

    function aplicar(e, a) { return aplicarM(clonar(e), a); }

    /* ---------- ações ---------- */
    function acoes(e) {
      if (e.fase === 'jogar') {
        const l = [], mao = e.mao[e.vez];
        mao.forEach((c, i) => {
          if (mao.slice(0, i).some((d) => mesmaClasse(c, d))) return;
          const op = opcoes(e, c, 'mao');
          if (!op.length) l.push({ t: 'j', c, a: -1 });
          else op.forEach((o) => l.push({ t: 'j', c, a: o.a }));
        });
        return l;
      }
      if (e.fase === 'virar') return opcoes(e, e.pend.v, 'monte').map((o) => ({ t: 'v', a: o.a }));
      if (e.fase === 'decidir') return cfg.acoesDecisao(e);
      return [];
    }

    const vez = (e) => (e.fase === 'fimrod' ? -1 : e.vez);

    /* ---------- distribuição ---------- */
    function distribuir(e) {
      const n = e.n, [kMao, kCampo] = cfg.maoCampo(n);
      const base = cfg.baralho(n, e.opc);
      let tent = 0;
      for (;;) {
        e.sem = proxSem(e.sem);
        const d = embaralhar(base, rng(e.sem));
        e.mao = []; for (let j = 0; j < n; j++) e.mao.push(d.splice(0, kMao).sort((a, b) => a - b));
        e.campo = d.splice(0, kCampo).sort((a, b) => a - b);
        e.monte = d;
        const mc = {}; e.campo.forEach((c) => { mc[mes(c)] = (mc[mes(c)] || 0) + 1; });
        const ruim = Object.keys(mc).some((m) => mc[m] >= 4) || (cfg.refazer && cfg.refazer(e));
        if (!ruim || ++tent > 200) break;
      }
      e.capt = []; for (let j = 0; j < n; j++) e.capt.push([]);
      e.ult = -1; e.jaCapt = false; e.pend = null; e.res = null; e.ev = []; e.fase = 'jogar'; e.vez = 0;
      e.x = cfg.xInicial ? cfg.xInicial(e) : {};
      if (cfg.aoDistribuir) cfg.aoDistribuir(e, mod);
    }

    function prepararRodada(e) {
      const M = e.mesa;
      e.assentos = [];
      for (let j = 0; j < e.n; j++) e.assentos.push((e.oya + j) % M);
      distribuir(e);
    }

    function novo(op) {
      op = Object.assign({}, cfg.opcoesPadrao, op || {});
      const mesa = Math.max(cfg.minJ, Math.min(cfg.maxMesa || cfg.maxJ, op.jogadores || cfg.padraoJ));
      const n = cfg.ativos ? cfg.ativos(mesa) : mesa;
      const sem = (op.semente == null ? N.novaSemente() : op.semente) >>> 0;
      const e = {
        jogo: cfg.id, n, mesa, oya: 0, assentos: [], rod: 1, rodadas: op.rodadas, fase: 'jogar', vez: 0,
        mao: [], campo: [], monte: [], capt: [], pts: new Array(mesa).fill(0), pend: null, x: {}, ev: [],
        res: null, sem, ult: -1, jaCapt: false, opc: op
      };
      e.oya = op.oya != null ? op.oya : Math.floor(rng(sem)() * mesa);
      prepararRodada(e);
      return e;
    }

    const fimRodada = (e) => e.fase === 'fimrod';
    function fimPartida(e) {
      if (!fimRodada(e)) return false;
      return cfg.fimPartida ? cfg.fimPartida(e) : e.rod >= e.rodadas;
    }

    function proximaRodada(e) {
      const p = clonar(e);
      p.rod += 1;
      p.oya = cfg.proxOya ? cfg.proxOya(p, e.res) : (p.oya + 1) % p.mesa;
      prepararRodada(p);
      return p;
    }

    /* ---------- informação oculta ---------- */
    function visao(e, j) {
      const v = clonar(e);
      v.mao = v.mao.map((m, k) => (k === j ? m : m.map(() => -1)));
      v.monte = v.monte.map(() => -1);
      if (v.pend) v.pend = { v: v.pend.v };
      return v;
    }

    function determinizar(e, j, r) {
      const d = clonar(e);
      const vistas = new Set();
      d.campo.forEach((c) => vistas.add(c));
      d.capt.forEach((l) => l.forEach((c) => vistas.add(c)));
      d.mao[j].forEach((c) => vistas.add(c));
      if (d.pend) vistas.add(d.pend.v);
      (d.revelada || []).forEach((c) => vistas.add(c));
      const base = cfg.baralho(d.n, d.opc);
      const resto = embaralhar(base.filter((c) => !vistas.has(c)), r);
      for (let k = 0; k < d.n; k++) {
        if (k === j) continue;
        const q = d.mao[k].length;
        d.mao[k] = resto.splice(0, q).sort((a, b) => a - b);
      }
      d.monte = resto.slice(0, d.monte.length);
      return d;
    }

    const utilidade = (e, j) => (e.res ? e.res.ganhos[j] : 0);

    const mod = {
      cfg, id: cfg.id, opcoes, clonar, novo, vez, acoes, aplicar, aplicarM, fimRodada, fimPartida, proximaRodada,
      visao, determinizar, utilidade, levar, usar, terminar, avancar, valor,
      assento: (e, j) => e.assentos[j],
      escala: cfg.escala || 30,
      cartasDe: (e, j) => e.capt[j],
      pontosCartas: (e, j) => e.capt[j].reduce((s, c) => s + valor(c), 0)
    };
    HON.jogos[cfg.id] = mod;
    return mod;
  }

  HON.criarCaptura = criarJogo;
  if (typeof module !== 'undefined' && module.exports) module.exports = HON;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis));
