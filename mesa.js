/* ==========================================================================
   HanafudaON! - mesa.js (desenha a mesa: onde cada carta fica e como ela desliza)

   As 48 cartas são elementos .hcarta criados uma única vez. A cada render() cada carta recebe uma
   posição (transform) e o CSS faz o deslize. Nada aqui conhece regras: quem chama entrega o "visual"
   V (de onde cada carta está) e recebe de volta toques e arrastos.

   V (capturas) = { tipo:'captura', n, mao:[[ids]], campo:[ids], monte:[ids], capt:[[ids]], vis, rot:[{nome, info, vez, papel}],
                    dicas:[ids], sel:id|null, maoIni, alvoCampo:bool }
   V (apostas)  = { tipo:'kabu', n, mao:[[ids]], monte:[ids], vis, mostrar:bool, rot:[...], dicas:[] }
   vis = jogador cuja mão aparece de frente (-1: ninguém); as outras ficam viradas para baixo.
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };
  const R = 1600 / 976;
  const ORDEM_TIPO = { h: 0, t: 1, z: 2, k: 3 };

  function criarMesa(raiz, hooks) {
    const H = G.Hanafuda;
    const el = new Array(48);
    const camada = document.createElement('div');
    camada.className = 'mesa-camada';
    raiz.appendChild(camada);
    const rotBox = document.createElement('div');
    rotBox.className = 'mesa-rotulos';
    raiz.appendChild(rotBox);
    const zonaCampo = document.createElement('div');
    zonaCampo.className = 'zona-campo';
    zonaCampo.setAttribute('aria-hidden', 'true');
    camada.appendChild(zonaCampo);

    for (let i = 0; i < 48; i++) {
      const c = H.criar(i);
      c.classList.add('fora');
      camada.appendChild(c);
      el[i] = c;
    }

    let L = null;               // último layout (para acertar toques e arrastos)
    let slotsCampo = {};        // carta -> posição fixa no campo
    let rowsCampo = 2;          // linhas reservadas (não encolhe durante a rodada)
    let ultimoW = 0;

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    /* ---------- medidas ---------- */
    function medidas(W, modo) {
      const pad = W < 340 ? 4 : 8, gap = W < 340 ? 3 : 6;
      const max = W >= 1000 ? 92 : W >= 700 ? 80 : 74;
      let cw = (W - 2 * pad - 3 * gap) / 4;
      cw = clamp(cw, 36, max);
      if (modo === 'kabu') cw = clamp((W - 2 * pad - 4 * gap) / 5, 34, max);
      return { pad, gap, cw, ch: cw * R };
    }

    /* ---------- layout das capturas ---------- */
    function ordemCapt(l) {
      return l.slice().sort((a, b) => (ORDEM_TIPO[HON.TIPOS[a]] - ORDEM_TIPO[HON.TIPOS[b]]) || (a - b));
    }
    function leque(lista, x0, largura, y, sc, cw, z0, ch, out, up) {
      // espalha em linha, com sobreposição se não couber
      const w = cw * sc, n = lista.length;
      const passoMax = w * 0.78;
      const passo = n > 1 ? Math.min(passoMax, (largura - w) / (n - 1)) : 0;
      lista.forEach((c, i) => { out[c] = { x: x0 + i * Math.max(passo, 2), y, s: sc, z: z0 + i, up: up !== false }; });
      return n ? ch * sc : 0;
    }

    function layoutCaptura(V, W) {
      const m = medidas(W, 'captura'), { pad, gap, cw, ch } = m;
      const pos = {}, rotulos = [];
      let y = pad;
      const vis = V.vis;
      const opps = []; for (let j = 0; j < V.n; j++) if (j !== vis) opps.push(j);
      const pc = Math.max(1, Math.min(opps.length, W >= 560 ? 3 : (W >= 330 ? 2 : 1)));
      const pw = (W - 2 * pad - (pc - 1) * gap) / pc;
      const sMini = W < 340 ? 0.5 : 0.52;
      const cwS = cw * sMini, chS = ch * sMini;
      // painéis dos outros jogadores
      let linhaY = y;
      opps.forEach((j, k) => {
        const col = k % pc;
        if (col === 0 && k > 0) linhaY += 18 + chS + 3 + chS + 10;
        const px = pad + col * (pw + gap);
        rotulos.push({ x: px, y: linhaY, w: pw, j });
        const ys = linhaY + 19;
        const mao = V.mao[j];
        const passoM = mao.length > 1 ? Math.min(cwS * 0.7, (pw - cwS) / (mao.length - 1)) : 0;
        mao.forEach((c, i) => { pos[c] = { x: px + i * passoM, y: ys, s: sMini, z: 10 + i, up: false }; });
        leque(ordemCapt(V.capt[j]), px, pw, ys + chS + 3, sMini, cw, 100, ch, pos);
      });
      if (opps.length) y = linhaY + 18 + chS + 3 + chS + 10;
      // monte e campo
      const sMonte = 0.62;
      const dw = cw * sMonte, dh = ch * sMonte;
      const topoMonte = V.monte.length;
      V.monte.forEach((c, i) => {
        const camadaI = Math.min(2, topoMonte - 1 - i);
        const off = camadaI <= 2 ? camadaI : 2;
        pos[c] = { x: pad + off * 1.2, y: y + 2 - off * 1.2, s: sMonte, z: 5 + i, up: false };
      });
      rotulos.push({ x: pad + dw + 10, y: y + 2, w: W - 2 * pad - dw - 10, monte: V.monte.length, tipo: 'monte' });
      y += dh + 8;
      const cols = Math.max(2, Math.floor((W - 2 * pad + gap) / (cw + gap)));
      const largCampo = cols * cw + (cols - 1) * gap;
      const x0 = (W - largCampo) / 2;
      // slots fixos
      Object.keys(slotsCampo).forEach((k) => { if (V.campo.indexOf(+k) < 0) delete slotsCampo[k]; });
      const usados = new Set(Object.keys(slotsCampo).map((k) => slotsCampo[k]));
      V.campo.forEach((c) => {
        if (slotsCampo[c] === undefined) { let s = 0; while (usados.has(s)) s++; slotsCampo[c] = s; usados.add(s); }
      });
      let maxSlot = 0; V.campo.forEach((c) => { maxSlot = Math.max(maxSlot, slotsCampo[c]); });
      rowsCampo = Math.max(rowsCampo, Math.ceil((maxSlot + 1) / cols), Math.ceil(Math.max(8, (V.campoIni || 8) + 2) / cols));
      V.campo.forEach((c) => {
        const s = slotsCampo[c], r = Math.floor(s / cols), q = s % cols;
        pos[c] = { x: x0 + q * (cw + gap), y: y + r * (ch + gap), s: 1, z: 40 + s, up: true };
      });
      const campoRect = { x: pad - 2, y: y - 4, w: W - 2 * pad + 4, h: rowsCampo * (ch + gap) + 4 };
      y += rowsCampo * (ch + gap) + 6;
      // capturas e mão de quem joga
      let maoRect = null;
      if (vis >= 0) {
        rotulos.push({ x: pad, y, w: W - 2 * pad, j: vis, meu: true });
        y += 19;
        const sC = W < 340 ? 0.5 : 0.56;
        const hC = leque(ordemCapt(V.capt[vis]), pad, W - 2 * pad, y, sC, cw, 100, ch, pos);
        const altC = ch * sC;
        y += altC + 8;
        // mão
        const n = V.mao[vis].length, ini = Math.max(n, V.maoIni || n);
        const disp = W - 2 * pad;
        const vistos = V.mao[vis].slice().sort((a, b) => a - b);
        const calc = (nn) => {
          let rows = 1, perRow = nn, step = 0;
          for (; rows <= 4; rows++) {
            perRow = Math.ceil(nn / rows);
            step = perRow > 1 ? Math.min(cw + gap, (disp - cw) / (perRow - 1)) : 0;
            if (step >= cw * 0.74 || perRow <= 1) break;
          }
          return { rows: Math.min(rows, 4), perRow, step };
        };
        const cIni = calc(ini);
        let rowsRes = 1;
        vistos.forEach((c, i) => {
          const r = Math.floor(i / cIni.perRow), q = i % cIni.perRow;
          rowsRes = Math.max(rowsRes, r + 1);
          const nLinha = Math.min(cIni.perRow, vistos.length - r * cIni.perRow);
          const larg = cw + (nLinha - 1) * cIni.step;
          const xx = pad + (disp - larg) / 2 + q * cIni.step;
          pos[c] = { x: xx, y: y + r * (ch + gap), s: 1, z: 60 + i, up: true, mao: true };
        });
        maoRect = { x: pad, y: y - 2, w: disp, h: rowsRes * (ch + gap) + 2 };
        y += rowsRes * (ch + gap) + 4;
      }
      return { pos, rotulos, H: y + 2, campoRect, maoRect, cw, ch, W };
    }

    /* ---------- layout das apostas ---------- */
    function layoutKabu(V, W) {
      const m = medidas(W, 'kabu'), { pad, gap, cw, ch } = m;
      const pos = {}, rotulos = [];
      let y = pad;
      const sMonte = 0.55, dw = cw * sMonte, dh = ch * sMonte;
      V.monte.forEach((c, i) => {
        const off = Math.min(2, V.monte.length - 1 - i);
        pos[c] = { x: pad + off * 1.2, y: y + 2 - off * 1.2, s: sMonte, z: 5 + i, up: false };
      });
      rotulos.push({ x: pad + dw + 10, y: y + 2, w: W - 2 * pad - dw - 10, monte: V.monte.length, tipo: 'monte' });
      y += dh + 8;
      const sMao = V.n <= 4 ? 0.82 : V.n <= 6 ? 0.66 : 0.5;
      const cwM = cw * sMao, chM = ch * sMao;
      // ordem de exibição: a cadeira de quem joga primeiro, depois as outras
      const ordem = V.ordemVisual || Array.from({ length: V.n }, (_, i) => i);
      ordem.forEach((j) => {
        rotulos.push({ x: pad, y, w: W - 2 * pad, j, meu: j === V.vis, kabu: true });
        y += 19;
        const mao = V.mao[j];
        const passo = Math.min(cwM + gap, mao.length > 1 ? (W - 2 * pad - cwM) / (mao.length - 1) : 0);
        mao.forEach((c, i) => {
          const frente = V.mostrar || j === V.vis;
          pos[c] = { x: pad + i * Math.max(passo, 4), y, s: sMao, z: 20 + i, up: frente };
        });
        y += (mao.length ? chM : 0) + 6;
      });
      return { pos, rotulos, H: y + 2, cw, ch, W };
    }

    /* ---------- render ---------- */
    function render(V, op) {
      op = op || {};
      const W = raiz.clientWidth || 300;
      ultimoW = W;
      const lay = V.tipo === 'kabu' ? layoutKabu(V, W) : layoutCaptura(V, W);
      L = lay;
      raiz.style.setProperty('--w', lay.cw + 'px');
      raiz.style.setProperty('--h', lay.ch + 'px');
      raiz.style.height = Math.ceil(lay.H) + 'px';
      const dicas = new Set(V.dicas || []);
      const pegaveis = new Set(V.pegaveis || []);
      for (let i = 0; i < 48; i++) {
        const p = lay.pos[i], e = el[i];
        if (!p) { if (!e.classList.contains('fora')) e.classList.add('fora'); continue; }
        e.classList.remove('fora');
        e.style.transitionDelay = V.atraso && V.atraso[i] ? V.atraso[i] + 'ms' : '';
        if (op.semAnim) e.classList.add('sem-trans');
        e.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px,0) scale(' + p.s.toFixed(3) + ')';
        e.style.zIndex = p.z;
        e.classList.toggle('oculta', !p.up);
        e.classList.toggle('dica', dicas.has(i));
        e.classList.toggle('sel', V.sel === i);
        e.classList.toggle('pega', pegaveis.has(i));
        e.classList.toggle('apagada', !!(V.apagadas && V.apagadas.indexOf(i) >= 0));
        e.tabIndex = pegaveis.has(i) || dicas.has(i) ? 0 : -1;
        if (op.semAnim) { void e.offsetWidth; e.classList.remove('sem-trans'); }
      }
      zonaCampo.style.display = lay.campoRect ? 'block' : 'none';
      if (lay.campoRect) {
        const r = lay.campoRect;
        zonaCampo.style.transform = 'translate(' + r.x + 'px,' + r.y + 'px)';
        zonaCampo.style.width = r.w + 'px';
        zonaCampo.style.height = r.h + 'px';
        zonaCampo.classList.toggle('alvo', !!V.alvoCampo);
      }
      // rótulos
      rotBox.textContent = '';
      lay.rotulos.forEach((r) => {
        const d = document.createElement('div');
        d.style.transform = 'translate(' + r.x + 'px,' + r.y + 'px)';
        d.style.width = Math.max(40, r.w) + 'px';
        if (r.tipo === 'monte') {
          d.className = 'rot rot-monte';
          d.textContent = V.textoMonte ? V.textoMonte : ('Monte: ' + r.monte + (r.monte === 1 ? ' carta' : ' cartas'));
        } else {
          const info = V.rot[r.j] || {};
          d.className = 'rot' + (info.vez ? ' vez' : '') + (r.meu ? ' meu' : '');
          d.dataset.j = r.j;
          const a = document.createElement('b'); a.textContent = info.nome || ('Jogador ' + (r.j + 1)); d.appendChild(a);
          if (info.papel) { const p = document.createElement('i'); p.textContent = info.papel; d.appendChild(p); }
          const s = document.createElement('span'); s.textContent = info.info || ''; d.appendChild(s);
        }
        rotBox.appendChild(d);
      });
    }

    /* ---------- toques e arrastos ---------- */
    function idDe(alvo) {
      const c = alvo.closest && alvo.closest('.hcarta');
      return c && c.dataset.c !== undefined ? +c.dataset.c : null;
    }
    raiz.addEventListener('click', (ev) => {
      if (arrastou) { arrastou = false; return; }
      const id = idDe(ev.target);
      if (id !== null) { hooks.toqueCarta(id); return; }
      const rot = ev.target.closest('.rot[data-j]');
      if (rot && hooks.toqueRotulo) { hooks.toqueRotulo(+rot.dataset.j); return; }
      if (ev.target.closest('.zona-campo')) hooks.toqueCampo && hooks.toqueCampo();
    });
    raiz.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      const id = idDe(ev.target);
      if (id !== null) { ev.preventDefault(); hooks.toqueCarta(id); }
    });

    let arrasto = null, arrastou = false;
    raiz.addEventListener('pointerdown', (ev) => {
      if (ev.button > 0) return;
      const id = idDe(ev.target);
      if (id === null || !el[id].classList.contains('pega')) return;
      arrasto = { id, x0: ev.clientX, y0: ev.clientY, andando: false, pid: ev.pointerId };
    });
    raiz.addEventListener('pointermove', (ev) => {
      if (!arrasto || ev.pointerId !== arrasto.pid) return;
      const dx = ev.clientX - arrasto.x0, dy = ev.clientY - arrasto.y0;
      if (!arrasto.andando) {
        if (Math.hypot(dx, dy) < 8) return;
        arrasto.andando = true;
        try { raiz.setPointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
        const e = el[arrasto.id];
        e.classList.add('arrastando');
        arrasto.base = L && L.pos[arrasto.id] ? L.pos[arrasto.id] : { x: 0, y: 0, s: 1 };
        if (hooks.comecaArrasto) hooks.comecaArrasto(arrasto.id);
      }
      const b = arrasto.base;
      el[arrasto.id].style.transform = 'translate3d(' + (b.x + dx).toFixed(1) + 'px,' + (b.y + dy).toFixed(1) + 'px,0) scale(1.06)';
      const alvo = alvoSob(ev.clientX, ev.clientY);
      if (hooks.sobre) hooks.sobre(alvo);
      ev.preventDefault();
    }, { passive: false });
    function alvoSob(cx, cy) {
      const r = raiz.getBoundingClientRect();
      const x = cx - r.left, y = cy - r.top;
      if (!L) return null;
      const ids = Object.keys(L.pos).map(Number).filter((i) => L.pos[i].up && !L.pos[i].mao && el[i] && !el[i].classList.contains('arrastando'));
      for (let k = 0; k < ids.length; k++) {
        const p = L.pos[ids[k]];
        if (p.s < 0.9) continue;
        if (x >= p.x && x <= p.x + L.cw * p.s && y >= p.y && y <= p.y + L.ch * p.s) return { carta: ids[k] };
      }
      const z = L.campoRect;
      if (z && x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return { campo: true };
      return null;
    }
    function fimArrasto(ev, cancelado) {
      if (!arrasto || ev.pointerId !== arrasto.pid) return;
      const a = arrasto; arrasto = null;
      if (!a.andando) return;
      arrastou = true;
      setTimeout(() => { arrastou = false; }, 60);
      el[a.id].classList.remove('arrastando');
      const alvo = cancelado ? null : alvoSob(ev.clientX, ev.clientY);
      try { raiz.releasePointerCapture(ev.pointerId); } catch (e) { /* ignora */ }
      if (hooks.soltou) hooks.soltou(a.id, alvo);
    }
    raiz.addEventListener('pointerup', (ev) => fimArrasto(ev, false));
    raiz.addEventListener('pointercancel', (ev) => fimArrasto(ev, true));

    function novaRodada() { slotsCampo = {}; rowsCampo = 2; }
    function elemento(id) { return el[id]; }
    function recarregarImagens() { for (let i = 0; i < 48; i++) H.face(el[i], i); el.forEach((e) => { const im = e.querySelector('.hverso img'); if (im) im.src = H.arquivos()[48]; }); }
    function relayout() { return L; }

    return { render, novaRodada, elemento, recarregarImagens, layout: relayout, largura: () => ultimoW };
  }

  HON.criarMesa = criarMesa;
})(typeof window !== 'undefined' ? window : globalThis);
