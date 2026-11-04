/* ==========================================================================
   HanafudaON! - robo.js (o computador: 5 níveis para qualquer jogo de captura)

   Nível 1: joga ao acaso (só as ações permitidas).
   Nível 2: guloso com erros (em 35% das jogadas escolhe qualquer uma).
   Nível 3: guloso, escolhe a ação que leva as cartas mais valiosas na hora.
   Níveis 4 e 5: ISMCTS (busca em árvore com informação oculta): sorteia várias mãos possíveis do
   adversário e do monte, simula partidas inteiras e escolhe a ação que mais rendeu (4: 700 simulações,
   5: 2200, com limite de tempo).
   Os jogos de apostas (kabu.js) trazem o próprio escolher().

   Uso: HON.escolher(idDoJogo, estado, j, nivel, semente) -> uma das ações de acoes(estado)
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };
  if (typeof require !== 'undefined' && typeof module !== 'undefined') { require('./nucleo.js'); }
  const { rng } = HON;
  const agora = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

  const ITER = [0, 0, 0, 0, 700, 2200];
  const TEMPO = [0, 0, 0, 0, 1600, 3000];

  const chave = (a) => a.t + (a.c != null ? a.c : '') + ':' + (a.a != null ? a.a : '') + (a.k || '');

  // quanto vale, na hora, a ação (para o nível 2 e para dirigir as simulações)
  function heuristica(jogo, e, a) {
    const val = jogo.valor;
    if (a.t === 'j') {
      const op = jogo.opcoes(e, a.c, 'mao');
      const o = op.find((q) => q.a === a.a);
      if (!o) return -val(a.c) * 0.6 - 0.1;
      return val(a.c) + o.leva.reduce((s, c) => s + val(c), 0) + 1;
    }
    if (a.t === 'v') {
      const op = jogo.opcoes(e, e.pend.v, 'monte');
      const o = op.find((q) => q.a === a.a);
      return o ? o.leva.reduce((s, c) => s + val(c), 0) : 0;
    }
    return 0;
  }

  function politicaSim(jogo, e, r) {
    const a = jogo.acoes(e);
    if (a.length === 1) return a[0];
    if (e.fase === 'decidir') return a[Math.floor(r() * a.length)];
    // 92%: a melhor pela heurística; 8%: qualquer uma
    if (r() < 0.08) return a[Math.floor(r() * a.length)];
    let b = a[0], bv = -1e9;
    for (let i = 0; i < a.length; i++) { const v = heuristica(jogo, e, a[i]) + r() * 0.5; if (v > bv) { bv = v; b = a[i]; } }
    return b;
  }

  function ismcts(jogo, e, j, nivel, r) {
    const raiz = { n: 0, w: 0, f: {} };
    const esc = jogo.escala || 30;
    const limite = ITER[nivel], t0 = agora(), tmax = TEMPO[nivel];
    const aval = (s, p) => {
      const u = jogo.utilidade(s, p) / esc;
      return 0.5 + 0.5 * Math.max(-1, Math.min(1, u));
    };
    for (let it = 0; it < limite; it++) {
      if ((it & 15) === 15 && agora() - t0 > tmax) break;
      let s = jogo.determinizar(e, j, r);
      let no = raiz;
      const caminho = [];
      // seleção e expansão
      while (jogo.vez(s) >= 0) {
        const acs = jogo.acoes(s), quem = jogo.vez(s);
        let novo = null;
        const livres = [];
        for (let i = 0; i < acs.length; i++) {
          const k = chave(acs[i]);
          const f = no.f[k];
          if (!f) livres.push(acs[i]); else f.disp++;
        }
        if (livres.length) {
          // expande primeiro as ações que a heurística gosta mais
          let a = livres[0], av = -1e9;
          for (let i = 0; i < livres.length; i++) { const h = heuristica(jogo, s, livres[i]) + r() * 3; if (h > av) { av = h; a = livres[i]; } }
          novo = { n: 0, w: 0, f: {}, disp: 1, quem };
          no.f[chave(a)] = novo;
          caminho.push(novo);
          s = jogo.aplicar(s, a);
          no = novo;
          break;
        }
        let melhor = null, mv = -1;
        let hmax = 1;
        const hs = acs.map((a) => { const h = heuristica(jogo, s, a); if (h > hmax) hmax = h; return h; });
        for (let i = 0; i < acs.length; i++) {
          const f = no.f[chave(acs[i])];
          const v = f.w / f.n + 0.7 * Math.sqrt(Math.log(f.disp) / f.n) + 0.5 * Math.max(0, hs[i]) / hmax / (f.n + 1);
          if (v > mv) { mv = v; melhor = acs[i]; }
        }
        const f = no.f[chave(melhor)];
        caminho.push(f);
        s = jogo.aplicar(s, melhor);
        no = f;
      }
      // simulação
      let guarda = 0;
      while (jogo.vez(s) >= 0 && guarda++ < 300) jogo.aplicarM(s, politicaSim(jogo, s, r));
      // retropropagação (cada nó recebe o resultado de quem fez a jogada que levou a ele)
      for (let i = 0; i < caminho.length; i++) { const f = caminho[i]; f.n++; f.w += aval(s, f.quem); }
      raiz.n++;
    }
    const acs = jogo.acoes(e);
    let melhor = acs[0], mn = -1;
    acs.forEach((a) => { const f = raiz.f[chave(a)]; if (f && f.n > mn) { mn = f.n; melhor = a; } });
    return melhor;
  }

  function escolher(id, e, j, nivel, semente) {
    const jogo = HON.jogos[id];
    const r = rng(semente == null ? HON.novaSemente() : semente);
    if (jogo.escolher) return jogo.escolher(e, j, nivel, r);
    const acs = jogo.acoes(e);
    if (acs.length === 1) return acs[0];
    if (nivel <= 1) return acs[Math.floor(r() * acs.length)];
    if (nivel <= 3) {
      if (nivel === 2 && r() < 0.35) return acs[Math.floor(r() * acs.length)];
      let b = acs[0], bv = -1e9;
      acs.forEach((a) => { const v = heuristica(jogo, e, a) + r() * 0.01; if (v > bv) { bv = v; b = a; } });
      return b;
    }
    return ismcts(jogo, e, j, nivel, r);
  }

  HON.escolher = escolher;
  HON.heuristica = heuristica;
  if (typeof module !== 'undefined' && module.exports) module.exports = HON;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis));
