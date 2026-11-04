/* ==========================================================================
   hanafuda.js - baralho de Hanafuda (花札) da família ON! (arquivo reutilizável)

   As 48 cartas são os SVG da pasta "hanafuda/" (cores tradicionais, ver hanafuda/CREDITOS.txt).
   Duas versões de borda: "preta" e "vermelha". Cada jogo leva só a pasta que usa.

   Carta = número de 0 a 47, de 4 em 4 por mês (mês 1 = 0 a 3).
   Em cada mês a ordem é: hikari (光), tane (種), tanzaku (短冊), kasu (カス).
   Janeiro, março e dezembro não têm tane; agosto não tem fita; dezembro tem 3 kasu.

   API (window.Hanafuda):
     iniciar({borda, base})   define a versão ("preta" padrão) e a pasta dos SVG ("hanafuda/" padrão)
     criar(id, chave)         elemento .hcarta pronto (frente e verso). "chave" vai em data-c
     face(elemento, id)       troca a frente de uma carta já criada
     mini(id)                 span com a carta pequena (para textos de ajuda)
     nome(id)                 "Pinheiro com grou (松に鶴)"
     carta(id)                dados da carta (id, mes, tipo, sub, nome, jp, romaji, planta, plantaJp)
     arquivos()               lista dos 49 caminhos (para o service worker e pré-carga)
     precarregar()            promessa que resolve quando as 49 imagens estiverem prontas
     baralho(semente)         lista dos 48 ids embaralhada (com semente, a mesma ordem sempre)
     aleatorio(semente)       gerador (mulberry32) para sortear de forma repetível
     MESES, TIPOS, CARTAS, RAZAO (altura / largura = 1600 / 976)
   Estilo: hanafuda.css
   ========================================================================== */
