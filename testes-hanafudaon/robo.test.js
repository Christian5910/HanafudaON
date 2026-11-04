'use strict';
const path = require('path');
const HON = require(path.join(__dirname, '../hanafudaon/jogos-captura.js'));
require(path.join(__dirname, '../hanafudaon/kabu.js'));
require(path.join(__dirname, '../hanafudaon/robo.js'));
const fs = require('fs');

// duelo: nível A (cadeira 0) contra nível B (demais), alternando a cadeira de abertura; mede ganho médio por rodada
function duelo(id, nA, nB, rodadas, mesa) {
  const jogo = HON.jogos[id];
  let soma = 0, n = 0, semente = 11;
  const t0 = Date.now();
  for (let k = 0; k < rodadas; k++) {
    let e = jogo.novo({ jogadores: mesa || jogo.cfg.padraoJ, semente: 900 + k, rodadas: 1, oya: k % (mesa || jogo.cfg.padraoJ) });
    let g = 0;
    while (!jogo.fimRodada(e) && g++ < 400) {
      const j = jogo.vez(e), seat = jogo.assento(e, j);
      const nivel = seat === 0 ? nA : nB;
      const a = HON.escolher(id, e, j, nivel, ++semente);
      if (!jogo.acoes(e).some((x) => JSON.stringify(x) === JSON.stringify(a))) { console.log('AÇÃO ILEGAL', id, nivel, JSON.stringify(a)); process.exit(1); }
      e = jogo.aplicar(e, a);
    }
    const seat0 = e.assentos.indexOf(0);
    if (seat0 >= 0) { const gs = e.res.ganhos; const outros = (gs.reduce((a, b) => a + b, 0) - gs[seat0]) / Math.max(1, gs.length - 1); soma += gs[seat0] - outros; n++; }
  }
  return { media: soma / Math.max(1, n), n, ms: Date.now() - t0 };
}
const alvo = process.argv[2];
const quais = alvo ? [alvo] : HON.nomesCaptura;
const N = +process.argv[3] || 30;
quais.forEach((id) => {
  const rs = [];
  [[2, 1], [3, 2], [4, 3], [5, 4]].forEach(([a, b]) => {
    const r = duelo(id, a, b, a >= 5 ? Math.max(8, N / 3 | 0) : N);
    rs.push('N' + a + ' vs N' + b + ': ' + r.media.toFixed(1) + ' (' + r.n + ' rodadas, ' + (r.ms / r.n | 0) + ' ms/rodada)');
  });
  console.log(id.padEnd(11), rs.join(' | '));
});
