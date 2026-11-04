/* HanafudaON! - robo-worker.js: roda o computador fora da tela para não travar o jogo */
'use strict';
importScripts('nucleo.js', 'captura.js', 'jogos-captura.js', 'kabu.js', 'robo.js');
self.onmessage = function (m) {
  const d = m.data;
  try {
    const acao = self.HON.escolher(d.jogo, d.estado, d.j, d.nivel, d.semente);
    self.postMessage({ id: d.id, acao });
  } catch (err) {
    self.postMessage({ id: d.id, erro: String(err && err.message || err) });
  }
};
