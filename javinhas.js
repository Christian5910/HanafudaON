/* ==========================================================================
   HanafudaON! - javinhas.js (a tela: escolher jogo, partida, robô, mesa, estatísticas)
   Regras: nucleo.js, captura.js, jogos-captura.js, kabu.js. Robô: robo.js (roda em robo-worker.js).
   Mesa e animações: mesa.js. Cartas: hanafuda.js. Menu, sons e estatísticas: on.js.

   Índice
   1. Dados dos jogos e preferências
   2. Estado da partida e salvamento
   3. Visual (o que a mesa mostra)
   4. Animação dos lances
   5. Vez do jogador (toques, arrastos, decisões)
   6. Robô
   7. Fim de rodada e de partida
   8. Painéis (partida, cartas, capturas)
   9. Escolher jogo e Como Jogar
   10. Estatísticas e início
   ========================================================================== */
(function () {
  'use strict';

  const HON = window.HON, H = window.Hanafuda;
  const $ = (s) => document.querySelector(s);
  const LS = { prefs: 'hanafudaon.prefs', jogo: 'hanafudaon.j.', stats: 'hanafudaon.stats', visto: 'hanafudaon.visto' };

  /* ==========================================================================
     1. Dados dos jogos e preferências
     ========================================================================== */
  // jog = [mínimo, máximo, padrão]; rod = opções de rodadas; capa = cartas do desenho
  const INFO = {
    koikoi: { nome: 'Koi-Koi', jp: 'こいこい', grupo: 'g1', dif: 2, jog: [2, 2, 2], rod: [1, 3, 6, 12], rodPad: 3, capa: [0, 28, 32], curto: 'Forme combinações e decida: fechar ou arriscar com Koi-Koi.' },
    hanaawase: { nome: 'Hana-Awase', jp: '花合せ', grupo: 'g1', dif: 3, jog: [3, 4, 3], rod: [3, 6, 12], rodPad: 6, capa: [8, 12, 36], curto: 'O clássico: todas as cartas são jogadas e as combinações contam no fim.' },
    hachihachi: { nome: 'Hachi-Hachi', jp: '八八', grupo: 'g1', dif: 5, jog: [3, 6, 3], rod: [3, 6, 12], rodPad: 6, capa: [40, 44, 0], curto: 'O mais técnico: mãos iniciais, taxas, sage e meta de 88.' },
    bakappana: { nome: 'Bakappana', jp: 'バカ花', grupo: 'g2', dif: 1, jog: [2, 4, 2], rod: [3, 6, 12], rodPad: 3, capa: [3, 22, 47], curto: 'Pescar por mês e somar valores. Sem combinações: o melhor para aprender.' },
    mushi: { nome: 'Mushi', jp: '虫', grupo: 'g2', dif: 2, jog: [2, 2, 2], rod: [3, 6, 12], rodPad: 6, capa: [4, 43, 28], curto: 'Duelo rápido sem peônia nem hagi. A carta de raio é coringa.' },
    tensho: { nome: 'Tensho', jp: '天正', grupo: 'g2', dif: 2, jog: [2, 2, 2], rod: [3, 6, 12], rodPad: 6, capa: [0, 1, 2], curto: 'Duelo de pescar com baralho reduzido e bônus por mês completo.' },
    roppyakken: { nome: 'Roppyakken', jp: '六百間', grupo: 'g3', dif: 4, jog: [2, 3, 2], rod: null, rodPad: 12, capa: [44, 40, 8], curto: 'Corrida até 600 pontos, com combinações de valor alto.' },
    sudaoshi: { nome: 'Sudaoshi', jp: '素倒し', grupo: 'g3', dif: 4, jog: [3, 6, 3], rod: [3, 6, 12], rodPad: 6, capa: [6, 7, 10], curto: 'Os valores são invertidos: o kasu vale mais e a luz vale menos.' },
    oichokabu: { nome: 'Oicho-Kabu', jp: 'おいちょかぶ', grupo: 'g4', dif: 2, jog: [3, 8, 4], rod: [5, 10, 20], rodPad: 10, capa: [32, 33, 34], curto: 'Aposte contra a banca e chegue o mais perto possível do 9, o Kabu.' },
    kingo: { nome: 'Kingo', jp: '金吾', grupo: 'g4', dif: 2, jog: [2, 10, 4], rod: [5, 10, 20], rodPad: 10, capa: [36, 37, 39], curto: 'Chegue a 15 sem passar, como no blackjack, contra a banca.' }
  };
  const GRUPOS = [
    ['g1', 'Os mais jogados', 'Os três jogos de combinações mais conhecidos.'],
    ['g2', 'Rápidos e simples', 'Partidas curtas e regras fáceis.'],
    ['g3', 'Regras diferentes', 'Pontuações pouco comuns, para quem já conhece o básico.'],
    ['g4', 'Apostas contra a banca', 'Sem pescar cartas: some o valor dos meses e aposte fichas.']
  ];
  const ORDEM = ['koikoi', 'hanaawase', 'hachihachi', 'bakappana', 'mushi', 'tensho', 'roppyakken', 'sudaoshi', 'oichokabu', 'kingo'];
  const DIF = ['', 'Fácil', 'Moderado', 'Médio', 'Difícil', 'Muito difícil'];
  const NIVEIS = ['', 'Iniciante', 'Fácil', 'Médio', 'Difícil', 'Mestre'];
  const NIVEL_TXT = [
    '',
    'Iniciante: joga qualquer carta permitida, ao acaso.',
    'Fácil: pega o que vale mais, mas erra de vez em quando.',
    'Médio: sempre pega o que vale mais na hora.',
    'Difícil: simula centenas de partidas antes de cada jogada.',
    'Mestre: simula milhares de partidas. Pode levar alguns segundos.'
  ];
  const ehKabu = (id) => id === 'oichokabu' || id === 'kingo';

  const prefs = Object.assign({ jogo: 'koikoi', borda: 'preta', indice: false, modo: 'robo', nivel: 3, jog: {}, rod: {} }, ON_store_get(LS.prefs, {}));
  function ON_store_get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function ON_store_set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem espaço ou bloqueado */ } }
  function ON_store_del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignora */ } }
  if (!INFO[prefs.jogo]) prefs.jogo = 'koikoi';
  if (prefs.borda !== 'vermelha') prefs.borda = 'preta';
  if (prefs.modo !== 'local') prefs.modo = 'robo';
  prefs.nivel = Math.max(1, Math.min(5, prefs.nivel | 0 || 3));
  prefs.indice = !!prefs.indice;
  if (!prefs.jog || typeof prefs.jog !== 'object') prefs.jog = {};
  if (!prefs.rod || typeof prefs.rod !== 'object') prefs.rod = {};
  const gravarPrefs = () => ON_store_set(LS.prefs, prefs);

  const el = {
    box: $('#mesa-box'), mesa: $('#mesa'), msg: $('#message-area'), acoes: $('#acoes'),
    tela: $('#tela'), telaTitulo: $('#tela-titulo'), telaCorpo: $('#tela-corpo'), telaBtn: $('#tela-btn'), telaBtn2: $('#tela-btn2'),
    modoNome: $('#modo-nome'), modoMini: $('#modo-mini'), jogosCorpo: $('#jogos-corpo'),
    hint: $('#hint-btn'), capt: $('#capt-btn'), regras: $('#regras-btn'), restart: $('#restart-btn'),
    r1: $('#hud-r1'), v1: $('#hud-v1'), r2: $('#hud-r2'), v2: $('#hud-v2'), r3: $('#hud-r3'), v3: $('#hud-v3')
  };

  const reduzido = () => !!(window.ON && ON.cfg && ON.cfg.reduzir);
  const dormir = (ms) => new Promise((r) => setTimeout(r, reduzido() ? Math.min(ms, 30) : ms));

  /* ---------- som de carta (papel batendo na mesa) ---------- */
  function somCarta(forte) {
    if (!ON.cfg.som) return;
    try {
      const ctx = ON.audio(); if (!ctx) return;
      const dur = forte ? 0.09 : 0.06, n = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.4);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = forte ? 1300 : 1900; f.Q.value = 0.9;
      const g = ctx.createGain(); g.gain.value = forte ? 0.55 : 0.4;
      src.connect(f); f.connect(g); g.connect(ctx.destination); src.start();
    } catch (e) { /* sem áudio */ }
  }

  /* ==========================================================================
     2. Estado da partida e salvamento
     ========================================================================== */
  let P = null;               // partida atual: {id, est, modo, nivel, humanos:[cadeiras], visSeat, parte}
  let V = null;               // o que a mesa mostra agora
  let mesa = null;
  let ocupado = false;        // animando ou o robô pensando
  let sel = null;             // carta da mão escolhida
  let dicas = [];             // alvos destacados
  let rodando = false;        // o ciclo da partida está andando
  let geracao = 0;            // muda a cada partida nova (cancela robôs e animações antigas)
  let trocaPendente = false;  // tela de "passe o aparelho"
  let worker = null, reqId = 0, pendentes = {};
  let jogoAtualId = prefs.jogo;

  const mod = (id) => HON.jogos[id || (P && P.id)];
  const emAndamento = () => !!(P && P.iniciada && !P.terminou);

  function gravarPartida() {
    if (!P) return;
    if (P.terminou) { ON_store_del(LS.jogo + P.id); return; }
    ON_store_set(LS.jogo + P.id, { est: P.est, modo: P.modo, nivel: P.nivel, humanos: P.humanos, visSeat: P.visSeat, iniciada: P.iniciada, t: Date.now() });
  }
  function lerPartida(id) {
    const s = ON_store_get(LS.jogo + id, null);
    if (!s || !s.est || s.est.jogo !== id) return null;
    try {
      const m = mod(id);
      if (!m.acoes || (!m.fimRodada(s.est) && !m.acoes(s.est).length)) return null;
      return { id, est: s.est, modo: s.modo === 'local' ? 'local' : 'robo', nivel: s.nivel | 0 || 3, humanos: s.humanos || [0], visSeat: s.visSeat == null ? null : s.visSeat, iniciada: true, terminou: false };
    } catch (e) { return null; }
  }

  function seatNome(seat) {
    if (!P) return 'Jogador';
    if (P.modo === 'local') return 'Jogador ' + (seat + 1);
    return seat === 0 ? 'Você' : 'Robô ' + seat;
  }
  const humano = (seat) => P.humanos.indexOf(seat) >= 0;
  const seatDe = (e, j) => (e.assentos ? e.assentos[j] : j);
  const jDe = (e, seat) => (e.assentos ? e.assentos.indexOf(seat) : seat);
  const infoDe = (id) => INFO[id];

  function novaPartida(id) {
    geracao++;
    const info = infoDe(id), m = mod(id);
    const n = Math.max(info.jog[0], Math.min(info.jog[1], prefs.jog[id] || info.jog[2]));
    const op = { jogadores: n, rodadas: info.rod ? (prefs.rod[id] && info.rod.indexOf(prefs.rod[id]) >= 0 ? prefs.rod[id] : info.rodPad) : info.rodPad };
    if (id === 'roppyakken') { op.rodadas = 12; op.meta = 600; }
    const est = m.novo(op);
    const total = est.mesa || est.n;
    const humanos = prefs.modo === 'local' ? Array.from({ length: total }, (_, i) => i) : [0];
    P = { id, est, modo: prefs.modo, nivel: prefs.nivel, humanos, visSeat: null, iniciada: true, terminou: false, rodadaMostrada: 0 };
    sel = null; dicas = []; ocupado = false;
    if (mesa) mesa.novaRodada();
    gravarPartida();
  }

  /* ==========================================================================
     3. Visual (o que a mesa mostra)
     ========================================================================== */
  function visJ(e) {
    if (!P) return -1;
    if (P.modo === 'robo') return jDe(e, 0);
    if (e.fase === 'fimrod') return -1;
    return P.visSeat == null ? -1 : jDe(e, P.visSeat);
  }

  function rotulosDe(e) {
    const kabu = ehKabu(e.jogo), r = [];
    for (let j = 0; j < e.n; j++) {
      const seat = seatDe(e, j);
      if (kabu) {
        r.push({ nome: seatNome(seat), papel: j === e.banca ? 'Banca' : 'Filho', vez: e.fase !== 'fimrod' && e.vez === j,
          info: e.fichas[j] + ' fichas' + (e.apostas[j] ? ' · aposta ' + e.apostas[j] : '') });
      } else {
        const extra = j === 0 ? 'abre' : '';
        r.push({ nome: seatNome(seat), papel: extra, vez: e.fase !== 'fimrod' && e.vez === j, info: (e.pts[seat] || 0) + ' pts · ' + e.capt[j].length + ' cartas' });
      }
    }
    return r;
  }

  function visualDe(e) {
    const kabu = ehKabu(e.jogo);
    const v = { n: e.n, mao: e.mao.map((m) => m.slice()), monte: e.monte.slice(), vis: visJ(e), rot: rotulosDe(e), sel: null, dicas: [], pegaveis: [] };
    if (kabu) {
      v.tipo = 'kabu';
      v.mostrar = e.fase === 'fimrod';
      const ord = []; for (let k = 0; k < e.n; k++) ord.push((e.banca + 1 + k) % e.n);
      v.ordemVisual = ord;
    } else {
      v.tipo = 'captura';
      v.campo = e.campo.slice().concat(e.pend ? [e.pend.v] : []);
      v.capt = e.capt.map((c) => c.slice());
      v.campoIni = P ? (P.campoIni || 8) : 8;
      v.maoIni = P ? (P.maoIni || 0) : 0;
    }
    return v;
  }

  function pintar(semAnim) {
    if (!P || !mesa) return;
    const e = P.est;
    V = visualDe(e);
    V.sel = sel; V.dicas = dicas.slice();
    V.alvoCampo = false;
    if (minhaVez() && e.fase === 'jogar' && !ehKabu(e.jogo)) {
      const j = e.vez;
      V.pegaveis = e.mao[j].slice();
      if (sel != null) {
        V.alvoCampo = mod().acoes(e).some((a) => a.t === 'j' && a.c === sel && a.a === -1);
      }
    }
    if (minhaVez() && e.fase === 'virar') {
      const alvos = mod().acoes(e).filter((a) => a.t === 'v').map((a) => a.a);
      const extra = [];
      alvos.forEach((d) => e.campo.forEach((c) => { if (c !== d && HON.mes(c) === HON.mes(d) && HON.mesmaClasse(c, d) && alvos.indexOf(c) < 0 && extra.indexOf(c) < 0) extra.push(c); }));
      V.dicas = alvos.concat(extra);
      V.pegaveis = V.dicas.slice();
    }
    mesa.render(V, { semAnim });
    atualizarHud();
  }

  function atualizarHud() {
    if (!P) return;
    const e = P.est, kabu = ehKabu(e.jogo);
    const info = infoDe(e.jogo);
    el.r1.textContent = 'Rodada';
    el.v1.textContent = e.jogo === 'roppyakken' ? String(e.rod) : e.rod + '/' + e.rodadas;
    if (P.modo === 'local') {
      el.r2.textContent = kabu ? 'Fichas' : 'Placar';
      const l = kabu ? e.fichas : e.pts;
      el.v2.textContent = l.length <= 3 ? l.join(' · ') : String(Math.max.apply(null, l)) + ' (líder)';
    } else {
      el.r2.textContent = kabu ? 'Suas fichas' : 'Seu placar';
      el.v2.textContent = String(kabu ? e.fichas[0] : (e.pts[0] || 0));
    }
    el.r3.textContent = 'Vez';
    el.v3.textContent = e.fase === 'fimrod' ? '-' : seatNome(seatDe(e, e.vez));
    el.modoNome.textContent = info.nome;
  }

  function minhaVez() {
    if (!P || ocupado || P.terminou || trocaPendente) return false;
    const e = P.est;
    if (e.fase === 'fimrod') return false;
    return humano(seatDe(e, e.vez));
  }

  /* ==========================================================================
     4. Animação dos lances
     ========================================================================== */
  const nomeCarta = (c) => H.carta(c).nome;
  function dizer(t) { el.msg.textContent = t; }

  function resumo(e0, evs) {
    const partes = [];
    let atual = '';
    evs.forEach((ev) => {
      const q = ev.j !== undefined ? seatNome(seatDe(e0, ev.j)) : '';
      if (ev.t === 'mao') atual = q + ' jogou ' + nomeCarta(ev.c);
      else if (ev.t === 'cap') {
        const outras = ev.cs.filter((c) => c !== ev.c);
        const txt = outras.length === 1 ? 'pegou ' + nomeCarta(outras[0]) : 'pegou ' + outras.length + ' cartas';
        if (ev.de === 'mao') { atual += ' e ' + txt + '.'; partes.push(atual); atual = ''; }
        else { partes.push('Virou ' + nomeCarta(ev.c) + ' e ' + txt + '.'); }
      } else if (ev.t === 'campo') {
        if (ev.de === 'mao') { atual += ', ficou no campo.'; partes.push(atual); atual = ''; }
        else partes.push('Virou ' + nomeCarta(ev.c) + ', ficou no campo.');
      } else if (ev.t === 'ten') partes.push(q + ' completou ' + H.MESES[ev.m - 1].mes + ' (Ten, +10).');
    });
    return partes.join(' ');
  }

  async function animar(e0, e1) {
    const gen = geracao;
    const kabu = ehKabu(e1.jogo);
    const evs = e1.ev || [];
    if (kabu) {
      for (let k = 0; k < evs.length; k++) {
        const ev = evs[k];
        if (ev.t === 'aposta') { somCarta(); dizer(seatNome(seatDe(e1, ev.j)) + ' apostou ' + ev.v + '.'); }
        else if (ev.t === 'dist') { somCarta(true); }
        else if (ev.t === 'pede') { somCarta(); dizer(seatNome(seatDe(e1, ev.j)) + ' pediu uma carta.'); }
        else if (ev.t === 'para') { ON.som('toque'); dizer(seatNome(seatDe(e1, ev.j)) + ' parou.'); }
        else if (ev.t === 'pag') { ON.som('acerto'); }
      }
      P.est = e1;
      pintarKabuAnim(e1);
      await dormir(evs.some((x) => x.t === 'dist') ? 650 : 480);
      return gen === geracao;
    }
    // jogos de pescar: aplica os eventos um a um sobre o visual antigo
    const Vs = visualDe(e0);
    Vs.campoIni = V ? V.campoIni : 8; Vs.maoIni = V ? V.maoIni : 0;
    const ant = P.est;
    P.est = e0;
    const resTxt = resumo(e0, evs);
    for (let k = 0; k < evs.length; k++) {
      if (gen !== geracao) return false;
      const ev = evs[k];
      const tira = (l, c) => { const i = l.indexOf(c); if (i >= 0) l.splice(i, 1); };
      if (ev.t === 'mao') {
        tira(Vs.mao[ev.j], ev.c); Vs.campo.push(ev.c);
        somCarta(); mesa.render(Vs); await dormir(380);
      } else if (ev.t === 'vira') {
        tira(Vs.monte, ev.c); Vs.campo.push(ev.c);
        somCarta(true); mesa.render(Vs); await dormir(420);
      } else if (ev.t === 'cap') {
        ev.cs.forEach((c) => { tira(Vs.campo, c); Vs.capt[ev.j].push(c); });
        ON.som('junta'); ON.vibrar('leve'); mesa.render(Vs); await dormir(520);
      } else if (ev.t === 'resto') {
        ev.cs.forEach((c) => { tira(Vs.campo, c); Vs.capt[ev.j].push(c); });
        ON.som('junta'); mesa.render(Vs); await dormir(560);
      } else if (ev.t === 'yaku') {
        ON.som('acerto'); ON.vibrar('toque'); await dormir(260);
      } else if (ev.t === 'koi') {
        ON.som('xeque'); await dormir(260);
      } else if (ev.t === 'ten') {
        ON.som('acerto'); await dormir(260);
      } else if (ev.t === 'campo') {
        await dormir(120);
      }
    }
    P.est = e1;
    if (resTxt) dizer(resTxt);
    pintar();
    return gen === geracao;
  }

  function pintarKabuAnim(e) {
    V = visualDe(e);
    // as cartas saem do monte uma a uma
    const at = {}; let k = 0;
    e.mao.forEach((m) => m.forEach((c) => { at[c] = reduzido() ? 0 : (k++ * 45); }));
    V.atraso = at;
    mesa.render(V);
    atualizarHud();
  }

  async function aplicarAcao(a) {
    const e0 = P.est, m = mod();
    const gen = geracao;
    ocupado = true;
    let e1;
    try { e1 = m.aplicar(e0, a); } catch (err) { ocupado = false; console.error(err); return; }
    sel = null; dicas = [];
    mostrarAcoes();
    const ok = await animar(e0, e1);
    if (!ok || gen !== geracao) return;
    ocupado = false;
    gravarPartida();
    pintar();
    ciclo();
  }

  /* ==========================================================================
     5. Vez do jogador (toques, arrastos, decisões)
     ========================================================================== */
  function acoesAtuais() { return mod().acoes(P.est); }

  function acharAcaoJ(c, alvo) {
    const l = acoesAtuais().filter((a) => a.t === 'j' && a.c === c);
    let a = l.find((x) => x.a === alvo);
    if (!a && alvo >= 0) a = l.find((x) => x.a >= 0 && HON.mes(x.a) === HON.mes(alvo) && HON.mesmaClasse(x.a, alvo));
    return a || null;
  }

  function toqueCarta(id) {
    if (!minhaVez()) return;
    const e = P.est, j = e.vez, m = mod();
    if (e.fase === 'jogar') {
      if (e.mao[j].indexOf(id) >= 0) {
        if (sel === id) {
          const l = acoesAtuais().filter((a) => a.t === 'j' && a.c === id);
          if (l.length === 1) { aplicarAcao(l[0]); return; }
          dizer('Toque na carta do campo que você quer pegar.');
          return;
        }
        sel = id;
        const l = acoesAtuais().filter((a) => a.t === 'j' && a.c === id);
        dicas = l.filter((a) => a.a >= 0).map((a) => a.a);
        // cartas do campo equivalentes também ficam destacadas
        const extra = [];
        dicas.forEach((d) => e.campo.forEach((c) => { if (c !== d && HON.mes(c) === HON.mes(d) && HON.mesmaClasse(c, d) && dicas.indexOf(c) < 0) extra.push(c); }));
        dicas = dicas.concat(extra);
        ON.som('toque');
        if (!dicas.length) dizer('Sem par no campo: ela vai para o campo. Toque de novo na carta para jogar.');
        else if (l.some((a) => a.a === -1)) dizer('Toque na carta do campo para pegar.');
        else dizer(dicas.length === 1 || l.length === 1 ? 'Toque na carta do campo (ou nela de novo) para pegar.' : 'Escolha qual carta do campo pegar.');
        pintar();
        return;
      }
      if (sel != null) {
        const a = acharAcaoJ(sel, id);
        if (a) { aplicarAcao(a); return; }
        ON.som('erro'); ON.vibrar('erro');
        dizer('Essa carta não combina: precisa ser do mesmo mês.');
        if (mesa) mesa.elemento(id).classList.add('erro'), setTimeout(() => mesa.elemento(id).classList.remove('erro'), 400);
      }
      return;
    }
    if (e.fase === 'virar') {
      const l = acoesAtuais();
      let a = l.find((x) => x.a === id) || l.find((x) => HON.mes(x.a) === HON.mes(id) && HON.mesmaClasse(x.a, id));
      if (a) { aplicarAcao(a); return; }
      ON.som('erro');
      dizer('Escolha uma das cartas destacadas.');
    }
  }

  function toqueCampo() {
    if (!minhaVez()) return;
    const e = P.est;
    if (e.fase !== 'jogar' || sel == null) return;
    const a = acoesAtuais().find((x) => x.t === 'j' && x.c === sel && x.a === -1);
    if (a) { aplicarAcao(a); return; }
    ON.som('erro');
    dizer('Essa carta tem par no campo: toque na carta do campo que você quer pegar.');
  }

  function soltou(id, alvo) {
    if (!minhaVez()) { pintar(); return; }
    const e = P.est;
    if (e.fase !== 'jogar') { pintar(); return; }
    const l = acoesAtuais().filter((x) => x.t === 'j' && x.c === id);
    let a = null;
    if (alvo && alvo.carta !== undefined) a = acharAcaoJ(id, alvo.carta);
    else if (alvo && alvo.campo) a = l.find((x) => x.a === -1) || (l.length === 1 ? l[0] : null);
    if (a) { aplicarAcao(a); return; }
    if (alvo) { ON.som('erro'); dizer(alvo.campo ? 'Essa carta tem mais de um par: solte sobre a carta do campo que quer pegar.' : 'Essa carta não combina com aquela.'); }
    pintar();
  }

  function sobre(alvo) {
    if (!V) return;
    const novo = alvo && alvo.carta !== undefined ? alvo.carta : null;
    if (novo === sobre.ult) return;
    sobre.ult = novo;
  }

  /* ---------- barra de decisões ---------- */
  function limparAcoes() { el.acoes.hidden = true; el.acoes.textContent = ''; }
  function botao(txt, cls, fn) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn ' + (cls || 'btn-primary'); b.textContent = txt;
    b.addEventListener('click', fn);
    return b;
  }
  function linhaTxt(txt, cls) { const p = document.createElement('p'); p.className = cls || 'acoes-txt'; p.textContent = txt; return p; }

  function textoMao(e, j) {
    const m = e.mao[j];
    const vals = m.map((c) => HON.mes(c));
    const s = vals.reduce((a, b) => a + b, 0);
    if (e.jogo === 'kingo') return 'Sua mão: ' + vals.join(' + ') + ' = ' + s + ' (meta 15)' + (s > 15 ? ', estourou' : s === 15 ? ', Kingo!' : '');
    const d = s % 10;
    return 'Sua mão: ' + vals.join(' + ') + ' = ' + s + ', vale ' + d + ' (' + mod().NOMES_DIGITO[d] + ')';
  }

  function mostrarAcoes() {
    limparAcoes();
    if (!P || P.terminou || trocaPendente) return;
    const e = P.est;
    const kabu = ehKabu(e.jogo);
    if (e.fase === 'fimrod') {
      if (!el.tela.hidden) return;
      el.acoes.hidden = false;
      el.acoes.appendChild(botao(P.est.rod >= P.est.rodadas || mod().fimPartida(e) ? 'Ver resultado final' : 'Próxima rodada', 'btn-primary', () => fimRodadaTela(true)));
      return;
    }
    if (ocupado) return;
    const seat = seatDe(e, e.vez);
    if (!humano(seat)) return;
    const j = e.vez;
    if (e.fase === 'decidir') {
      el.acoes.hidden = false;
      if (e.jogo === 'koikoi') {
        const d = e.x.dec;
        const nomes = d.yaku.map((y) => y.nome + ' ' + y.pts).join(', ');
        let tot = d.tot, mult = 1;
        if (tot >= 7) mult *= 2;
        if (e.x.koi[0] || e.x.koi[1]) mult *= 2;
        el.acoes.appendChild(linhaTxt('Você formou: ' + nomes + '. Fechar agora vale ' + tot * mult + (tot * mult === 1 ? ' ponto' : ' pontos') + (mult > 1 ? ' (já dobrado)' : '') + '.'));
        const b = document.createElement('div'); b.className = 'acoes-bts';
        b.appendChild(botao('Koi-Koi! (continuar)', 'btn-secondary', () => aplicarAcao({ t: 'd', k: 'koi' })));
        b.appendChild(botao('Fechar (shōbu)', 'btn-primary', () => aplicarAcao({ t: 'd', k: 'parar' })));
        el.acoes.appendChild(b);
      } else {
        const d = e.x.dec;
        el.acoes.appendChild(linhaTxt('Você formou ' + d.d.nome + ' (' + d.d.kan + ' kan). Parar encerra a rodada agora. Sage continua a rodada: se você melhorar o yaku recebe o novo valor, senão recebe só metade.'));
        const b = document.createElement('div'); b.className = 'acoes-bts';
        b.appendChild(botao('Sage (continuar)', 'btn-secondary', () => aplicarAcao({ t: 'd', k: 'sage' })));
        b.appendChild(botao('Parar e receber', 'btn-primary', () => aplicarAcao({ t: 'd', k: 'parar' })));
        el.acoes.appendChild(b);
      }
      return;
    }
    if (kabu && e.fase === 'aposta') {
      el.acoes.hidden = false;
      const l = acoesAtuais(), teto = l[l.length - 1].v;
      let v = Math.min(teto, Math.max(1, Math.round(teto / 2)));
      const quando = document.createElement('div'); quando.className = 'aposta';
      const menos = document.createElement('button'); menos.type = 'button'; menos.className = 'passo-btn'; menos.textContent = '−'; menos.setAttribute('aria-label', 'Apostar menos');
      const mais = document.createElement('button'); mais.type = 'button'; mais.className = 'passo-btn'; mais.textContent = '+'; mais.setAttribute('aria-label', 'Apostar mais');
      const val = document.createElement('b'); val.className = 'aposta-v';
      const att = () => { val.textContent = v + (v === 1 ? ' ficha' : ' fichas'); menos.disabled = v <= 1; mais.disabled = v >= teto; };
      menos.addEventListener('click', () => { v = Math.max(1, v - Math.max(1, Math.round(teto / 10))); att(); });
      mais.addEventListener('click', () => { v = Math.min(teto, v + Math.max(1, Math.round(teto / 10))); att(); });
      quando.append(menos, val, mais);
      att();
      el.acoes.appendChild(linhaTxt(seatNome(seat) + ', quanto você aposta? (de 1 a ' + teto + ' fichas)'));
      el.acoes.appendChild(quando);
      const atalhos = document.createElement('div'); atalhos.className = 'acoes-bts pequeno';
      [['Mín', 1], ['Metade', Math.max(1, Math.round(teto / 2))], ['Máx', teto]].forEach(([t, q]) => atalhos.appendChild(botao(t, 'btn-secondary', () => { v = q; att(); })));
      el.acoes.appendChild(atalhos);
      el.acoes.appendChild(botao('Apostar', 'btn-primary', () => aplicarAcao({ t: 'ap', v })));
      return;
    }
    if (kabu && e.fase === 'cartas') {
      el.acoes.hidden = false;
      el.acoes.appendChild(linhaTxt(textoMao(e, j)));
      const l = acoesAtuais();
      const b = document.createElement('div'); b.className = 'acoes-bts';
      if (l.some((a) => a.t === 'p')) b.appendChild(botao('Pedir carta', 'btn-secondary', () => aplicarAcao({ t: 'p' })));
      if (l.some((a) => a.t === 'f')) b.appendChild(botao('Parar', 'btn-primary', () => aplicarAcao({ t: 'f' })));
      el.acoes.appendChild(b);
      if (l.length === 1) el.acoes.appendChild(linhaTxt(l[0].t === 'p' ? 'Pela regra, você precisa pedir carta.' : 'Pela regra, você não pode pedir mais cartas.', 'acoes-nota'));
    }
  }

  /* ==========================================================================
     6. Robô
     ========================================================================== */
  function iniciarWorker() {
    try {
      worker = new Worker('robo-worker.js');
      worker.onmessage = (m) => {
        const r = m.data, f = pendentes[r.id];
        if (f) { delete pendentes[r.id]; f(r); }
      };
      worker.onerror = () => { worker = null; Object.keys(pendentes).forEach((k) => { pendentes[k](null); delete pendentes[k]; }); };
    } catch (err) { worker = null; }
  }

  function pedirRobo(e, j, nivel) {
    const m = mod(e.jogo);
    const visao = m.visao(e, j);
    const semente = (Math.random() * 4294967296) >>> 0;
    const local = () => new Promise((ok) => setTimeout(() => ok({ acao: HON.escolher(e.jogo, visao, j, nivel, semente) }), 30));
    if (!worker) return local();
    const id = ++reqId;
    return new Promise((ok) => {
      const t = setTimeout(() => { if (pendentes[id]) { delete pendentes[id]; ok(null); } }, 30000);
      pendentes[id] = (r) => { clearTimeout(t); ok(r); };
      try { worker.postMessage({ id, jogo: e.jogo, estado: visao, j, nivel, semente }); } catch (err) { delete pendentes[id]; clearTimeout(t); ok(null); }
    }).then((r) => r && r.acao ? r : local());
  }

  async function vezDoRobo() {
    const gen = geracao, e = P.est, j = e.vez, m = mod();
    ocupado = true;
    pintar();
    const t0 = Date.now();
    const r = await pedirRobo(e, j, P.nivel);
    if (gen !== geracao || !P) return;
    const espera = (reduzido() ? 200 : (e.fase === 'decidir' ? 900 : 700)) - (Date.now() - t0);
    if (espera > 0) await new Promise((ok) => setTimeout(ok, espera));
    if (gen !== geracao || !P) return;
    let a = r && r.acao;
    const legais = m.acoes(e);
    if (!a || !legais.some((x) => JSON.stringify(x) === JSON.stringify(a))) a = legais[0];
    ocupado = false;
    await aplicarAcao(a);
  }

  /* ==========================================================================
     Ciclo da partida
     ========================================================================== */
  async function ciclo() {
    if (!P || P.terminou || ocupado) return;
    const e = P.est, m = mod();
    P.maoIni = Math.max(P.maoIni || 0, e.mao ? Math.max.apply(null, e.mao.map((x) => x.length)) : 0);
    if (!ehKabu(e.jogo)) P.campoIni = Math.max(P.campoIni || 0, e.campo.length);
    if (e.fase === 'fimrod') { fimRodadaTela(false); return; }
    const seat = seatDe(e, e.vez);
    if (humano(seat)) {
      // aparelho compartilhado: pede para passar o aparelho antes de mostrar a mão
      if (P.modo === 'local' && P.visSeat !== seat) { passarAparelho(seat); return; }
      pintar();
      mostrarAcoes();
      avisoDaVez();
      return;
    }
    limparAcoes();
    await vezDoRobo();
  }

  function avisoDaVez() {
    const e = P.est;
    if (e.fase === 'jogar') dizer(ehKabu(e.jogo) ? '' : (seatNome(seatDe(e, e.vez)) + ': escolha uma carta da mão.'));
    else if (e.fase === 'virar') dizer('Escolha qual carta do campo pegar com a carta virada.');
    else if (e.fase === 'decidir') dizer('Você formou um yaku. Decida.');
  }

  function passarAparelho(seat) {
    trocaPendente = true;
    P.visSeat = null;
    pintar();
    limparAcoes();
    el.telaTitulo.textContent = 'Vez de ' + seatNome(seat);
    el.telaCorpo.innerHTML = '';
    const p = document.createElement('p'); p.textContent = 'Passe o aparelho para ' + seatNome(seat) + '. As cartas só aparecem depois do toque, para os outros jogadores não verem.';
    el.telaCorpo.appendChild(p);
    el.telaBtn.textContent = 'Estou pronto';
    el.telaBtn2.hidden = true;
    el.telaBtn.onclick = () => { esconderTela(); trocaPendente = false; P.visSeat = seat; gravarPartida(); ciclo(); };
    el.tela.hidden = false;
  }

  function esconderTela() { el.tela.hidden = true; }

  /* ==========================================================================
     7. Fim de rodada e de partida
     ========================================================================== */
  const sinal = (n) => (n > 0 ? '+' + n : String(n));
  const fmtN = (n) => (Math.abs(n - Math.round(n)) < 1e-9 ? String(Math.round(n)) : n.toFixed(1));

  function tabelaRes(e) {
    const kabu = ehKabu(e.jogo);
    const res = e.res;
    const wrap = document.createElement('div'); wrap.className = 'res';
    const p0 = document.createElement('p'); p0.className = 'res-motivo'; p0.textContent = res.motivo; wrap.appendChild(p0);
    res.jog.forEach((q, j) => {
      const seat = seatDe(e, j);
      const l = document.createElement('div'); l.className = 'res-lin' + (res.vencedor === j ? ' vence' : '');
      const n = document.createElement('b'); n.textContent = seatNome(seat) + (kabu && j === e.banca ? ' (banca)' : ''); l.appendChild(n);
      const g = document.createElement('span'); g.className = 'res-g ' + (q.ganho > 0 ? 'pos' : q.ganho < 0 ? 'neg' : ''); g.textContent = sinal(fmtN(q.ganho)) === '+0' ? '0' : sinal(fmtN(q.ganho)); l.appendChild(g);
      const d = document.createElement('small');
      if (kabu) {
        if (q.cartas && q.cartas.length) d.textContent = q.cartas.map((c) => HON.mes(c)).join(' + ') + ' = ' + q.soma + (e.jogo === 'oichokabu' ? ' (' + q.nomeDigito + ')' : '') + (q.estouro ? ' estourou' : '') + (q.yaku.length ? ' · ' + q.yaku.map((y) => y.nome).join(', ') : '') + (q.nota ? ' · ' + q.nota : '');
      } else {
        const ys = (q.yaku || []).map((y) => y.nome + (y.mao ? ' (mão)' : '') + ' ' + y.pts).join(', ');
        d.textContent = q.cartas + ' pts em cartas' + (ys ? ' · ' + ys : '') + (q.nota ? ' · ' + q.nota : '');
      }
      l.appendChild(d);
      wrap.appendChild(l);
    });
    return wrap;
  }

  function classificacao(e) {
    const kabu = ehKabu(e.jogo);
    const v = kabu ? e.fichas : e.pts;
    const ordem = v.map((x, i) => [x, i]).sort((a, b) => b[0] - a[0]);
    return ordem;
  }

  function fimRodadaTela(forcarAvanco) {
    if (!P) return;
    const e = P.est, m = mod();
    const fimPartida = m.fimPartida(e);
    if (forcarAvanco) {
      if (fimPartida) { mostrarFimPartida(); return; }
      proximaRodada();
      return;
    }
    // mostra o resultado da rodada
    limparAcoes();
    if (P.rodadaMostrada === e.rod) { mostrarAcoes(); return; }
    P.rodadaMostrada = e.rod;
    const kabu = ehKabu(e.jogo);
    pintar();
    const eu = P.modo === 'robo' ? jDe(e, 0) : -1;
    const venci = eu >= 0 && e.res.ganhos[eu] > 0;
    const perdi = eu >= 0 && e.res.ganhos[eu] < 0;
    if (eu >= 0) { ON.som(venci ? 'vitoria' : perdi ? 'derrota' : 'toque'); ON.vibrar(venci ? 'vitoria' : perdi ? 'derrota' : 'toque'); }
    el.telaTitulo.textContent = fimPartida ? 'Última rodada' : 'Fim da rodada ' + e.rod;
    el.telaCorpo.innerHTML = '';
    el.telaCorpo.appendChild(tabelaRes(e));
    if (e.jogo === 'roppyakken') {
      const p = document.createElement('p'); p.className = 'res-motivo'; p.textContent = 'Placar: ' + e.pts.map((x, s) => seatNome(s) + ' ' + x).join(' · ') + ' (meta 600).'; el.telaCorpo.appendChild(p);
    }
    el.telaBtn.textContent = fimPartida ? 'Ver resultado final' : 'Próxima rodada';
    el.telaBtn.onclick = () => { esconderTela(); fimRodadaTela(true); };
    el.telaBtn2.hidden = false;
    el.telaBtn2.textContent = 'Ver a mesa';
    el.telaBtn2.onclick = () => { esconderTela(); mostrarAcoes(); };
    el.tela.hidden = false;
    gravarPartida();
    atualizarHud();
  }

  async function proximaRodada() {
    const m = mod();
    P.est = m.proximaRodada(P.est);
    P.maoIni = 0; P.campoIni = 0;
    mesa.novaRodada();
    sel = null; dicas = [];
    gravarPartida();
    anunciarRodada();
    pintar();
    mostrarAcoes();
    ciclo();
  }

  function anunciarRodada() {
    const e = P.est;
    const partes = ['Rodada ' + e.rod + '.'];
    if (!ehKabu(e.jogo)) {
      partes.push('Abre: ' + seatNome(seatDe(e, 0)) + '.');
      if (e.mesa > e.n) {
        const fora = []; for (let s = 0; s < e.mesa; s++) if (e.assentos.indexOf(s) < 0) fora.push(seatNome(s));
        partes.push('Descansa: ' + fora.join(', ') + '.');
      }
      if (e.jogo === 'hachihachi' && e.x.mult > 1) partes.push('Taxa x' + e.x.mult + '.');
      if (e.x && e.x.teyaku) {
        e.x.teyaku.forEach((l, j) => { if (l && l.length) partes.push(seatNome(seatDe(e, j)) + ' tem ' + l.map((y) => y.nome + (y.kan ? ' (' + y.kan + ' kan)' : (y.pts ? ' (' + y.pts + ')' : ''))).join(', ') + ' na mão.'); });
      }
    } else partes.push('Banca: ' + seatNome(seatDe(e, e.banca)) + '.');
    dizer(partes.join(' '));
  }

  function mostrarFimPartida() {
    const e = P.est, kabu = ehKabu(e.jogo);
    const cl = classificacao(e);
    const topo = cl[0][0];
    const vencedores = cl.filter((x) => x[0] === topo).map((x) => x[1]);
    P.terminou = true;
    const eu = P.modo === 'robo' ? 0 : -1;
    const venci = eu >= 0 && vencedores.indexOf(eu) >= 0;
    registrarStats(e, venci, eu >= 0 ? (kabu ? e.fichas[0] : e.pts[0]) : null);
    ON_store_del(LS.jogo + P.id);
    el.telaTitulo.textContent = eu >= 0 ? (venci ? (vencedores.length > 1 ? 'Empate na frente!' : 'Você venceu!') : 'Fim da partida') : 'Fim da partida';
    el.telaCorpo.innerHTML = '';
    const p = document.createElement('p'); p.className = 'res-motivo';
    p.textContent = vencedores.length > 1 ? 'Empate entre ' + vencedores.map((s) => seatNome(s)).join(' e ') + '.' : seatNome(vencedores[0]) + ' ganhou a partida.';
    el.telaCorpo.appendChild(p);
    const wrap = document.createElement('div'); wrap.className = 'res';
    cl.forEach(([v, s], i) => {
      const l = document.createElement('div'); l.className = 'res-lin' + (v === topo ? ' vence' : '');
      const n = document.createElement('b'); n.textContent = (i + 1) + '. ' + seatNome(s); l.appendChild(n);
      const g = document.createElement('span'); g.className = 'res-g'; g.textContent = fmtN(v) + (kabu ? ' fichas' : ' pts'); l.appendChild(g);
      wrap.appendChild(l);
    });
    el.telaCorpo.appendChild(wrap);
    if (eu >= 0) { ON.som(venci ? 'vitoria' : 'derrota'); ON.impacto(el.box, venci ? 'vitoria' : 'derrota'); }
    el.telaBtn.textContent = 'Nova partida';
    el.telaBtn.onclick = () => { esconderTela(); comecar(P.id); };
    el.telaBtn2.hidden = true;
    el.tela.hidden = false;
    limparAcoes();
    atualizarHud();
  }

  /* ==========================================================================
     8. Painéis (partida, cartas, capturas)
     ========================================================================== */
  function textoPartida() {
    const id = jogoAtualId, info = infoDe(id);
    const n = Math.max(info.jog[0], Math.min(info.jog[1], prefs.jog[id] || info.jog[2]));
    const modo = prefs.modo === 'robo' ? 'robô nível ' + prefs.nivel : 'mesmo aparelho';
    return (n + ' jogadores, ' + modo).replace(/^1 /, '1 ');
  }

  function atualizarPainelPartida() {
    const id = jogoAtualId, info = infoDe(id);
    const n = Math.max(info.jog[0], Math.min(info.jog[1], prefs.jog[id] || info.jog[2]));
    $('#partida-atual').textContent = n + (n === 1 ? ' jogador' : ' jogadores') + (prefs.modo === 'robo' ? ', robô nível ' + prefs.nivel : ', mesmo aparelho');
    document.querySelectorAll('#op-modo .seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.modo)));
    document.querySelectorAll('#op-nivel .seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.v === prefs.nivel)));
    $('#linha-nivel').hidden = prefs.modo !== 'robo';
    $('#nivel-nome').hidden = prefs.modo !== 'robo';
    $('#nivel-nome').textContent = NIVEL_TXT[prefs.nivel];
    $('#jog-valor').textContent = String(n);
    $('#jog-menos').disabled = n <= info.jog[0];
    $('#jog-mais').disabled = n >= info.jog[1];
    $('#linha-jogadores').hidden = info.jog[0] === info.jog[1];
    const rod = $('#op-rodadas');
    $('#linha-rodadas').hidden = !info.rod;
    if (info.rod) {
      const atual = prefs.rod[id] && info.rod.indexOf(prefs.rod[id]) >= 0 ? prefs.rod[id] : info.rodPad;
      rod.textContent = '';
      info.rod.forEach((q) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'seg-btn'; b.dataset.v = q; b.textContent = q;
        b.setAttribute('aria-pressed', String(q === atual));
        b.setAttribute('aria-label', q + (q === 1 ? ' rodada' : ' rodadas'));
        rod.appendChild(b);
      });
    }
    $('#partida-aviso').textContent = id === 'hachihachi' || id === 'sudaoshi'
      ? 'Com mais de 3 jogadores, três jogam por rodada e os outros descansam, em rodízio. As opções valem a partir da próxima partida.'
      : id === 'roppyakken' ? 'A partida termina quando alguém chega a 600 pontos (ou em 12 rodadas). As opções valem a partir da próxima partida.'
        : 'As opções valem a partir da próxima partida.';
  }

  /* altura que a mesa pode ocupar: a tela inteira quando os controles ficam ao lado, ou o que sobra abaixo de jogo e placar */
  function alturaMax() {
    const hh = (document.querySelector('header') || {}).offsetHeight || 60;
    const vh = window.innerHeight || 700;
    const lado = window.matchMedia('(orientation: landscape) and (min-width: 540px)').matches;
    return lado ? Math.max(300, vh - hh - 22) : Math.max(480, (vh - hh - 190) * 1.12);
  }

  function atualizarPainelCartas() {
    $('#cartas-atual').textContent = 'Borda ' + prefs.borda + (prefs.indice ? ', com índice' : '');
    document.querySelectorAll('#op-borda .seg-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === prefs.borda)));
    document.querySelectorAll('#op-indice .seg-btn').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.v === 'sim') === prefs.indice)));
    document.querySelectorAll('.borda-prev').forEach((s) => {
      if (s.dataset.pronto) return;
      s.dataset.pronto = '1';
      const antes = prefs.borda; H.iniciar({ borda: s.dataset.v });
      s.innerHTML = '<img src="' + H.arquivos()[0] + '" alt="" draggable="false">';
      H.iniciar({ borda: antes });
    });
  }

  function aplicarBorda() {
    H.iniciar({ borda: prefs.borda, base: 'hanafuda/' });
    if (mesa) mesa.recarregarImagens();
    document.documentElement.toggleAttribute('data-indice', false);
    if (prefs.indice) document.documentElement.setAttribute('data-indice', 'sim'); else document.documentElement.removeAttribute('data-indice');
    atualizarCapa();
  }

  /* ---------- capturas ---------- */
  function abrirCapturas() {
    if (!P) return;
    const e = P.est, m = mod();
    const corpo = $('#capt-corpo');
    corpo.textContent = '';
    if (ehKabu(e.jogo)) {
      const p = document.createElement('p'); p.textContent = 'Neste jogo não há cartas capturadas. Veja as fichas de cada jogador na mesa.'; corpo.appendChild(p);
      ON.modal.abrir('capt-modal'); return;
    }
    const vis = visJ(e);
    for (let j = 0; j < e.n; j++) {
      const sec = document.createElement('section'); sec.className = 'capt-sec';
      const cs = e.capt[j];
      const pts = cs.reduce((s, c) => s + m.valor(c), 0);
      const h = document.createElement('h3'); h.textContent = seatNome(seatDe(e, j)) + ': ' + cs.length + ' cartas, ' + pts + ' pontos'; sec.appendChild(h);
      let ys = [];
      try {
        if (m.yaku) ys = m.yaku(cs, j) || [];
        else if (e.jogo === 'hachihachi') { const d = m.deki(cs); if (d) ys = [{ nome: d.nome, pts: d.kan }]; }
      } catch (err) { ys = []; }
      if (ys.length) { const y = document.createElement('p'); y.className = 'capt-yaku'; y.textContent = 'Combinações: ' + ys.map((q) => q.nome + ' ' + (q.pts != null ? q.pts : q.kan)).join(', '); sec.appendChild(y); }
      const tipos = [['h', 'Luzes (光)'], ['t', 'Tane (種)'], ['z', 'Fitas (短冊)'], ['k', 'Kasu (カス)']];
      let alguma = false;
      tipos.forEach(([t, nome]) => {
        const l = cs.filter((c) => HON.TIPOS[c] === t).sort((a, b) => a - b);
        if (!l.length) return;
        alguma = true;
        const g = document.createElement('div'); g.className = 'capt-grupo';
        const gh = document.createElement('span'); gh.className = 'capt-tipo'; gh.textContent = nome + ' · ' + l.length; g.appendChild(gh);
        const cx = document.createElement('div'); cx.className = 'capt-cartas';
        cx.innerHTML = l.map((c) => H.mini(c)).join('');
        g.appendChild(cx);
        sec.appendChild(g);
      });
      if (!alguma) { const p = document.createElement('p'); p.className = 'capt-vazio'; p.textContent = 'Ainda sem cartas.'; sec.appendChild(p); }
      corpo.appendChild(sec);
    }
    ON.modal.abrir('capt-modal');
  }

  /* ---------- dica ---------- */
  async function dica() {
    if (!P || P.terminou) return;
    if (!minhaVez()) { dizer('A dica aparece na sua vez.'); return; }
    const e = P.est, m = mod(), j = e.vez;
    dizer('Pensando…');
    const gen = geracao;
    const r = await pedirRobo(e, j, 4);
    if (gen !== geracao || !minhaVez()) return;
    const a = r && r.acao;
    if (!a) { dizer(''); return; }
    if (a.t === 'j') {
      sel = a.c;
      dicas = a.a >= 0 ? [a.a] : [];
      const op = m.opcoes(e, a.c, 'mao').find((q) => q.a === a.a);
      dizer(a.a >= 0 ? 'Dica: jogue ' + nomeCarta(a.c) + ' sobre ' + nomeCarta(a.a) + '.' : 'Dica: jogue ' + nomeCarta(a.c) + ' no campo.');
      void op;
    } else if (a.t === 'v') {
      dicas = [a.a];
      dizer('Dica: pegue ' + nomeCarta(a.a) + '.');
    } else if (a.t === 'd') {
      dizer(a.k === 'koi' ? 'Dica: vale arriscar com Koi-Koi.' : a.k === 'sage' ? 'Dica: vale continuar com sage.' : 'Dica: feche agora e leve os pontos.');
    } else if (a.t === 'p') dizer('Dica: peça uma carta.');
    else if (a.t === 'f') dizer('Dica: pare.');
    else if (a.t === 'ap') dizer('Dica: aposte ' + a.v + '.');
    pintar();
  }

  /* ==========================================================================
     9. Escolher jogo e Como Jogar
     ========================================================================== */
  function capaHTML(id) { return '<span class="capa">' + INFO[id].capa.map((c) => H.mini(c)).join('') + '</span>'; }
  function atualizarCapa() {
    el.modoMini.innerHTML = capaHTML(jogoAtualId);
  }

  function construirJogos() {
    const corpo = el.jogosCorpo;
    corpo.textContent = '';
    GRUPOS.forEach((g) => {
      const ids = ORDEM.filter((id) => INFO[id].grupo === g[0]);
      if (!ids.length) return;
      const sec = document.createElement('section');
      sec.className = 'sec-jogos';
      sec.innerHTML = '<h3></h3><p class="sec-sub"></p><div class="tiles"></div>';
      sec.querySelector('h3').textContent = g[1];
      sec.querySelector('.sec-sub').textContent = g[2];
      const lista = sec.querySelector('.tiles');
      ids.forEach((id) => {
        const info = INFO[id], atual = id === jogoAtualId;
        const andamento = atual ? emAndamento() : !!ON_store_get(LS.jogo + id, null);
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'tile'; b.dataset.id = id;
        if (atual) b.setAttribute('aria-current', 'true');
        let pts = ''; for (let i = 1; i <= 5; i++) pts += '<i' + (i <= info.dif ? ' class="on"' : '') + '></i>';
        const jog = info.jog[0] === info.jog[1] ? info.jog[0] + ' jogadores' : info.jog[0] + ' a ' + info.jog[1] + ' jogadores';
        b.innerHTML = '<span class="tile-mini">' + capaHTML(id) + '</span><span class="tile-txt"><span class="tile-nome"></span>' +
          '<span class="tile-dif"><span class="pontos-dif" aria-hidden="true">' + pts + '</span><span class="tile-dif-txt"></span></span>' +
          '<span class="tile-desc"></span></span>';
        const nome = b.querySelector('.tile-nome');
        nome.textContent = info.nome;
        const jp = document.createElement('small'); jp.className = 'tile-jp'; jp.lang = 'ja'; jp.textContent = info.jp; nome.appendChild(jp);
        b.querySelector('.tile-dif-txt').textContent = DIF[info.dif] + ' · ' + jog;
        b.querySelector('.tile-desc').textContent = (window.HON.textos && HON.textos[id] && HON.textos[id].curto) || info.curto;
        if (atual || andamento) {
          const selo = document.createElement('span');
          selo.className = 'tile-selo' + (andamento ? ' andamento' : '');
          selo.textContent = atual ? (andamento ? 'Jogando' : 'Selecionado') : 'Em andamento';
          b.querySelector('.tile-txt').insertBefore(selo, b.querySelector('.tile-desc'));
        }
        lista.appendChild(b);
      });
      corpo.appendChild(sec);
    });
  }

  function hidratarCartas(raiz) {
    raiz.querySelectorAll('.mc[data-c]').forEach((s) => { s.innerHTML = H.mini(+s.dataset.c); s.classList.remove('mc'); s.classList.add('mc-ok'); });
  }

  function montarAjuda() {
    const T = HON.textos || {};
    const geral = $('#painel-geral'), jogos = $('#painel-jogos');
    geral.innerHTML = '<h3>' + (T.geral ? T.geral.titulo : 'Hanafuda') + '</h3>' + (T.geral ? T.geral.html : '');
    jogos.textContent = '';
    const intro = document.createElement('p'); intro.className = 'intro-jogos'; intro.textContent = 'Toque no nome do jogo para ver as regras. O jogo que você está jogando agora vem aberto.'; jogos.appendChild(intro);
    ORDEM.forEach((id) => {
      const d = document.createElement('details'); d.id = 'ajuda-' + id;
      const s = document.createElement('summary');
      const t = T[id];
      s.innerHTML = '<span></span><small></small>';
      s.firstChild.appendChild(document.createTextNode(INFO[id].nome + ' '));
      const sj = document.createElement('span'); sj.className = 'sn-jp'; sj.lang = 'ja'; sj.textContent = '· ' + INFO[id].jp; s.firstChild.appendChild(sj);
      s.lastChild.textContent = INFO[id].jog[0] === INFO[id].jog[1] ? INFO[id].jog[0] + ' jog.' : INFO[id].jog[0] + ' a ' + INFO[id].jog[1] + ' jog.';
      d.appendChild(s);
      const corpo = document.createElement('div'); corpo.className = 'ajuda-jogo';
      corpo.innerHTML = t ? t.html : '<p>Texto em preparação.</p>';
      d.appendChild(corpo);
      jogos.appendChild(d);
    });
    hidratarCartas(geral); hidratarCartas(jogos);
  }

  function ligarAbas() {
    const abas = [...document.querySelectorAll('#howto-modal .aba')];
    const mostrar = (aba) => {
      abas.forEach((a) => {
        const s = a === aba;
        a.setAttribute('aria-selected', String(s));
        a.tabIndex = s ? 0 : -1;
        document.getElementById(a.getAttribute('aria-controls')).hidden = !s;
      });
      document.getElementById(aba.getAttribute('aria-controls')).scrollTop = 0;
    };
    abas.forEach((a) => {
      a.addEventListener('click', () => mostrar(a));
      a.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const novo = abas[(abas.indexOf(a) + (e.key === 'ArrowRight' ? 1 : -1) + abas.length) % abas.length];
        mostrar(novo); novo.focus(); e.preventDefault();
      });
    });
    const abrirJogoAtual = () => {
      mostrar(document.getElementById('aba-jogos'));
      document.querySelectorAll('#painel-jogos details').forEach((d) => { d.open = d.id === 'ajuda-' + jogoAtualId; });
      const d = document.getElementById('ajuda-' + jogoAtualId);
      if (d) setTimeout(() => d.scrollIntoView({ block: 'start' }), 60);
    };
    $('#howto-btn').addEventListener('click', () => { mostrar(abas[0]); });
    el.regras.addEventListener('click', () => { ON.modal.abrir('howto-modal'); abrirJogoAtual(); });
  }

  /* ==========================================================================
     Trocar de jogo e começar
     ========================================================================== */
  function mostrarTelaInicial() {
    const id = jogoAtualId, info = infoDe(id);
    const andamento = lerPartida(id);
    el.telaTitulo.textContent = info.nome;
    el.telaCorpo.innerHTML = '';
    const j = document.createElement('p'); j.className = 'tela-jp'; j.lang = 'ja'; j.textContent = info.jp; el.telaCorpo.appendChild(j);
    const p = document.createElement('p'); p.textContent = (HON.textos && HON.textos[id] && HON.textos[id].curto) || info.curto; el.telaCorpo.appendChild(p);
    const q = document.createElement('p'); q.className = 'tela-sub'; q.textContent = textoPartida() + '.'; el.telaCorpo.appendChild(q);
    el.telaBtn.textContent = andamento ? 'Continuar a partida' : 'Jogar';
    el.telaBtn.onclick = () => { esconderTela(); if (andamento) retomar(andamento); else comecar(id); };
    if (andamento) {
      el.telaBtn2.hidden = false; el.telaBtn2.textContent = 'Nova partida';
      el.telaBtn2.onclick = () => { esconderTela(); comecar(id); };
    } else el.telaBtn2.hidden = true;
    el.tela.hidden = false;
  }

  function prepararMesaVazia(id) {
    // mostra a mesa com o baralho do jogo virado, sem partida
    if (!mesa) return;
    const m = mod(id);
    const e = m.novo({ jogadores: infoDe(id).jog[2], rodadas: 3, semente: 12345 });
    const ant = P;
    P = { id, est: e, modo: 'robo', nivel: 3, humanos: [0], visSeat: null, iniciada: false, terminou: false };
    mesa.novaRodada();
    pintar(true);
    P = ant;
  }

  function trocarJogo(id) {
    if (id === jogoAtualId && P && P.id === id) return;
    if (P && P.iniciada && !P.terminou) gravarPartida();
    geracao++;
    ocupado = false; trocaPendente = false; sel = null; dicas = [];
    jogoAtualId = id; prefs.jogo = id; gravarPrefs();
    P = null; V = null;
    limparAcoes(); dizer('');
    const salva = lerPartida(id);
    atualizarCapa(); atualizarPainelPartida();
    el.modoNome.textContent = INFO[id].nome;
    if (salva) retomar(salva);
    else { prepararMesaVazia(id); P = null; mostrarTelaInicial(); }
  }

  function retomar(s) {
    geracao++;
    P = Object.assign({ rodadaMostrada: s.est.fase === 'fimrod' ? s.est.rod : 0 }, s);
    P.maoIni = 0; P.campoIni = 0;
    P.humanos = (P.humanos || [0]).slice();
    if (P.modo === 'local') P.visSeat = null;
    ocupado = false; trocaPendente = false; sel = null; dicas = [];
    jogoAtualId = P.id;
    if (mesa) mesa.novaRodada();
    atualizarCapa();
    pintar(true);
    dizer('Partida retomada.');
    mostrarAcoes();
    if (P.est.fase === 'fimrod') { P.rodadaMostrada = 0; fimRodadaTela(false); return; }
    ciclo();
  }

  function comecar(id) {
    jogoAtualId = id;
    esconderTela();
    novaPartida(id);
    atualizarCapa();
    anunciarRodada();
    limparAcoes();
    pintar(true);
    ciclo();
  }

  function pedirNovaPartida() {
    ON.novoJogo(emAndamento(), () => comecar(jogoAtualId), { texto: 'A partida em andamento será abandonada.', sim: 'Sim, começar outra' });
  }

  /* ---------- ouvintes ---------- */
  el.jogosCorpo.addEventListener('click', (e) => {
    const b = e.target.closest('.tile');
    if (!b) return;
    ON.modal.fechar();
    trocarJogo(b.dataset.id);
  });
  $('#modo-btn').addEventListener('click', construirJogos);
  el.restart.addEventListener('click', pedirNovaPartida);
  el.hint.addEventListener('click', dica);
  el.capt.addEventListener('click', abrirCapturas);

  $('#op-modo').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; prefs.modo = b.dataset.v; gravarPrefs(); atualizarPainelPartida(); });
  $('#op-nivel').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; prefs.nivel = +b.dataset.v; gravarPrefs(); atualizarPainelPartida(); });
  $('#op-rodadas').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; prefs.rod[jogoAtualId] = +b.dataset.v; gravarPrefs(); atualizarPainelPartida(); });
  const mudaJog = (d) => { const info = infoDe(jogoAtualId); const n = Math.max(info.jog[0], Math.min(info.jog[1], (prefs.jog[jogoAtualId] || info.jog[2]) + d)); prefs.jog[jogoAtualId] = n; gravarPrefs(); atualizarPainelPartida(); };
  $('#jog-menos').addEventListener('click', () => mudaJog(-1));
  $('#jog-mais').addEventListener('click', () => mudaJog(1));
  $('#op-borda').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; prefs.borda = b.dataset.v; gravarPrefs(); aplicarBorda(); atualizarPainelCartas(); });
  $('#op-indice').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (!b) return; prefs.indice = b.dataset.v === 'sim'; gravarPrefs(); aplicarBorda(); atualizarPainelCartas(); });

  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (P && !ocupado) pintar(true); else if (P && V) pintar(true); }, 120); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) gravarPartida(); });
  window.addEventListener('pagehide', gravarPartida);

  /* ==========================================================================
     10. Estatísticas e início
     ========================================================================== */
  function lerStats() { const s = ON_store_get(LS.stats, null); return s && s.jogos ? s : { jogos: {} }; }
  function registrarStats(e, venci, placar) {
    if (P.modo !== 'robo') { const s = lerStats(); const r = s.jogos[e.jogo] || (s.jogos[e.jogo] = { p: 0, v: 0, loc: 0, seq: 0, melhorSeq: 0, melhor: null }); r.loc = (r.loc || 0) + 1; ON_store_set(LS.stats, s); return; }
    const s = lerStats();
    const r = s.jogos[e.jogo] || (s.jogos[e.jogo] = { p: 0, v: 0, loc: 0, seq: 0, melhorSeq: 0, melhor: null });
    r.p++;
    if (venci) { r.v++; r.seq++; r.melhorSeq = Math.max(r.melhorSeq, r.seq); } else r.seq = 0;
    if (placar != null && (r.melhor == null || placar > r.melhor)) r.melhor = placar;
    ON_store_set(LS.stats, s);
  }
  function estatisticas() {
    const s = lerStats(), linhas = [];
    let p = 0, v = 0, loc = 0, ms = 0;
    Object.keys(s.jogos).forEach((id) => { const r = s.jogos[id]; p += r.p; v += r.v; loc += r.loc || 0; ms = Math.max(ms, r.melhorSeq || 0); });
    linhas.push({ rotulo: 'Partidas contra o robô', valor: p });
    linhas.push({ rotulo: 'Vitórias', valor: v });
    if (loc) linhas.push({ rotulo: 'Partidas no mesmo aparelho', valor: loc, larga: true });
    if (ms) linhas.push({ rotulo: 'Maior sequência de vitórias', valor: ms, larga: true });
    ORDEM.forEach((id) => {
      const r = s.jogos[id];
      if (!r || !(r.p || r.loc)) return;
      let t = r.p ? r.v + ' de ' + r.p : '';
      if (r.melhor != null) t += (t ? ' · ' : '') + 'melhor ' + fmtN(r.melhor) + (ehKabu(id) ? ' fichas' : ' pts');
      if (r.loc) t += (t ? ' · ' : '') + r.loc + ' locais';
      linhas.push({ rotulo: INFO[id].nome, valor: t, larga: true });
    });
    return linhas;
  }

  ON.init({
    id: 'hanafudaon',
    nome: 'HanafudaON!',
    configuracoes: ['som', 'vibracao', 'tremor', 'escuro', 'reduzir'],
    estatisticas,
    zerarEstatisticas: () => { ON_store_del(LS.stats); },
    pronto: () => {
      H.iniciar({ borda: prefs.borda, base: 'hanafuda/' });
      if (prefs.indice) document.documentElement.setAttribute('data-indice', 'sim');
      document.getElementById('partida-chevron').innerHTML = ON.icone('chevron', 18);
      document.getElementById('cartas-chevron').innerHTML = ON.icone('chevron', 18);
      document.getElementById('modo-chevron').innerHTML = ON.icone('chevron', 16);
      mesa = HON.criarMesa(el.mesa, { toqueCarta, toqueCampo, soltou, sobre, alturaMax });
      montarAjuda();
      ligarAbas();
      iniciarWorker();
      atualizarPainelPartida();
      atualizarPainelCartas();
      atualizarCapa();
      H.precarregar();
      const salva = lerPartida(prefs.jogo);
      jogoAtualId = prefs.jogo;
      el.modoNome.textContent = INFO[prefs.jogo].nome;
      if (salva) { prepararMesaVazia(prefs.jogo); mostrarTelaInicial(); }
      else { prepararMesaVazia(prefs.jogo); mostrarTelaInicial(); }
      if (!ON.store.get(LS.visto, false)) {
        ON.store.set(LS.visto, true);
        setTimeout(() => ON.modal.abrir('howto-modal'), 400);
      }
    }
  });
})();