(function (raiz) {
  'use strict';

  var RAZAO = 1600 / 976;
  var cfg = { borda: 'preta', base: 'hanafuda/' };

  /* ---------- dados ---------- */
  var MESES = [
    { n: 1,  kanji: '松',   kana: 'まつ',     romaji: 'matsu',   pt: 'Pinheiro',             mes: 'Janeiro',   mesJp: '一月',   mesKana: 'いちがつ' },
    { n: 2,  kanji: '梅',   kana: 'うめ',     romaji: 'ume',     pt: 'Ameixeira',            mes: 'Fevereiro', mesJp: '二月',   mesKana: 'にがつ' },
    { n: 3,  kanji: '桜',   kana: 'さくら',   romaji: 'sakura',  pt: 'Cerejeira',            mes: 'Março',     mesJp: '三月',   mesKana: 'さんがつ' },
    { n: 4,  kanji: '藤',   kana: 'ふじ',     romaji: 'fuji',    pt: 'Glicínia',             mes: 'Abril',     mesJp: '四月',   mesKana: 'しがつ' },
    { n: 5,  kanji: '菖蒲', kana: 'あやめ',   romaji: 'ayame',   pt: 'Íris',                 mes: 'Maio',      mesJp: '五月',   mesKana: 'ごがつ' },
    { n: 6,  kanji: '牡丹', kana: 'ぼたん',   romaji: 'botan',   pt: 'Peônia',               mes: 'Junho',     mesJp: '六月',   mesKana: 'ろくがつ' },
    { n: 7,  kanji: '萩',   kana: 'はぎ',     romaji: 'hagi',    pt: 'Hagi (trevo-japonês)', mes: 'Julho',     mesJp: '七月',   mesKana: 'しちがつ' },
    { n: 8,  kanji: '芒',   kana: 'すすき',   romaji: 'susuki',  pt: 'Capim-susuki',         mes: 'Agosto',    mesJp: '八月',   mesKana: 'はちがつ' },
    { n: 9,  kanji: '菊',   kana: 'きく',     romaji: 'kiku',    pt: 'Crisântemo',           mes: 'Setembro',  mesJp: '九月',   mesKana: 'くがつ' },
    { n: 10, kanji: '紅葉', kana: 'もみじ',   romaji: 'momiji',  pt: 'Bordo-japonês',        mes: 'Outubro',   mesJp: '十月',   mesKana: 'じゅうがつ' },
    { n: 11, kanji: '柳',   kana: 'やなぎ',   romaji: 'yanagi',  pt: 'Salgueiro',            mes: 'Novembro',  mesJp: '十一月', mesKana: 'じゅういちがつ' },
    { n: 12, kanji: '桐',   kana: 'きり',     romaji: 'kiri',    pt: 'Paulównia',            mes: 'Dezembro',  mesJp: '十二月', mesKana: 'じゅうにがつ' }
  ];

  var TIPOS = {
    hikari:  { kanji: '光',   kana: 'ひかり',   romaji: 'hikari',  pt: 'Luz',                      curto: '光',   qtd: 5 },
    tane:    { kanji: '種',   kana: 'たね',     romaji: 'tane',    pt: 'Tane (animal ou objeto)',  curto: '種',   qtd: 9 },
    tanzaku: { kanji: '短冊', kana: 'たんざく', romaji: 'tanzaku', pt: 'Fita',                     curto: '短',   qtd: 10 },
    kasu:    { kanji: 'カス', kana: 'かす',     romaji: 'kasu',    pt: 'Kasu (comum)',             curto: 'カス', qtd: 24 }
  };

  /* [tipo, sub, nome pt, japonês, romaji]
     sub das fitas: 'poema' (vermelha com poema), 'vermelha' (lisa), 'azul' */
  var DEF = [
    ['hikari', '', 'Pinheiro com grou', '松に鶴', 'Matsu ni tsuru'],
    ['tanzaku', 'poema', 'Pinheiro com fita de poema', '松に赤短', 'Matsu ni akatan'],
    ['kasu', '', 'Pinheiro (comum)', '松のカス', 'Matsu no kasu'],
    ['kasu', '', 'Pinheiro (comum)', '松のカス', 'Matsu no kasu'],

    ['tane', '', 'Ameixeira com uguisu', '梅に鶯', 'Ume ni uguisu'],
    ['tanzaku', 'poema', 'Ameixeira com fita de poema', '梅に赤短', 'Ume ni akatan'],
    ['kasu', '', 'Ameixeira (comum)', '梅のカス', 'Ume no kasu'],
    ['kasu', '', 'Ameixeira (comum)', '梅のカス', 'Ume no kasu'],

    ['hikari', '', 'Cerejeira com cortina', '桜に幕', 'Sakura ni maku'],
    ['tanzaku', 'poema', 'Cerejeira com fita de poema', '桜に赤短', 'Sakura ni akatan'],
    ['kasu', '', 'Cerejeira (comum)', '桜のカス', 'Sakura no kasu'],
    ['kasu', '', 'Cerejeira (comum)', '桜のカス', 'Sakura no kasu'],

    ['tane', '', 'Glicínia com cuco', '藤にホトトギス', 'Fuji ni hototogisu'],
    ['tanzaku', 'vermelha', 'Glicínia com fita vermelha', '藤に短冊', 'Fuji ni tanzaku'],
    ['kasu', '', 'Glicínia (comum)', '藤のカス', 'Fuji no kasu'],
    ['kasu', '', 'Glicínia (comum)', '藤のカス', 'Fuji no kasu'],

    ['tane', '', 'Íris com a ponte de oito tábuas', '菖蒲に八橋', 'Ayame ni yatsuhashi'],
    ['tanzaku', 'vermelha', 'Íris com fita vermelha', '菖蒲に短冊', 'Ayame ni tanzaku'],
    ['kasu', '', 'Íris (comum)', '菖蒲のカス', 'Ayame no kasu'],
    ['kasu', '', 'Íris (comum)', '菖蒲のカス', 'Ayame no kasu'],

    ['tane', '', 'Peônia com borboletas', '牡丹に蝶', 'Botan ni chō'],
    ['tanzaku', 'azul', 'Peônia com fita azul', '牡丹に青短', 'Botan ni aotan'],
    ['kasu', '', 'Peônia (comum)', '牡丹のカス', 'Botan no kasu'],
    ['kasu', '', 'Peônia (comum)', '牡丹のカス', 'Botan no kasu'],

    ['tane', '', 'Hagi com javali', '萩に猪', 'Hagi ni inoshishi'],
    ['tanzaku', 'vermelha', 'Hagi com fita vermelha', '萩に短冊', 'Hagi ni tanzaku'],
    ['kasu', '', 'Hagi (comum)', '萩のカス', 'Hagi no kasu'],
    ['kasu', '', 'Hagi (comum)', '萩のカス', 'Hagi no kasu'],

    ['hikari', '', 'Susuki com lua', '芒に月', 'Susuki ni tsuki'],
    ['tane', '', 'Susuki com gansos', '芒に雁', 'Susuki ni kari'],
    ['kasu', '', 'Susuki (comum)', '芒のカス', 'Susuki no kasu'],
    ['kasu', '', 'Susuki (comum)', '芒のカス', 'Susuki no kasu'],

    ['tane', '', 'Crisântemo com taça de saquê', '菊に盃', 'Kiku ni sakazuki'],
    ['tanzaku', 'azul', 'Crisântemo com fita azul', '菊に青短', 'Kiku ni aotan'],
    ['kasu', '', 'Crisântemo (comum)', '菊のカス', 'Kiku no kasu'],
    ['kasu', '', 'Crisântemo (comum)', '菊のカス', 'Kiku no kasu'],

    ['tane', '', 'Bordo com cervo', '紅葉に鹿', 'Momiji ni shika'],
    ['tanzaku', 'azul', 'Bordo com fita azul', '紅葉に青短', 'Momiji ni aotan'],
    ['kasu', '', 'Bordo (comum)', '紅葉のカス', 'Momiji no kasu'],
    ['kasu', '', 'Bordo (comum)', '紅葉のカス', 'Momiji no kasu'],

    ['hikari', '', 'Salgueiro com Ono no Michikaze', '柳に小野道風', 'Yanagi ni Ono no Tōfū'],
    ['tane', '', 'Salgueiro com andorinha', '柳に燕', 'Yanagi ni tsubame'],
    ['tanzaku', 'vermelha', 'Salgueiro com fita vermelha', '柳に短冊', 'Yanagi ni tanzaku'],
    ['kasu', '', 'Salgueiro com raio (comum)', '柳のカス', 'Yanagi no kasu'],

    ['hikari', '', 'Paulównia com fênix', '桐に鳳凰', 'Kiri ni hōō'],
    ['kasu', '', 'Paulównia (comum)', '桐のカス', 'Kiri no kasu'],
    ['kasu', '', 'Paulównia (comum)', '桐のカス', 'Kiri no kasu'],
    ['kasu', '', 'Paulównia (comum)', '桐のカス', 'Kiri no kasu']
  ];

  var CARTAS = DEF.map(function (d, i) {
    var mes = MESES[(i / 4) | 0];
    return { id: i, mes: mes.n, tipo: d[0], sub: d[1], nome: d[2], jp: d[3], romaji: d[4], planta: mes.pt, plantaJp: mes.kanji };
  });

  /* ---------- arquivos ---------- */
  function dois(n) { return (n < 10 ? '0' : '') + n; }
  function url(id) { return cfg.base + cfg.borda + '/' + (id === 'v' ? 'verso' : dois(id)) + '.svg'; }

  function arquivos() {
    var l = [], i;
    for (i = 0; i < 48; i++) l.push(url(i));
    l.push(url('v'));
    return l;
  }

  function iniciar(op) {
    op = op || {};
    if (op.borda === 'preta' || op.borda === 'vermelha') cfg.borda = op.borda;
    if (typeof op.base === 'string') cfg.base = op.base === '' ? '' : op.base.replace(/\/?$/, '/');
  }

  var pronto = null;
  function precarregar() {
    if (pronto) return pronto;
    pronto = Promise.all(arquivos().map(function (u) {
      return new Promise(function (ok) {
        var im = new Image();
        im.onload = im.onerror = function () { ok(); };
        im.src = u;
        if (im.decode) im.decode().then(ok, ok);
      });
    }));
    return pronto;
  }

  /* ---------- elementos ---------- */
  function nome(id) { var c = CARTAS[id]; return c.nome + ' (' + c.jp + ')'; }
  function carta(id) { return CARTAS[id]; }

  function img(src) {
    return '<img src="' + src + '" alt="" draggable="false" decoding="async">';
  }

  function indice(id) {
    var c = CARTAS[id], m = MESES[c.mes - 1], t = TIPOS[c.tipo];
    return '<span class="hindice ' + c.tipo + '" aria-hidden="true"><b>' + c.mes + '</b>' + m.kanji + '<i>' + t.curto + '</i></span>';
  }

  function face(el, id) {
    el.querySelector('.hfrente').innerHTML = img(url(id)) + indice(id);
    el.dataset.b = id;
    el.setAttribute('aria-label', nome(id));
  }

  function criar(id, chave) {
    var d = document.createElement('div');
    d.className = 'hcarta';
    d.dataset.c = chave == null ? id : chave;
    d.setAttribute('role', 'img');
    d.innerHTML = '<div class="hgiro"><div class="hfrente"></div><div class="hverso">' + img(url('v')) + '</div></div>';
    face(d, id);
    return d;
  }

  function mini(id) { return '<span class="hcarta-mini" title="' + nome(id).replace(/"/g, '&quot;') + '">' + img(url(id)) + '</span>'; }

  /* ---------- sorteio com semente (mulberry32) ---------- */
  function aleatorio(sem) {
    var a = (sem == null ? (Math.random() * 4294967296) : sem) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function baralho(sem) {
    var r = aleatorio(sem), l = [], i, j, t;
    for (i = 0; i < 48; i++) l.push(i);
    for (i = 47; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = l[i]; l[i] = l[j]; l[j] = t; }
    return l;
  }

  raiz.Hanafuda = {
    iniciar: iniciar, criar: criar, face: face, mini: mini, nome: nome, carta: carta,
    arquivos: arquivos, precarregar: precarregar, baralho: baralho, aleatorio: aleatorio,
    MESES: MESES, TIPOS: TIPOS, CARTAS: CARTAS, RAZAO: RAZAO
  };
})(window);
