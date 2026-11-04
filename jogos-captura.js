/* ==========================================================================
   HanafudaON! - jogos-captura.js (as regras dos 8 jogos de pescar, sobre o motor captura.js)

   Cada jogo: baralho usado, quantas cartas, valor de cada carta, combinações (yaku) e como se pontua.
   Pontos de uma rodada ("ganhos") somam no placar. Nos jogos de soma zero, o que um ganha os outros perdem.
   As referências de cada regra estão no Como Jogar do site e no LEIA-ME.
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };
  if (typeof require !== 'undefined' && typeof module !== 'undefined') { require('./nucleo.js'); require('./captura.js'); }
  const { mes, TIPOS, tem, conta, porMes, valorPadrao, ehKasuMao, C } = HON;

  const tudo = [];
  for (let i = 0; i < 48; i++) tudo.push(i);
  const sem = (...fora) => tudo.filter((c) => fora.indexOf(mes(c)) < 0);
  const soma = (l, f) => l.reduce((s, c) => s + f(c), 0);
  const zeros = (n) => new Array(n).fill(0);
  const argmax = (l) => l.reduce((b, v, i) => (v > l[b] ? i : b), 0);

  function montarRes(e, ganhos, o) {
    o = o || {};
    const val = o.valor || valorPadrao;
    let vencedor = o.vencedor;
    if (vencedor === undefined) {
      const max = Math.max.apply(null, ganhos);
      const q = ganhos.filter((g) => g === max).length;
      vencedor = q === 1 ? ganhos.indexOf(max) : null;
    }
    return {
      ganhos, vencedor, motivo: o.motivo || '',
      jog: e.capt.map((cs, j) => ({
        cartas: soma(cs, val), n: cs.length, yaku: (o.yaku && o.yaku[j]) || [],
        ganho: ganhos[j], nota: (o.nota && o.nota[j]) || ''
      }))
    };
  }

  /* ======================================================================
     1. KOI-KOI
     ====================================================================== */
  function yakuKoi(cs) {
    const r = [];
    const has = (...l) => tem(cs, ...l);
    const hik = cs.filter((c) => TIPOS[c] === 'h');
    const chuva = cs.indexOf(C.ONO) >= 0;
    if (hik.length === 5) r.push({ id: 'goko', nome: 'Gokō', pts: 10 });
    else if (hik.length === 4 && !chuva) r.push({ id: 'shiko', nome: 'Shikō', pts: 8 });
    else if (hik.length === 4) r.push({ id: 'ameshiko', nome: 'Ame-shikō', pts: 7 });
    else if (hik.length === 3 && !chuva) r.push({ id: 'sanko', nome: 'Sankō', pts: 5 });
    if (has(C.CORTINA, C.CALICE)) r.push({ id: 'hanami', nome: 'Hanami-zake', pts: 5 });
    if (has(C.LUA, C.CALICE)) r.push({ id: 'tsukimi', nome: 'Tsukimi-zake', pts: 5 });
    const tane = cs.filter((c) => TIPOS[c] === 't').length;
    if (has(20, 24, 36)) r.push({ id: 'inoshikacho', nome: 'Ino-shika-chō', pts: 5 + Math.max(0, tane - 3) });
    else if (tane >= 5) r.push({ id: 'tane', nome: 'Tane', pts: 1 + (tane - 5) });
    if (tane >= 5 && has(20, 24, 36)) r.push({ id: 'tane', nome: 'Tane', pts: 1 + (tane - 5) });
    const fitas = cs.filter((c) => TIPOS[c] === 'z').length;
    if (has(1, 5, 9)) r.push({ id: 'akatan', nome: 'Akatan', pts: 5 });
    if (has(21, 33, 37)) r.push({ id: 'aotan', nome: 'Aotan', pts: 5 });
    if (fitas >= 5) r.push({ id: 'tanzaku', nome: 'Tanzaku', pts: 1 + (fitas - 5) });
    const kasu = cs.filter((c) => TIPOS[c] === 'k').length;
    if (kasu >= 10) r.push({ id: 'kasu', nome: 'Kasu', pts: 1 + (kasu - 10) });
    return r;
  }
  const somaYaku = (l) => l.reduce((s, y) => s + y.pts, 0);

  const koikoi = HON.criarCaptura({
    id: 'koikoi', nome: 'Koi-Koi', minJ: 2, maxJ: 2, padraoJ: 2, escala: 12,
    opcoesPadrao: { rodadas: 3 },
    baralho: () => tudo,
    maoCampo: () => [8, 8],
    xInicial: () => ({ koi: [false, false], ult: [0, 0], dec: null }),
    aoDistribuir(e, mod) {
      const bom = e.mao.map((m) => {
        const mc = porMes(m);
        const k = Object.keys(mc).map((q) => mc[q].length);
        if (k.some((q) => q === 4)) return 'Teshi (quatro cartas do mesmo mês)';
        if (k.length === 4 && k.every((q) => q === 2)) return 'Kuttsuki (quatro pares)';
        return '';
      });
      if (!bom[0] && !bom[1]) return;
      const g = [0, 0];
      let v = null;
      if (bom[0] && !bom[1]) { g[0] = 6; v = 0; } else if (bom[1] && !bom[0]) { g[1] = 6; v = 1; }
      mod.terminar(e, montarRes(e, g, { vencedor: v, motivo: v === null ? 'As duas mãos tinham combinação de saída: rodada empatada.' : bom[v], nota: bom }));
    },
    aposTurno(e, j, mod) {
      const y = yakuKoi(e.capt[j]);
      const tot = somaYaku(y);
      if (tot > e.x.ult[j]) {
        if (!e.mao[j].length) { fechaKoi(e, j, y, mod); return; }
        e.x.dec = { j, tot, yaku: y };
        e.fase = 'decidir';
        e.ev.push({ t: 'yaku', j, yaku: y, tot });
      }
    },
    acoesDecisao: () => [{ t: 'd', k: 'koi' }, { t: 'd', k: 'parar' }],
    decidir(e, a, mod) {
      const d = e.x.dec, j = d.j;
      if (a.k === 'parar') { fechaKoi(e, j, d.yaku, mod); return; }
      e.x.koi[j] = true;
      e.x.ult[j] = d.tot;
      e.x.dec = null;
      e.ev.push({ t: 'koi', j });
      mod.avancar(e);
    },
    fechar(e) { return montarRes(e, zeros(e.n), { vencedor: null, motivo: 'Acabaram as cartas sem ninguém fechar: rodada empatada.' }); },
    proxOya(p, res) { return res && res.vencedor != null ? p.assentos[res.vencedor] : p.oya; }
  });
  function fechaKoi(e, j, y, mod) {
    const base = somaYaku(y);
    let m = 1;
    const notas = [];
    if (base >= 7) { m *= 2; notas.push('7 pontos ou mais: dobra'); }
    if (e.x.koi[0] || e.x.koi[1]) { m *= 2; notas.push('houve Koi-Koi: dobra'); }
    const g = zeros(e.n); g[j] = base * m;
    const nota = []; nota[j] = notas.join('; ');
    const yy = []; yy[j] = y;
    mod.terminar(e, montarRes(e, g, { vencedor: j, motivo: 'Fechou com ' + base + (m > 1 ? ' x ' + m : '') + ' = ' + base * m + ' pontos.', yaku: yy, nota }));
  }
  koikoi.yaku = yakuKoi;

  /* ======================================================================
     MÃOS INICIAIS (Hachi-Hachi e Sudaoshi)
     ====================================================================== */
  function teyakuHH(mao) {
    const mc = porMes(mao);
    const cont = Object.keys(mc).map((m) => mc[m].length).sort((a, b) => b - a);
    const r = [];
    const c3 = cont.filter((q) => q === 3).length, c2 = cont.filter((q) => q === 2).length, c4 = cont.filter((q) => q === 4).length;
    if (c4 && c3) r.push({ nome: 'Shishi', kan: 20, jp: 'シシ' });
    else if (c4 && c2) r.push({ nome: 'Ichi-ni-shi', kan: 8, jp: '一二四' });
    else if (c4) r.push({ nome: 'Teshi', kan: 6, jp: '手四' });
    if (c3 === 1 && c2 === 2) r.push({ nome: 'Hanekken', kan: 7, jp: '羽拳' });
    else if (c3 === 2) r.push({ nome: 'Futa-sanbon', kan: 6, jp: '二三本' });
    else if (c3 === 1) r.push({ nome: 'Sanbon', kan: 2, jp: '三本' });
    if (c2 === 3 && c3 === 0 && c4 === 0) r.push({ nome: 'Kuttsuki', kan: 4, jp: 'くっつき' });
    const fora = mao.filter((c) => !ehKasuMao(c));
    if (!fora.length) r.push({ nome: 'Karasu', kan: 4, jp: '烏' });
    else if (fora.length === 1) {
      const v = valorPadrao(fora[0]);
      if (v === 20) r.push({ nome: 'Hikari-ichi', kan: 4, jp: '光一' });
      else if (v === 10) r.push({ nome: 'Tōichi', kan: 3, jp: '十一' });
      else if (v === 5) r.push({ nome: 'Tan-ichi', kan: 3, jp: '短一' });
    } else if (fora.every((c) => valorPadrao(c) === 5)) r.push({ nome: 'Aka', kan: 2, jp: '赤' });
    return r;
  }

  const KAN = 12; // 1 kan = 12 pontos

  /* ======================================================================
     2. HACHI-HACHI
     ====================================================================== */
  function dekiHH(cs) {
    let m = null;
    const poe = (nome, jp, kan) => { if (!m || kan > m.kan) m = { nome, jp, kan }; };
    const hik = cs.filter((c) => TIPOS[c] === 'h');
    if (hik.length === 5) poe('Gokō', '五光', 12);
    if (tem(cs, 0, 8, 28, 44)) poe('Shikō', '四光', 10);
    const fitas = cs.filter((c) => TIPOS[c] === 'z' && mes(c) !== 11).length;
    if (fitas >= 7) poe('Nanatan', '七短', 10);
    if (tem(cs, 1, 5, 9)) poe('Aka-tan', '赤短', 7);
    if (tem(cs, 21, 33, 37)) poe('Ao-tan', '青短', 7);
    return m;
  }
  function fimDekiHH(cs, valor) {
    const r = [];
    const pts = soma(cs, valor);
    if (pts >= 168) r.push({ nome: 'Ni-hachi', jp: '二八', kan: 10 + (pts - 168) });
    const k = cs.filter((c) => TIPOS[c] === 'k').length;
    if (k >= 16) r.push({ nome: 'Suji-roku', jp: '素十六', kan: 12 + 2 * (k - 16) });
    return r;
  }

  function cobrarDe(g, j, quanto, de) {
    // j recebe "quanto" de cada um dos outros (ou só de "de")
    for (let k = 0; k < g.length; k++) {
      if (k === j) continue;
      if (de != null && de !== k) continue;
      g[j] += quanto; g[k] -= quanto;
    }
  }

  const hachihachi = HON.criarCaptura({
    id: 'hachihachi', nome: 'Hachi-Hachi', minJ: 3, maxJ: 6, maxMesa: 6, padraoJ: 3, escala: 150,
    opcoesPadrao: { rodadas: 6 },
    ativos: () => 3,
    baralho: () => tudo,
    maoCampo: () => [7, 6],
    xInicial: (e) => ({
      mult: 1, forca: (e.x && e.x.forcaProx) || 1, forcaProx: 1, teyaku: [[], [], []], pag: [0, 0, 0],
      val: [0, 0, 0], sage: -1, sageKan: 0, dec: null
    }),
    aoDistribuir(e) {
      const x = e.x;
      const grande = e.campo.filter((c) => c === 0 || c === 8 || c === 28).length;
      const absoluta = e.campo.filter((c) => c === 40 || c === 44).length;
      let m = absoluta ? 4 : (grande ? 2 : 1);
      m = Math.max(m, x.forca);
      x.mult = m;
      x.forcaProx = absoluta >= 2 ? 4 : (grande >= 2 ? 2 : 1);
      for (let j = 0; j < 3; j++) {
        x.teyaku[j] = teyakuHH(e.mao[j]);
        const kan = x.teyaku[j].reduce((s, y) => s + y.kan, 0);
        if (kan) cobrarDe(x.pag, j, kan * KAN * m);
      }
    },
    aposTurno(e, j, mod) {
      const x = e.x, d = dekiHH(e.capt[j]);
      if (!d || d.kan <= x.val[j]) return;
      x.val[j] = d.kan;
      const v = d.kan * KAN * x.mult;
      if (x.sage >= 0 && x.sage !== j) {
        const g = x.pag.slice(); cobrarDe(g, j, 2 * v, x.sage);
        mod.terminar(e, resHH(e, g, 'yaku', { j, d, nota: 'formou ' + d.nome + ' depois do sage: quem deu sage paga as duas partes' }));
        return;
      }
      if (x.sage === j) {
        const g = x.pag.slice(); cobrarDe(g, j, v);
        mod.terminar(e, resHH(e, g, 'yaku', { j, d, nota: 'melhorou o yaku depois do sage' }));
        return;
      }
      if (!e.mao[j].length) {
        const g = x.pag.slice(); cobrarDe(g, j, v);
        mod.terminar(e, resHH(e, g, 'yaku', { j, d }));
        return;
      }
      x.dec = { j, d };
      e.fase = 'decidir';
      e.ev.push({ t: 'yaku', j, yaku: [{ nome: d.nome, pts: d.kan, jp: d.jp }], tot: d.kan });
    },
    acoesDecisao: () => [{ t: 'd', k: 'parar' }, { t: 'd', k: 'sage' }],
    decidir(e, a, mod) {
      const x = e.x, { j, d } = x.dec;
      x.dec = null;
      if (a.k === 'parar') {
        const g = x.pag.slice(); cobrarDe(g, j, d.kan * KAN * x.mult);
        mod.terminar(e, resHH(e, g, 'yaku', { j, d }));
        return;
      }
      x.sage = j; x.sageKan = d.kan;
      e.ev.push({ t: 'sage', j });
      mod.avancar(e);
    },
    fechar(e, mod) {
      const x = e.x, g = x.pag.slice(), n = e.n;
      const fim = e.capt.map((cs) => fimDekiHH(cs, valorPadrao));
      if (fim.some((l) => l.length)) {
        const g2 = zeros(n);
        fim.forEach((l, j) => l.forEach((y) => cobrarDe(g2, j, y.kan * KAN * x.mult)));
        return resHH(e, g2, 'fimyaku', { fim, nota: 'yaku de fim de rodada cancela as mãos iniciais' });
      }
      for (let j = 0; j < n; j++) g[j] += (soma(e.capt[j], valorPadrao) - 88) * x.mult;
      if (x.sage >= 0) cobrarDe(g, x.sage, Math.floor(x.sageKan * KAN * x.mult / 2));
      return resHH(e, g, 'cartas', { nota: x.sage >= 0 ? 'quem deu sage não melhorou: recebe só metade' : '' });
    },
    proxOya: (p) => (p.oya + 1) % p.mesa
  });
  function resHH(e, g, como, o) {
    const x = e.x;
    const yaku = [[], [], []], nota = [];
    x.teyaku.forEach((l, j) => { yaku[j] = (como === 'fimyaku') ? [] : l.map((y) => ({ nome: y.nome, jp: y.jp, pts: y.kan, mao: true })); });
    if (o.j != null) yaku[o.j] = yaku[o.j].concat([{ nome: o.d.nome, jp: o.d.jp, pts: o.d.kan }]);
    if (o.fim) o.fim.forEach((l, j) => { yaku[j] = l.map((y) => ({ nome: y.nome, jp: y.jp, pts: y.kan })); });
    if (o.nota) nota[o.j != null ? o.j : 0] = o.nota;
    const motivo = como === 'yaku' ? ('Rodada encerrada por ' + o.d.nome + '.') : como === 'fimyaku' ? 'Rodada encerrada por yaku de fim de rodada.' : 'Rodada jogada até o fim: pontos das cartas menos 88.';
    return montarRes(e, g, { motivo: motivo + (x.mult > 1 ? ' Taxa x' + x.mult + '.' : ''), yaku, nota });
  }
  hachihachi.teyaku = teyakuHH; hachihachi.deki = dekiHH;

  /* ======================================================================
     3. HANA-AWASE
     ====================================================================== */
  function yakuHana(cs) {
    const r = [];
    const has = (...l) => tem(cs, ...l);
    const hik = cs.filter((c) => TIPOS[c] === 'h');
    if (hik.length === 5) r.push({ nome: 'Gokō', jp: '五光', pts: 200 });
    else if (has(0, 8, 28, 44)) r.push({ nome: 'Shikō', jp: '四光', pts: 60 });
    const fitas = cs.filter((c) => TIPOS[c] === 'z' && mes(c) !== 11).length;
    if (fitas >= 7) r.push({ nome: 'Nanatan', jp: '七短', pts: 40 });
    else if (fitas >= 6) r.push({ nome: 'Rokutan', jp: '六短', pts: 30 });
    if (has(1, 5, 9)) r.push({ nome: 'Akatan', jp: '赤短', pts: 40 });
    if (has(21, 33, 37)) r.push({ nome: 'Aotan', jp: '青短', pts: 40 });
    if (has(8, 28, 32)) r.push({ nome: 'Nomi', jp: '呑み', pts: 30 });
    else {
      if (has(8, 32)) r.push({ nome: 'Hanami-zake', jp: '花見酒', pts: 20 });
      if (has(28, 32)) r.push({ nome: 'Tsukimi-zake', jp: '月見酒', pts: 20 });
    }
    if (has(0, 4, 8)) r.push({ nome: 'Omote-Sugawara', jp: '表菅原', pts: 30 });
    if (has(0, 28, 44)) r.push({ nome: 'Matsu-kiri-bōzu', jp: '松桐坊主', pts: 20 });
    if (has(20, 24, 36)) r.push({ nome: 'Ino-shika-chō', jp: '猪鹿蝶', pts: 20 });
    if (has(13, 17, 25)) r.push({ nome: 'Kusa-tan', jp: '草短', pts: 20 });
    if (has(12, 13, 14, 15)) r.push({ nome: 'Fuji-shima', jp: '藤シマ', pts: 20 });
    if (has(44, 45, 46, 47)) r.push({ nome: 'Kiri-shima', jp: '桐シマ', pts: 20 });
    if (has(40, 41, 42, 43)) r.push({ nome: 'Ame-shima', jp: '雨シマ', pts: 20 });
    return r;
  }
  const hanaawase = HON.criarCaptura({
    id: 'hanaawase', nome: 'Hana-Awase', minJ: 3, maxJ: 4, padraoJ: 3, escala: 60,
    opcoesPadrao: { rodadas: 6 },
    baralho: () => tudo,
    maoCampo: (n) => (n === 3 ? [7, 6] : [5, 8]),
    fechar(e) {
      const n = e.n, base = 264 / n;
      const ys = e.capt.map(yakuHana), yp = ys.map(somaYaku);
      const g = [];
      for (let j = 0; j < n; j++) {
        let v = soma(e.capt[j], valorPadrao) - base + yp[j] * (n - 1);
        for (let k = 0; k < n; k++) if (k !== j) v -= yp[k];
        g.push(v);
      }
      return montarRes(e, g, { motivo: 'Rodada jogada até o fim: pontos das cartas menos ' + base + ', mais os yaku.', yaku: ys });
    }
  });
  hanaawase.yaku = yakuHana;

  /* ======================================================================
     9. BAKAPPANA
     ====================================================================== */
  const bakappana = HON.criarCaptura({
    id: 'bakappana', nome: 'Bakappana', minJ: 2, maxJ: 4, padraoJ: 2, escala: 60,
    opcoesPadrao: { rodadas: 3 },
    baralho: () => tudo,
    maoCampo: (n) => (n === 2 ? [10, 8] : n === 3 ? [7, 6] : [5, 8]),
    fechar(e) {
      const n = e.n, base = 264 / n;
      const g = e.capt.map((cs) => soma(cs, valorPadrao) - base);
      return montarRes(e, g, { motivo: 'Vence quem somar mais pontos nas cartas capturadas (a média é ' + base + ').' });
    }
  });

  /* ======================================================================
     5. MUSHI
     ====================================================================== */
  function yakuMushi(cs) {
    const r = [], has = (...l) => tem(cs, ...l);
    if (has(0, 8, 28, 40, 44)) r.push({ nome: 'Gokō', jp: '五光', pts: 30 });
    if (has(0, 4, 8)) r.push({ nome: 'Omote-Sugawara', jp: '表菅原', pts: 25 });
    if (has(12, 13, 14, 15)) r.push({ nome: 'Fuji-shima', jp: '藤シマ', pts: 10 });
    if (has(44, 45, 46, 47)) r.push({ nome: 'Kiri-shima', jp: '桐シマ', pts: 10 });
    return r;
  }
  const mushi = HON.criarCaptura({
    id: 'mushi', nome: 'Mushi', minJ: 2, maxJ: 2, padraoJ: 2, escala: 60,
    opcoesPadrao: { rodadas: 6 },
    baralho: () => sem(6, 7),
    maoCampo: () => [8, 8],
    coringa: { id: C.RAIO, alvo: (x) => mes(x) !== 11, trio: true, soDoMonte: true },
    fechar(e) {
      const ys = e.capt.map(yakuMushi), yp = ys.map(somaYaku);
      const g = e.capt.map((cs, j) => soma(cs, valorPadrao) - 115 + yp[j] - yp[1 - j]);
      return montarRes(e, g, { motivo: 'Vence quem passar de 115 pontos (o total do baralho é 230), contando os yaku.', yaku: ys });
    }
  });
  mushi.yaku = yakuMushi;

  /* ======================================================================
     6. ROPPYAKKEN
     ====================================================================== */
  function valorR(c) {
    if (c === 0 || c === 8 || c === 28 || c === 40 || c === 44 || c === 4) return 50;
    const t = TIPOS[c];
    if (t === 't' || t === 'z' || c === C.KASU_AMARELO) return 10;
    return 0;
  }
  function yakuRoppy(cs) {
    const r = [], has = (...l) => tem(cs, ...l);
    const fitas = cs.filter((c) => TIPOS[c] === 'z').length;
    const chuva = cs.some((c) => mes(c) === 11);
    const sol = has(0);
    if (has(0, 8, 28, 44)) r.push({ nome: 'Shikō', jp: '四光', pts: 600, fim: true });
    else if (fitas >= 7) r.push({ nome: 'Shichitan', jp: '七短', pts: 600, fim: true });
    if (has(0, 28, 44)) r.push({ nome: 'Matsu-kiri-bōzu', jp: '松桐坊主', pts: 150 });
    if (has(0, 4, 8)) r.push({ nome: 'Ōzan', jp: '表菅原', pts: 100 });
    if (has(20, 24, 36)) r.push({ nome: 'Ino-shika-chō', jp: '猪鹿蝶', pts: 300 });
    if (has(1, 5, 9)) r.push({ nome: 'Kōzan', jp: '赤短', pts: 150 });
    if (has(21, 33, 37)) r.push({ nome: 'Aotan', jp: '青短', pts: 200 });
    if (has(13, 17, 25)) r.push({ nome: 'Kusatan', jp: '草短', pts: 100 });
    const anula = chuva && !sol;
    if (!anula) {
      if (has(8, 28, 32)) r.push({ nome: 'Teppō', jp: '鉄砲', pts: 300 });
      else {
        if (has(8, 32)) r.push({ nome: 'Hanami-zake', jp: '花見酒', pts: 100 });
        if (has(28, 32)) r.push({ nome: 'Tsukimi-zake', jp: '月見酒', pts: 100 });
      }
    }
    if (has(40, 41, 42, 43)) r.push({ nome: 'Ni-zoro', jp: '二ゾロ', pts: 200 });
    [1, 2, 3, 8, 10, 12].forEach((m) => { if (has(4 * m - 4, 4 * m - 3, 4 * m - 2, 4 * m - 1)) r.push({ nome: 'Shima ' + HON.MESES_PT[m], jp: 'シマ', pts: 50 }); });
    return r;
  }
  function teyakuRoppy(mao) {
    const r = [], mc = porMes(mao);
    if (Object.keys(mc).some((m) => mc[m].length === 3)) r.push({ nome: 'Te-san', jp: '手三', pts: 200 });
    if (mao.every((c) => valorR(c) === 0)) r.push({ nome: 'Sō-gasu', jp: '総カス', pts: 400 });
    return r;
  }
  const roppyakken = HON.criarCaptura({
    id: 'roppyakken', nome: 'Roppyakken', minJ: 2, maxJ: 3, padraoJ: 2, escala: 400, valor: valorR,
    opcoesPadrao: { rodadas: 12, meta: 600 },
    baralho: () => tudo,
    maoCampo: (n) => (n === 2 ? [8, 8] : [7, 6]),
    coringa: { id: C.ONO, alvo: (x) => valorR(x) > 0, trio: false, soDoMonte: false },
    refazer: (e) => e.mao.some((m) => { const mc = porMes(m); return Object.keys(mc).some((q) => mc[q].length === 4); }),
    xInicial: () => ({ teyaku: [], fim: -1 }),
    aoDistribuir(e) { e.x.teyaku = e.mao.map(teyakuRoppy); },
    aposTurno(e, j, mod) {
      if (e.x.fim >= 0) return;
      if (yakuRoppy(e.capt[j]).some((y) => y.fim)) {
        e.x.fim = j;
        mod.terminar(e, fechaRoppy(e, j));
      }
    },
    fechar: (e) => fechaRoppy(e, -1),
    fimPartida(e) {
      const meta = e.opc.meta || 600;
      return e.rod >= e.rodadas || e.pts.some((p) => p >= meta);
    }
  });
  function fechaRoppy(e, instante) {
    const ys = e.capt.map(yakuRoppy);
    const tys = e.x.teyaku.map((l) => l || []);
    const pc = e.capt.map((cs) => soma(cs, valorR));
    const semNov = e.capt.map((cs) => soma(cs.filter((c) => mes(c) !== 11 && mes(c) !== 12), valorR));
    if (instante < 0 && semNov.some((p) => p <= 30)) {
      return montarRes(e, zeros(e.n), { vencedor: null, motivo: 'Fuke: alguém ficou com 30 pontos ou menos (sem salgueiro e paulównia). A rodada é anulada.' });
    }
    const g = pc.map((p, j) => p + somaYaku(ys[j]) + somaYaku(tys[j]));
    const yy = ys.map((l, j) => l.concat(tys[j].map((y) => Object.assign({ mao: true }, y))));
    const mot = instante >= 0 ? 'Rodada encerrada na hora por ' + ys[instante].find((y) => y.fim).nome + '.' : 'Rodada jogada até o fim: cartas, yaku e mãos iniciais.';
    return montarRes(e, g, { valor: valorR, motivo: mot, yaku: yy, vencedor: instante >= 0 ? instante : undefined });
  }
  roppyakken.yaku = yakuRoppy; roppyakken.valorR = valorR;

  /* ======================================================================
     7. SUDAOSHI
     ====================================================================== */
  function valorS(c) {
    const t = TIPOS[c];
    if (t === 'k') return 10;
    if (t === 'z') return 1;
    if (t === 't') return 5;
    return (c === 8 || c === 44) ? 10 : 5;
  }
  const ORIGEM = [100, 110, 120];
  function yakuSuda(cs, j) {
    const r = [], has = (...l) => tem(cs, ...l);
    if (has(28, 29, 30, 31)) r.push({ nome: 'Bōzu-zoro', jp: '坊主ゾロ', kan: 2 });
    else if (has(28, 29)) r.push({ nome: 'Bōzu-kaburi', jp: '坊主被り', kan: 1 });
    if (j === 2) {
      if (has(40, 41, 42, 43)) r.push({ nome: 'Ame-zoro', jp: '雨ゾロ', kan: 2 });
      else if (has(40, 41)) r.push({ nome: 'Ame-kaburi', jp: '雨被り', kan: 1 });
    }
    return r;
  }
  const sudaoshi = HON.criarCaptura({
    id: 'sudaoshi', nome: 'Sudaoshi', minJ: 3, maxJ: 6, maxMesa: 6, padraoJ: 3, escala: 40, valor: valorS,
    opcoesPadrao: { rodadas: 6 },
    ativos: () => 3,
    baralho: () => tudo,
    maoCampo: () => [7, 6],
    xInicial: () => ({ teyaku: [[], [], []], pag: [0, 0, 0] }),
    aoDistribuir(e) {
      for (let j = 0; j < 3; j++) {
        e.x.teyaku[j] = teyakuHH(e.mao[j]);
        const kan = e.x.teyaku[j].reduce((s, y) => s + y.kan, 0);
        if (kan) cobrarDe(e.x.pag, j, kan * KAN);
      }
    },
    fechar(e) {
      const g = e.x.pag.slice(), ys = [];
      for (let j = 0; j < 3; j++) {
        g[j] += soma(e.capt[j], valorS) - ORIGEM[j];
        const y = yakuSuda(e.capt[j], j);
        ys[j] = e.x.teyaku[j].map((q) => ({ nome: q.nome, jp: q.jp, pts: q.kan, mao: true })).concat(y.map((q) => ({ nome: q.nome, jp: q.jp, pts: q.kan })));
        const kan = y.reduce((s, q) => s + q.kan, 0);
        if (kan) cobrarDe(g, j, kan * KAN);
      }
      return montarRes(e, g, { valor: valorS, motivo: 'Rodada jogada até o fim. Cartas contam ao contrário (kasu valem mais). Cada cadeira tem uma origem: 100, 110 e 120.', yaku: ys });
    }
  });
  sudaoshi.valorS = valorS; sudaoshi.ORIGEM = ORIGEM; sudaoshi.yaku = yakuSuda;

  /* ======================================================================
     8. TENSHO
     ====================================================================== */
  const tensho = HON.criarCaptura({
    id: 'tensho', nome: 'Tensho', minJ: 2, maxJ: 2, padraoJ: 2, escala: 100,
    opcoesPadrao: { rodadas: 6 },
    baralho: () => sem(11, 12),
    maoCampo: () => [8, 8],
    xInicial: () => ({ ten: [[], []] }),
    aposTurno(e, j) {
      for (let m = 1; m <= 10; m++) {
        if (e.x.ten[j].indexOf(m) >= 0) continue;
        if (tem(e.capt[j], 4 * m - 4, 4 * m - 3, 4 * m - 2, 4 * m - 1)) {
          e.x.ten[j].push(m);
          e.ev.push({ t: 'ten', j, m });
        }
      }
    },
    fechar(e) {
      const tot = e.capt.map((cs, j) => soma(cs, valorPadrao) + 10 * e.x.ten[j].length);
      const g = [tot[0] - tot[1], tot[1] - tot[0]];
      const yy = e.x.ten.map((l) => l.map((m) => ({ nome: 'Ten (' + HON.MESES_PT[m] + ')', jp: '天', pts: 10 })));
      return montarRes(e, g, { motivo: 'Vence quem somar mais: cartas capturadas mais 10 por mês completo (Ten).', yaku: yy });
    }
  });

  HON.nomesCaptura = ['koikoi', 'hachihachi', 'hanaawase', 'mushi', 'roppyakken', 'sudaoshi', 'tensho', 'bakappana'];
  if (typeof module !== 'undefined' && module.exports) module.exports = HON;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis));
