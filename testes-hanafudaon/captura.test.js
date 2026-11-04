'use strict';
const path = require('path');
const HON = require(path.join(__dirname, '../hanafudaon/jogos-captura.js'));
const { rng } = HON;
let falhas = 0;
const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA:', m); } };

function conf(e, jogo) {
  const base = jogo.cfg.baralho(e.n, e.opc);
  const todas = [].concat(...e.mao, e.campo, e.monte, ...e.capt);
  if (e.fase === 'virar') todas.push(e.pend.v);
  ok(todas.length === base.length, jogo.id + ' contagem ' + todas.length + ' != ' + base.length + ' fase ' + e.fase);
  ok(new Set(todas).size === todas.length, jogo.id + ' carta repetida');
  ok(base.every((c) => todas.indexOf(c) >= 0), jogo.id + ' carta sumiu');
}

const configs = [];
HON.nomesCaptura.forEach((id) => {
  const j = HON.jogos[id];
  for (let m = j.cfg.minJ; m <= (j.cfg.maxMesa || j.cfg.maxJ); m++) configs.push([id, m]);
});

const PARTIDAS = +process.argv[2] || 60;
configs.forEach(([id, m]) => {
  const jogo = HON.jogos[id];
  let rodadas = 0, vezes = {}, somaZero = true, fins = {};
  for (let p = 0; p < PARTIDAS; p++) {
    const r = rng(1000 + p);
    let e = jogo.novo({ jogadores: m, semente: 77 + p, rodadas: 3 });
    for (let passo = 0; passo < 5000; passo++) {
      if (jogo.fimRodada(e)) {
        rodadas++;
        const s = e.res.ganhos.reduce((a, b) => a + b, 0);
        if (['koikoi', 'hachihachi', 'hanaawase', 'mushi', 'sudaoshi', 'tensho', 'bakappana'].indexOf(id) >= 0 && id !== 'koikoi') ok(Math.abs(s) < 1e-9, id + ' soma ' + s + ' ' + e.res.motivo);
        fins[e.res.motivo.slice(0, 18)] = (fins[e.res.motivo.slice(0, 18)] || 0) + 1;
        // todas as cartas devem estar capturadas no fim
        const base = jogo.cfg.baralho(e.n, e.opc);
        const cap = [].concat(...e.capt);
        if (['koikoi','roppyakken'].indexOf(id) < 0 && !e.res.motivo.startsWith('Rodada encerrada por') && !e.res.motivo.startsWith('As duas') && !(e.fase==='fimrod' && e.monte.length)) ok(cap.length === base.length, id + ' capturadas ' + cap.length + ' de ' + base.length);
        if (jogo.fimPartida(e)) break;
        e = jogo.proximaRodada(e);
        conf(e, jogo);
        continue;
      }
      const a = jogo.acoes(e);
      ok(a.length > 0, id + ' sem ações na fase ' + e.fase);
      if (!a.length) break;
      const esc = a[Math.floor(r() * a.length)];
      const antes = JSON.stringify(e);
      const e2 = jogo.aplicar(e, esc);
      ok(JSON.stringify(e) === antes, id + ' aplicar mudou o estado original');
      e = e2;
      conf(e, jogo);
      // visão e determinização
      if (passo % 7 === 0 && !jogo.fimRodada(e)) {
        const j = jogo.vez(e);
        const d = jogo.determinizar(jogo.visao(e, j), j, r);
        conf(d, jogo);
        ok(JSON.stringify(d.mao[j]) === JSON.stringify(e.mao[j]), id + ' determinizar mexeu na mão própria');
        ok(d.mao.every((x, k) => x.length === e.mao[k].length) && d.monte.length === e.monte.length, id + ' tamanhos');
      }
    }
  }
  console.log(id.padEnd(11), 'jogadores', m, 'rodadas', rodadas, JSON.stringify(fins));
});
console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
process.exit(falhas ? 1 : 0);
