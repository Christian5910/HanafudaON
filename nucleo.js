/* ==========================================================================
   HanafudaON! - nucleo.js (peças comuns dos jogos: dados das cartas, sorteio, utilidades)
   Sem DOM. Roda no navegador, no Worker e no Node. Tudo fica em HON (window.HON ou globalThis.HON).

   Carta = número de 0 a 47, 4 por mês (mês 1 = 0 a 3), na mesma ordem do hanafuda.js.
   Tipos: 'h' hikari (光), 't' tane (種), 'z' tanzaku (短冊), 'k' kasu (カス).
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };
  HON.jogos = HON.jogos || {};

  // um caractere por carta: h t z k (mesma ordem do hanafuda.js)
  const TIPOS = 'hzkk' + 'tzkk' + 'hzkk' + 'tzkk' + 'tzkk' + 'tzkk' + 'tzkk' + 'htkk' + 'tzkk' + 'tzkk' + 'htzk' + 'hkkk';
  const mes = (c) => (c >> 2) + 1;
  const tipo = (c) => TIPOS[c];
  // fitas: poema (vermelhas de janeiro, fevereiro e março), azuis, vermelhas lisas
  const POEMA = [1, 5, 9], AZUL = [21, 33, 37], ERVA = [13, 17, 25];
  // cartas com nome próprio
  const C = {
    GRUO: 0, UGUISU: 4, FITA_POEMA_JAN: 1, CORTINA: 8, CUCO: 12, PONTE: 16, BORBOLETA: 20,
    JAVALI: 24, LUA: 28, GANSOS: 29, CALICE: 32, CERVO: 36, ONO: 40, ANDORINHA: 41, FITA_SALGUEIRO: 42, RAIO: 43,
    FENIX: 44, KASU_AMARELO: 46
  };
  const HIKARI = [0, 8, 28, 40, 44];

  /* ---------- sorteio com semente (mulberry32, só inteiros: igual em qualquer aparelho) ---------- */
  function rng(sem) {
    let a = sem >>> 0;
    const f = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return f;
  }
  // Para o estado ficar 100% serializável, a semente avança junto com o jogo: cada "tirada" pega um novo valor
  function proxSem(s) { return (Math.imul(s >>> 0, 1664525) + 1013904223) >>> 0; }
  function embaralhar(lista, r) {
    const a = lista.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  const novaSemente = () => (Math.random() * 4294967296) >>> 0;

  /* ---------- utilidades ---------- */
  const copia = (o) => JSON.parse(JSON.stringify(o));
  const soma = (l, f) => l.reduce((s, c) => s + f(c), 0);
  const conta = (l, f) => l.reduce((s, c) => s + (f(c) ? 1 : 0), 0);
  const tem = (l, ...cs) => cs.every((c) => l.indexOf(c) >= 0);
  const doMes = (l, m) => l.filter((c) => mes(c) === m);
  function porMes(l) { const o = {}; l.forEach((c) => { (o[mes(c)] = o[mes(c)] || []).push(c); }); return o; }

  // pontos padrão das cartas (20, 10, 5 e 1; o baralho todo soma 264)
  function valorPadrao(c) { const t = TIPOS[c]; return t === 'h' ? 20 : t === 't' ? 10 : t === 'z' ? 5 : 1; }
  const TOTAL_PADRAO = 264;

  // "kasu" nas mãos do Hachi-Hachi: cartas de 1 ponto e todas as do salgueiro (mês 11)
  const ehKasuMao = (c) => TIPOS[c] === 'k' || mes(c) === 11;

  // duas cartas contam como iguais para escolher alvo (kasu do mesmo mês são intercambiáveis)
  function mesmaClasse(a, b) {
    if (mes(a) !== mes(b)) return false;
    return TIPOS[a] === 'k' && TIPOS[b] === 'k' && a !== 46 && b !== 46;
  }

  const MESES_PT = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  Object.assign(HON, {
    TIPOS, mes, tipo, POEMA, AZUL, ERVA, C, HIKARI, rng, proxSem, embaralhar, novaSemente,
    copia, soma, conta, tem, doMes, porMes, valorPadrao, TOTAL_PADRAO, ehKasuMao, mesmaClasse, MESES_PT
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = HON;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : globalThis));
