/* ==========================================================================
   HanafudaON! - kabu.js (Oicho-Kabu e Kingo: jogos de apostas contra a banca)

   Baralho de 40 cartas: só os meses 1 a 10 (ids 0 a 39). Valor da carta = número do mês (10 vale 10).
   Jogadores são cadeiras fixas 0..n-1. Em cada rodada uma cadeira é a banca (親 oya) e as outras são
   "filhos" (子 ko). Os filhos apostam fichas contra a banca. A banca passa para a cadeira seguinte a cada rodada.
   A banca nunca paga mais do que tem, e um filho nunca paga mais do que tem (as fichas só mudam de mão).

   Fases: 'aposta' (cada filho aposta) -> 'cartas' (cada um pede carta ou para) -> 'fimrod' (resultado em res).
   Ações: {t:'ap', v} aposta v fichas;  {t:'p'} pedir carta;  {t:'f'} parar.
   Mesma interface dos jogos de captura (novo, vez, acoes, aplicar, visao, determinizar, utilidade ...), mais
   escolher(estado, j, nivel, r) para o robô (níveis 1 a 5).
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };
  if (typeof require !== 'undefined' && typeof module !== 'undefined') require('./nucleo.js');
  const { mes, rng, proxSem, embaralhar } = HON;

  const BARALHO = []; for (let i = 0; i < 40; i++) BARALHO.push(i);
  const val = (c) => mes(c);
  const somaMao = (m) => m.reduce((s, c) => s + val(c), 0);
  const NOMES_DIGITO = ['Buta', 'Pin', 'Nizō', 'Santa', 'Yotsuya', 'Goke', 'Roppō', 'Shichiken', 'Oicho', 'Kabu'];
  const JP_DIGITO = ['ブタ', 'ピン', 'ニゾウ', 'サンタ', 'ヨツヤ', 'ゴケ', 'ロッポウ', 'シチケン', 'オイチョ', 'カブ'];

  function clonar(e) {
    return {
      jogo: e.jogo, n: e.n, banca: e.banca, fase: e.fase, vez: e.vez, rod: e.rod, rodadas: e.rodadas,
      fichas: e.fichas.slice(), apostas: e.apostas.slice(), mao: e.mao.map((m) => m.slice()), monte: e.monte.slice(),
      ordem: e.ordem.slice(), pos: e.pos, res: e.res, sem: e.sem, opc: e.opc, ev: [], parou: e.parou.slice()
    };
  }

  const ordemFilhos = (e) => { const l = []; for (let k = 1; k < e.n; k++) l.push((e.banca + k) % e.n); return l; };

  function criar(cfg) {
    /* ---------- avaliação das mãos ---------- */
    function yakuMao(mao, ehBanca) {
      const v = mao.map(val), n = mao.length, s = v.slice().sort((a, b) => a - b);
      const mesmo = n >= 2 && mao.every((c) => mes(c) === mes(mao[0]));
      const r = [];
      if (cfg.id === 'oichokabu') {
        if (n === 2) {
          if (ehBanca && s[0] === 1 && s[1] === 9) r.push({ nome: 'Kuppin', jp: '九ピン', mult: 2, imediato: true });
          else if (ehBanca && s[0] === 1 && s[1] === 4) r.push({ nome: 'Shippin', jp: '四ピン', mult: 2, imediato: true });
          if (mesmo && mes(mao[0]) === 2) r.push({ nome: 'Tsuru', jp: '鶴', mult: 2 });
          if (mesmo && mes(mao[0]) === 5) r.push({ nome: 'Gogo', jp: '五五', mult: 2 });
        } else if (n === 3) {
          if (s[0] === 1 && s[1] === 10 && s[2] === 10) r.push({ nome: 'Pin-zoro duplo', jp: 'ピンゾロ', mult: 5 });
          else if (mesmo) r.push({ nome: 'Arashi', jp: '嵐', mult: 3 });
          else if (s[0] === 4 && s[1] === 7 && s[2] === 9) r.push({ nome: 'Raijin', jp: '雷神', mult: 2 });
          else if (s[0] === 3 && s[1] === 7 && s[2] === 10) r.push({ nome: 'Fūjin', jp: '風神', mult: 2 });
          else if (v[0] === 1 && v[1] === 2 && v[2] === 3) r.push({ nome: 'Sequência subindo', jp: '上り', mult: 2 });
          else if (v[0] === 3 && v[1] === 2 && v[2] === 1) r.push({ nome: 'Sequência descendo', jp: '下り', mult: 2 });
        }
      } else {
        if (n === 2 && ehBanca && s[0] === 1 && s[1] === 9) r.push({ nome: 'Kuppin', jp: '九ピン', mult: 2, imediato: true });
        else if (n === 2 && ehBanca && s[0] === 1 && s[1] === 4) r.push({ nome: 'Shippin', jp: '四ピン', mult: 2, imediato: true });
        if (!ehBanca) {
          if (n === 3 && s[0] === 4 && s[1] === 5 && s[2] === 6) r.push({ nome: 'Shigoro', jp: '四五六', mult: 2 });
          else if (n === 3 && mesmo) r.push({ nome: 'Arashi', jp: '嵐', mult: 2 });
          else if (n === 5 && somaMao(mao) <= 15) r.push({ nome: 'Gomai', jp: '五枚', mult: 2 });
        }
      }
      return r;
    }
    const multYaku = (l) => l.reduce((m, y) => Math.max(m, y.mult), 0);

    function descreverMao(mao, ehBanca) {
      const s = somaMao(mao), y = yakuMao(mao, ehBanca);
      const d = s % 10;
      return { soma: s, digito: d, nomeDigito: NOMES_DIGITO[d], estouro: cfg.id === 'kingo' && s > 15, kingo: cfg.id === 'kingo' && s === 15, yaku: y };
    }

    /* ---------- o que cada um pode fazer ---------- */
    function podePedir(e, j) {
      const m = e.mao[j];
      if (!e.monte.length) return false;
      if (cfg.id === 'oichokabu') return m.length < 3 && !(somaMao(m) % 10 >= 7);
      const s = somaMao(m), banca = j === e.banca;
      if (s >= 15 || m.length >= 5) return false;
      return s < 15 && !(s >= 15);
    }
    function obrigadoPedir(e, j) {
      const m = e.mao[j];
      if (cfg.id === 'oichokabu') return m.length < 3 && somaMao(m) % 10 <= 3;
      const s = somaMao(m);
      return s < (j === e.banca ? 12 : 11) && m.length < 5;
    }
    // quando nada resta a decidir (3 cartas no Oicho-Kabu, 15 ou estouro no Kingo, ou parar é a única saída)
    function semEscolha(e, j) {
      const m = e.mao[j];
      if (cfg.id === 'oichokabu') return m.length >= 3 || (!podePedir(e, j) && !obrigadoPedir(e, j));
      const s = somaMao(m);
      return s >= 15 || m.length >= 5 || !e.monte.length;
    }
    function podeParar(e, j) { return !obrigadoPedir(e, j); }

    function tetoDe(e, j) {
      const filhos = e.n - 1;
      const porBanca = Math.max(1, Math.floor(e.fichas[e.banca] / filhos));
      return Math.max(0, Math.min(e.fichas[j], e.opc.teto, porBanca));
    }

    /* ---------- fluxo ---------- */
    function prepararRodada(e) {
      e.fase = 'aposta'; e.res = null; e.ev = [];
      e.apostas = new Array(e.n).fill(0);
      e.mao = []; for (let i = 0; i < e.n; i++) e.mao.push([]);
      e.parou = new Array(e.n).fill(false);
      e.sem = proxSem(e.sem);
      e.monte = embaralhar(BARALHO, rng(e.sem));
      e.ordem = ordemFilhos(e).filter((j) => e.fichas[j] > 0);
      e.pos = 0;
      e.vez = e.ordem.length ? e.ordem[0] : -1;
      if (!e.ordem.length) encerrar(e, 'Ninguém pode apostar.');
    }

    function distribuir(e) {
      const k = cfg.id === 'oichokabu' ? 2 : 1;
      const ord = e.ordem.concat([e.banca]);
      for (let r = 0; r < k; r++) ord.forEach((j) => { e.mao[j].push(e.monte.pop()); });
      e.ev.push({ t: 'dist', k });
      e.fase = 'cartas';
      e.ordem = ord; e.pos = 0;
      if (cfg.id === 'oichokabu') {
        const yb = yakuMao(e.mao[e.banca], true).find((y) => y.imediato);
        if (yb) { liquidar(e, yb); return; }
      }
      seguir(e);
    }

    // coloca a vez no próximo jogador que ainda decide; se ninguém mais, liquida
    function seguir(e) {
      for (;;) {
        if (e.pos >= e.ordem.length) { liquidar(e, null); return; }
        const j = e.ordem[e.pos];
        if (!semEscolha(e, j)) { e.vez = j; return; }
        e.pos++;
      }
    }

    function aplicarM(e, a) {
      e.ev = [];
      if (e.fase === 'aposta' && a.t === 'ap') {
        const j = e.vez;
        const t = tetoDe(e, j);
        const v = Math.max(1, Math.min(t, a.v | 0));
        e.apostas[j] = v;
        e.ev.push({ t: 'aposta', j, v });
        e.pos++;
        if (e.pos >= e.ordem.length) distribuir(e); else e.vez = e.ordem[e.pos];
      } else if (e.fase === 'cartas' && a.t === 'p') {
        const j = e.vez;
        if (!podePedir(e, j)) throw new Error('Não pode pedir carta');
        const c = e.monte.pop();
        e.mao[j].push(c);
        e.ev.push({ t: 'pede', j, c });
        if (cfg.id === 'kingo' && j === e.banca && e.mao[j].length === 2) {
          const yb = yakuMao(e.mao[j], true).find((y) => y.imediato);
          if (yb) { liquidar(e, yb); return e; }
        }
        if (semEscolha(e, j)) e.pos++;
        seguir(e);
      } else if (e.fase === 'cartas' && a.t === 'f') {
        const j = e.vez;
        if (!podeParar(e, j)) throw new Error('Não pode parar');
        e.parou[j] = true;
        e.ev.push({ t: 'para', j });
        e.pos++;
        seguir(e);
      } else throw new Error('Ação inválida na fase ' + e.fase + ': ' + JSON.stringify(a));
      return e;
    }
    const aplicar = (e, a) => aplicarM(clonar(e), a);

    function acoes(e) {
      if (e.fase === 'aposta') {
        const t = tetoDe(e, e.vez), l = [];
        for (let v = 1; v <= t; v++) l.push({ t: 'ap', v });
        return l.length ? l : [{ t: 'ap', v: 1 }];
      }
      if (e.fase === 'cartas') {
        const j = e.vez, l = [];
        if (podePedir(e, j)) l.push({ t: 'p' });
        if (podeParar(e, j)) l.push({ t: 'f' });
        return l;
      }
      return [];
    }

    /* ---------- resultado ---------- */
    function liquidar(e, imediato) {
      const b = e.banca, n = e.n;
      const info = e.mao.map((m, j) => descreverMao(m, j === b));
      const filhos = ordemFilhos(e).filter((j) => e.apostas[j] > 0);
      const dev = {}; // quanto cada filho deve (negativo = banca deve a ele), em fichas e com o motivo
      const notas = new Array(n).fill('');
      let motivo = '';
      filhos.forEach((j) => {
        const aposta = e.apostas[j], K = info[j], B = info[b];
        let mult = 1, kidGanha = false;
        if (imediato) { mult = imediato.mult; kidGanha = false; notas[j] = 'A banca fez ' + imediato.nome + '.'; }
        else if (cfg.id === 'oichokabu') {
          const yk = multYaku(K.yaku), yb = multYaku(B.yaku);
          if (yk || yb) {
            if (yk > yb) { kidGanha = true; mult = yk; notas[j] = 'Yaku ' + K.yaku[0].nome + '.'; }
            else { kidGanha = false; mult = yb || 1; notas[j] = yb ? 'Yaku da banca: ' + B.yaku[0].nome + '.' : ''; }
          } else if (K.digito > B.digito) { kidGanha = true; mult = 1; }
          else { kidGanha = false; mult = 1; }
        } else {
          const yk = multYaku(K.yaku);
          if (yk) { kidGanha = true; mult = yk; notas[j] = 'Yaku ' + K.yaku[0].nome + '.'; }
          else if (K.estouro) { kidGanha = false; mult = B.kingo ? 2 : 1; notas[j] = 'Estourou.'; }
          else if (B.estouro) { kidGanha = true; mult = K.kingo ? 2 : 1; notas[j] = 'A banca estourou.'; }
          else if (K.soma > B.soma) { kidGanha = true; mult = K.kingo ? 2 : 1; }
          else if (K.soma < B.soma) { kidGanha = false; mult = B.kingo ? 2 : 1; }
          else { kidGanha = false; mult = 1; notas[j] = 'Empate: a banca vence.'; }
        }
        dev[j] = { v: aposta * mult * (kidGanha ? -1 : 1), mult };
      });
      // primeiro a banca recebe dos que perderam, depois paga os que ganharam (nunca além do que tem)
      const f = e.fichas.slice(), g = new Array(n).fill(0);
      filhos.forEach((j) => {
        if (dev[j].v > 0) { const q = Math.min(dev[j].v, f[j]); f[j] -= q; f[b] += q; g[j] -= q; g[b] += q; if (q < dev[j].v) notas[j] += ' Pagou só o que tinha.'; }
      });
      filhos.forEach((j) => {
        if (dev[j].v < 0) { const q = Math.min(-dev[j].v, f[b]); f[b] -= q; f[j] += q; g[j] += q; g[b] -= q; if (q < -dev[j].v) notas[j] += ' A banca pagou só o que tinha.'; }
      });
      if (!filhos.length) motivo = 'Ninguém apostou.';
      else if (imediato) motivo = 'A banca revelou ' + imediato.nome + ' e recebe ' + imediato.mult + 'x a aposta de cada filho.';
      else motivo = 'Rodada resolvida: cada filho contra a banca.';
      const res = {
        ganhos: g, motivo, banca: b,
        jog: info.map((q, j) => ({ soma: q.soma, digito: q.digito, nomeDigito: q.nomeDigito, estouro: q.estouro, kingo: q.kingo, yaku: q.yaku, ganho: g[j], aposta: e.apostas[j], mult: dev[j] ? dev[j].mult : 0, nota: notas[j].trim(), cartas: e.mao[j].slice() }))
      };
      encerrar(e, motivo, res, f);
    }

    function encerrar(e, motivo, res, fichas) {
      if (fichas) e.fichas = fichas;
      e.res = res || { ganhos: new Array(e.n).fill(0), motivo, banca: e.banca, jog: [] };
      e.fase = 'fimrod'; e.vez = -1;
      e.ev.push({ t: 'pag', res: e.res });
    }

    function novo(op) {
      op = Object.assign({}, cfg.opcoesPadrao, op || {});
      const n = Math.max(cfg.minJ, Math.min(cfg.maxJ, op.jogadores || cfg.padraoJ));
      if (op.teto == null) op.teto = Math.max(1, Math.floor(op.fichas * 0.2));
      const sem = (op.semente == null ? HON.novaSemente() : op.semente) >>> 0;
      const e = {
        jogo: cfg.id, n, banca: op.banca != null ? op.banca : Math.floor(rng(sem)() * n), fase: 'aposta', vez: 0, rod: 1,
        rodadas: op.rodadas, fichas: new Array(n).fill(op.fichas), apostas: new Array(n).fill(0), mao: [], monte: [], ordem: [], pos: 0,
        res: null, sem, opc: op, ev: [], parou: []
      };
      prepararRodada(e);
      return e;
    }

    const fimRodada = (e) => e.fase === 'fimrod';
    function fimPartida(e) {
      return e.fase === 'fimrod' && (e.rod >= e.rodadas || e.fichas.some((f) => f <= 0));
    }
    function proximaRodada(e) {
      const p = clonar(e);
      p.rod += 1;
      let b = (p.banca + 1) % p.n;
      for (let k = 0; k < p.n && p.fichas[b] <= 0; k++) b = (b + 1) % p.n;
      p.banca = b;
      prepararRodada(p);
      return p;
    }
    const vez = (e) => (e.fase === 'fimrod' ? -1 : e.vez);

    function visao(e, j) {
      const v = clonar(e);
      if (e.fase !== 'fimrod') v.mao = v.mao.map((m, k) => (k === j ? m : m.map(() => -1)));
      v.monte = v.monte.map(() => -1);
      return v;
    }
    function determinizar(e, j, r) {
      const d = clonar(e);
      const vistas = new Set(d.mao[j]);
      const resto = embaralhar(BARALHO.filter((c) => !vistas.has(c)), r);
      for (let k = 0; k < d.n; k++) if (k !== j) d.mao[k] = resto.splice(0, d.mao[k].length);
      d.monte = resto.slice(0, d.monte.length);
      return d;
    }
    const utilidade = (e, j) => (e.res ? e.res.ganhos[j] : 0);

    /* ---------- robô ---------- */
    // política simples usada para completar as jogadas dos outros nas simulações
    function politicaFixa(e) {
      const a = acoes(e);
      if (a.length === 1) return a[0];
      const j = e.vez, m = e.mao[j];
      if (e.fase === 'aposta') return a[Math.max(0, Math.floor(a.length / 2) - 1)];
      let quer;
      if (cfg.id === 'oichokabu') quer = somaMao(m) % 10 <= 4;
      else quer = somaMao(m) < (j === e.banca ? 13 : 12);
      return a.find((x) => x.t === (quer ? 'p' : 'f')) || a[0];
    }
    function terminarSim(e, r) {
      let guarda = 0;
      while (e.fase === 'cartas' && guarda++ < 80) aplicarM(e, politicaFixa(e));
      return e;
    }
    function valorMC(e, j, acao, n, r) {
      let tot = 0;
      for (let i = 0; i < n; i++) {
        const d = determinizar(e, j, r);
        aplicarM(d, acao);
        terminarSim(d, r);
        tot += d.res ? d.res.ganhos[j] / Math.max(1, d.apostas[j] || 1) : 0;
      }
      return tot / n;
    }
    const AMOSTRAS = [0, 0, 0, 30, 80, 220];

    function escolher(e, j, nivel, r) {
      const a = acoes(e);
      if (a.length === 1) return a[0];
      if (e.fase === 'aposta') {
        const teto = a[a.length - 1].v;
        if (nivel <= 1) return a[Math.floor(r() * a.length)];
        if (nivel === 2) return a[Math.max(0, Math.ceil(teto / 2) - 1)];
        // avalia a vantagem de uma mão média contra a banca: simula a rodada com a política fixa
        let ganho = 0; const N = AMOSTRAS[nivel] || 30;
        for (let i = 0; i < N; i++) {
          const d = clonar(e);
          d.sem = proxSem(d.sem + i);
          d.monte = embaralhar(BARALHO, rng(d.sem));
          d.apostas[j] = 1;
          // apostas dos outros: 1 para simplificar
          d.ordem.forEach((k) => { if (!d.apostas[k]) d.apostas[k] = 1; });
          d.ordem = d.ordem.slice();
          const base = d.ordem.slice();
          d.mao = d.mao.map(() => []);
          distribuir(d);
          if (d.fase === 'cartas') { terminarSim(d, r); }
          if (d.res) ganho += d.res.ganhos[j];
          d.ordem = base;
        }
        const edge = ganho / N;
        const frac = edge > 0.15 ? 1 : edge > 0 ? 0.6 : edge > -0.15 ? 0.3 : 0.1;
        return a[Math.max(0, Math.min(a.length - 1, Math.round(teto * frac) - 1))];
      }
      if (nivel <= 1) return a[Math.floor(r() * a.length)];
      if (nivel === 2) return politicaFixa(e);
      let melhor = a[0], mv = -Infinity;
      const N = AMOSTRAS[nivel];
      a.forEach((x) => { const v = valorMC(e, j, x, N, r); if (v > mv) { mv = v; melhor = x; } });
      return melhor;
    }

    const mod = {
      cfg, id: cfg.id, novo, vez, acoes, aplicar, aplicarM, fimRodada, fimPartida, proximaRodada, visao, determinizar,
      utilidade, escolher, descreverMao, yakuMao, tetoDe, clonar, somaMao, escala: 1, assento: (e, j) => j,
      podePedir, obrigadoPedir, NOMES_DIGITO, JP_DIGITO
    };
    HON.jogos[cfg.id] = mod;
    return mod;
  }

  criar({ id: 'oichokabu', nome: 'Oicho-Kabu', minJ: 3, maxJ: 8, padraoJ: 4, opcoesPadrao: { rodadas: 10, fichas: 100 } });
  criar({ id: 'kingo', nome: 'Kingo', minJ: 2, maxJ: 10, padraoJ: 4, opcoesPadrao: { rodadas: 10, fichas: 100 } });
  HON.nomesKabu = ['oichokabu', 'kingo'];
  if (typeof module !== 'undefined' && module.exports) module.exports = HON;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis));
