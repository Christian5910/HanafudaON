'use strict';
const path = require('path');
const HON = require(path.join(__dirname, '../hanafudaon/kabu.js'));
const { rng } = HON;
let falhas = 0;
const ok = (c, m) => { if (!c) { falhas++; console.log('FALHA:', m); } };

// cartas: mês m (1..10), k-ésima carta = 4*(m-1)+k
const C = (m, k) => 4 * (m - 1) + (k || 0);

function checa(e, id) {
  const todas = [].concat(...e.mao, e.monte);
  ok(new Set(todas).size === todas.length, id + ' carta repetida');
  ok(todas.every((c) => c >= 0 && c < 40), id + ' carta fora do baralho');
  ok(e.fichas.every((f) => f >= 0), id + ' ficha negativa');
}

function partida(id, n, escolha, semente, niveis) {
  const jogo = HON.jogos[id];
  let e = jogo.novo({ jogadores: n, semente, rodadas: 6, fichas: 100 });
  const total = e.fichas.reduce((a, b) => a + b, 0);
  const r = rng(semente * 3 + 1);
  let guarda = 0;
  for (;;) {
    if (guarda++ > 20000) { ok(false, id + ' não termina'); break; }
    if (jogo.fimRodada(e)) {
      const s = e.res.ganhos.reduce((a, b) => a + b, 0);
      ok(s === 0, id + ' soma de ganhos ' + s);
      ok(e.fichas.reduce((a, b) => a + b, 0) === total, id + ' fichas não se conservam');
      if (jogo.fimPartida(e)) break;
      e = jogo.proximaRodada(e); checa(e, id);
      continue;
    }
    const a = jogo.acoes(e);
    ok(a.length > 0, id + ' sem ações na fase ' + e.fase);
    if (!a.length) break;
    const j = jogo.vez(e);
    const esc = escolha(jogo, e, j, a, r, niveis);
    ok(a.some((x) => JSON.stringify(x) === JSON.stringify(esc)), id + ' escolha fora das ações ' + JSON.stringify(esc));
    const antes = JSON.stringify(e);
    const e2 = jogo.aplicar(e, esc);
    ok(JSON.stringify(e) === antes, id + ' aplicar mudou o estado original');
    e = e2; checa(e, id);
  }
  return e.fichas;
}

const aleatorio = (jogo, e, j, a, r) => a[Math.floor(r() * a.length)];
const robo = (jogo, e, j, a, r, niveis) => jogo.escolher(e, j, niveis[j], r);

['oichokabu', 'kingo'].forEach((id) => {
  const jogo = HON.jogos[id];
  const [mn, mx] = [jogo.cfg.minJ, jogo.cfg.maxJ];
  for (let n = mn; n <= mx; n++) for (let s = 1; s <= 40; s++) partida(id, n, aleatorio, s, null);
  console.log(id, 'aleatório ok em', mn, 'a', mx, 'jogadores');
  // robôs: cada nível contra 3 aleatórios
  for (let nivel = 1; nivel <= 5; nivel++) {
    let soma = 0, partidas = 0;
    const P = nivel >= 5 ? 25 : 60;
    for (let s = 1; s <= P; s++) {
      const niveis = [nivel, 1, 1, 1];
      const f = partida(id, 4, robo, 500 + s, niveis);
      soma += f[0] - 100; partidas++;
      // a cadeira do robô gira de acordo com a banca; usamos a cadeira 0 fixa em todas as partidas
    }
    console.log(id, 'nível', nivel, 'contra 3 aleatórios: média de fichas ganhas na cadeira 0 =', (soma / partidas).toFixed(1));
  }
});

// yaku dirigidos
const ok1 = HON.jogos.oichokabu, k = HON.jogos.kingo;
const y = (jg, m, b) => jg.yakuMao(m, b).map((q) => q.nome).join(',');
ok(y(ok1, [C(1), C(10), C(10, 1)], false) === 'Pin-zoro duplo', 'pin-zoro');
ok(y(ok1, [C(3), C(3, 1), C(3, 2)], false) === 'Arashi', 'arashi');
ok(y(ok1, [C(4), C(7), C(9)], false) === 'Raijin', 'raijin');
ok(y(ok1, [C(3), C(7), C(10)], false) === 'Fūjin', 'fujin');
ok(y(ok1, [C(1), C(2), C(3)], false) === 'Sequência subindo', 'subindo');
ok(y(ok1, [C(3), C(2), C(1)], false) === 'Sequência descendo', 'descendo');
ok(y(ok1, [C(2), C(2, 1)], false) === 'Tsuru', 'tsuru');
ok(y(ok1, [C(5), C(5, 1)], true) === 'Gogo', 'gogo');
ok(y(ok1, [C(1), C(9)], true) === 'Kuppin' && y(ok1, [C(1), C(9)], false) === '', 'kuppin só da banca');
ok(y(ok1, [C(1), C(4)], true) === 'Shippin' && y(ok1, [C(1), C(4)], false) === '', 'shippin só da banca');
ok(y(ok1, [C(2), C(2, 1), C(6)], false) === '', 'tsuru some com 3ª carta');
ok(y(k, [C(4), C(5), C(6)], false) === 'Shigoro', 'shigoro');
ok(y(k, [C(2), C(2, 1), C(2, 2)], false) === 'Arashi', 'arashi kingo');
ok(y(k, [C(1), C(2), C(3), C(4), C(5)], false) === 'Gomai', 'gomai');
ok(y(k, [C(1), C(2), C(3), C(4), C(10)], false) === '', 'gomai estourado não vale');
ok(y(k, [C(4), C(5), C(6)], true) === '', 'shigoro só filho');

// rodada montada à mão (Oicho-Kabu): kid 9 contra banca 8
function montar(jogo, mao, ap, banca, fichas) {
  const e = jogo.novo({ jogadores: mao.length, semente: 5, banca });
  e.fase = 'cartas'; e.mao = mao.map((m) => m.slice()); e.apostas = ap.slice();
  e.monte = []; for (let i = 39; i >= 0; i--) if (!mao.some((m) => m.indexOf(i) >= 0)) e.monte.push(i);
  e.ordem = []; for (let q = 1; q < mao.length; q++) e.ordem.push((banca + q) % mao.length); e.ordem.push(banca);
  e.pos = 0; e.vez = e.ordem[0]; e.parou = new Array(mao.length).fill(false);
  if (fichas) e.fichas = fichas.slice();
  return e;
}
{
  // 3 jogadores, banca 0; filho 1 tem 4+5 = 9 (Kabu), filho 2 tem 3+5 = 8, banca 2+6 = 8
  let e = montar(ok1, [[C(2), C(6)], [C(4), C(5)], [C(3), C(5)]], [0, 10, 10], 0);
  while (!ok1.fimRodada(e)) { const a = ok1.acoes(e); e = ok1.aplicar(e, a.find((x) => x.t === 'f') || a[0]); }
  ok(e.res.ganhos[1] === 10 && e.res.ganhos[2] === -10 && e.res.ganhos[0] === 0, 'kabu vs oicho e empate: ' + JSON.stringify(e.res.ganhos));
  // banca Kuppin
  e = montar(ok1, [[C(1), C(9)], [C(4), C(5)], [C(3), C(5)]], [0, 10, 10], 0);
  e = ok1.aplicar(e, ok1.acoes(e)[0]); // qualquer ação para forçar fluxo
}
{
  const e0 = ok1.novo({ jogadores: 3, semente: 5, banca: 0 });
  e0.fase = 'aposta';
  let e = e0;
  // forçar Kuppin da banca: montar o monte e deixar distribuir
  e.monte = []; const resto = []; for (let i = 0; i < 40; i++) resto.push(i);
  // distribui: filhos 1 e 2 recebem em ordem (1,2,0) duas rodadas; monte.pop tira do fim
  const seq = [C(4), C(5), C(1), C(3), C(5, 1), C(9)];
  e.monte = resto.filter((c) => seq.indexOf(c) < 0).concat(seq.slice().reverse());
  e = ok1.aplicar(e, { t: 'ap', v: 10 }); e = ok1.aplicar(e, { t: 'ap', v: 10 });
  ok(ok1.fimRodada(e), 'kuppin encerra a rodada');
  ok(e.res && e.res.ganhos[0] === 40 && e.res.ganhos[1] === -20, 'kuppin 2x: ' + JSON.stringify(e.res && e.res.ganhos));
}
{
  // Kingo: filho 15 exato vs banca 14 => 2x; banca estoura => 1x para quem não estourou
  let e = montar(k, [[C(5), C(9)], [C(5, 1), C(10)], [C(10), C(9), C(2)]], [0, 10, 10], 0);
  // filho 1: 15 (Kingo), filho 2: 21 (estouro), banca: 14
  while (!k.fimRodada(e)) { const a = k.acoes(e); e = k.aplicar(e, a.find((x) => x.t === 'f') || a[0]); }
  ok(e.res.ganhos[1] === 20, 'kingo 2x: ' + JSON.stringify(e.res.ganhos));
  ok(e.res.ganhos[2] === -10, 'estouro perde 1x: ' + JSON.stringify(e.res.ganhos));
}
{
  // banca pobre paga só o que tem
  let e = montar(ok1, [[C(2), C(6)], [C(4), C(5)], [C(4, 1), C(5, 1)]], [0, 20, 20], 0, [5, 100, 100]);
  while (!ok1.fimRodada(e)) { const a = ok1.acoes(e); e = ok1.aplicar(e, a.find((x) => x.t === 'f') || a[0]); }
  ok(e.fichas.every((f) => f >= 0) && e.fichas.reduce((a, b) => a + b, 0) === 205, 'banca pobre conserva fichas: ' + e.fichas);
}
console.log(falhas ? 'FALHAS: ' + falhas : 'TUDO OK');
process.exit(falhas ? 1 : 0);
