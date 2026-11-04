/* ==========================================================================
   HanafudaON! - textos.js (Como Jogar: o baralho, cada jogo e os créditos)
   HON.textos[chave] = { titulo, curto, html }
   Marcadores: <span class="mc" data-c="N"> vira a miniatura da carta N (o javinhas.js troca pela imagem).
   Leitura dos kanji: <ruby>漢字<rt>furigana</rt></ruby> seguido do romaji entre parênteses.
   ========================================================================== */
(function (G) {
  'use strict';
  const HON = G.HON = G.HON || { jogos: {} };

  /* ---------- atalhos de escrita ---------- */
  const c = (n) => '<span class="mc" data-c="' + n + '"></span>';
  const cs = (...l) => '<span class="linha-cartas">' + l.map(c).join('') + '</span>';
  const k = (kanji, furi, romaji) => '<span class="jp" lang="ja"><ruby>' + kanji + '<rp>(</rp><rt>' + furi + '</rt><rp>)</rp></ruby></span>' + (romaji ? ' (' + romaji + ')' : '');
  const nota = (t) => '<p class="nota">' + t + '</p>';
  const tab = (cab, linhas) => '<div class="tab-rolagem"><table class="tab-yaku"><thead><tr>' + cab.map((x) => '<th scope="col">' + x + '</th>').join('') + '</tr></thead><tbody>' +
    linhas.map((l) => '<tr>' + l.map((x, i) => '<td data-l="' + cab[i] + '">' + x + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';

  const T = HON.textos = {};

  /* ==========================================================================
     Hanafuda em geral e como usar o site
     ========================================================================== */
  T.geral = {
    titulo: 'O baralho e o site',
    curto: '',
    html:
      '<p>' + k('花札', 'はなふだ', 'hanafuda') + ' quer dizer "cartas de flores". O baralho tem 48 cartas, quatro para cada um dos 12 meses do ano. Cada mês tem uma planta, e a planta aparece em todas as quatro cartas do mês.</p>' +
      '<h3>Os 12 meses</h3>' +
      tab(['Mês', 'Planta', 'Cartas'], [
        ['1 ' + k('松', 'まつ', 'matsu'), 'Pinheiro', cs(0, 1, 2, 3)],
        ['2 ' + k('梅', 'うめ', 'ume'), 'Ameixeira', cs(4, 5, 6, 7)],
        ['3 ' + k('桜', 'さくら', 'sakura'), 'Cerejeira', cs(8, 9, 10, 11)],
        ['4 ' + k('藤', 'ふじ', 'fuji'), 'Glicínia', cs(12, 13, 14, 15)],
        ['5 ' + k('菖蒲', 'あやめ', 'ayame'), 'Íris', cs(16, 17, 18, 19)],
        ['6 ' + k('牡丹', 'ぼたん', 'botan'), 'Peônia', cs(20, 21, 22, 23)],
        ['7 ' + k('萩', 'はぎ', 'hagi'), 'Trevo japonês', cs(24, 25, 26, 27)],
        ['8 ' + k('芒', 'すすき', 'susuki'), 'Capim pampa', cs(28, 29, 30, 31)],
        ['9 ' + k('菊', 'きく', 'kiku'), 'Crisântemo', cs(32, 33, 34, 35)],
        ['10 ' + k('紅葉', 'もみじ', 'momiji'), 'Bordo', cs(36, 37, 38, 39)],
        ['11 ' + k('柳', 'やなぎ', 'yanagi'), 'Salgueiro', cs(40, 41, 42, 43)],
        ['12 ' + k('桐', 'きり', 'kiri'), 'Paulównia', cs(44, 45, 46, 47)]
      ]) +
      '<h3>Os quatro tipos de carta</h3>' +
      '<ul>' +
      '<li>' + k('光', 'ひかり', 'hikari') + ': as 5 cartas de luz. Valem 20 pontos no valor padrão. ' + cs(0, 8, 28, 40, 44) + '</li>' +
      '<li>' + k('種', 'たね', 'tane') + ': 9 cartas de animal ou objeto. Valem 10. ' + cs(4, 12, 16, 20, 24, 29, 32, 36, 41) + '</li>' +
      '<li>' + k('短冊', 'たんざく', 'tanzaku') + ': 10 fitas. Valem 5. Três têm poema escrito (vermelhas, meses 1, 2 e 3), três são azuis (meses 6, 9 e 10) e quatro são vermelhas lisas. ' + cs(1, 5, 9, 21, 33, 37, 13, 17, 25, 42) + '</li>' +
      '<li>' + k('カス', 'かす', 'kasu') + ': 24 cartas comuns, sem figura especial. Valem 1 ponto. A carta ' + c(46) + ' (paulównia com moldura amarela) é kasu em quase todos os jogos.</li>' +
      '</ul>' +
      '<p>Esses valores (20, 10, 5, 1) somam 264 pontos e são o padrão de Koi-Koi, Hana-Awase, Hachi-Hachi e Bakappana. Alguns jogos mudam os valores, e isso está dito em cada um.</p>' +
      '<h3>Como o jogo funciona, em geral</h3>' +
      '<p>A maioria dos jogos aqui é de pescar. Cada jogador recebe uma mão e algumas cartas ficam viradas no campo. Na sua vez:</p>' +
      '<ol>' +
      '<li>Jogue uma carta da mão. Se existir no campo uma carta do mesmo mês, você leva as duas. Se não existir, a carta fica no campo.</li>' +
      '<li>Vire a carta de cima do monte. Se combinar com alguma do campo, leva as duas. Se não, ela fica no campo.</li>' +
      '</ol>' +
      '<p>Se o campo tiver duas cartas do mesmo mês e você jogar a terceira, leva só uma das duas (você escolhe). Se o campo tiver três cartas do mês, quem joga a quarta leva as quatro.</p>' +
      '<h3>Usando o site</h3>' +
      '<ul>' +
      '<li><b>Jogar uma carta:</b> toque na carta da mão. As cartas do campo que combinam ficam com brilho amarelo. Toque em uma delas para pegar. Também dá para arrastar a carta da mão até a do campo.</li>' +
      '<li><b>Sem par:</b> se a carta não combina com nada, toque nela de novo (ou toque na área do campo) para deixá-la na mesa.</li>' +
      '<li><b>Escolha do campo:</b> quando a carta virada combina com duas do campo, o jogo pede para você tocar na que quer levar.</li>' +
      '<li><b>Dica:</b> o botão mostra a jogada que o robô de nível 4 faria no seu lugar.</li>' +
      '<li><b>Capturas:</b> lista as cartas que cada jogador já pegou e as combinações que já existem.</li>' +
      '<li><b>No mesmo aparelho:</b> cada jogador toca em "Estou pronto" na sua vez. As cartas dos outros ficam viradas.</li>' +
      '<li><b>Robô:</b> são cinco níveis. Os níveis 1 a 3 jogam por regras simples. Os níveis 4 e 5 simulam partidas antes de escolher (no 5, por mais tempo). Nos jogos de três ou mais pessoas, o nível 4 e o 3 têm força parecida.</li>' +
      '<li><b>Borda das cartas:</b> em "Cartas", troque entre borda preta e vermelha. É só o visual. O índice mostra mês, planta e tipo no canto de cada carta, bom para quem está aprendendo.</li>' +
      '<li>A partida fica salva no aparelho. Se você fechar a página, ela continua de onde parou.</li>' +
      '</ul>' +
      nota('<b>Sobre as regras:</b> o Hanafuda tem muitas variações regionais e de família. Cada jogo aqui segue as regras mais comuns que encontramos e, onde as fontes divergem ou não existem, o HanafudaON! adotou uma regra simples e diz isso no texto do jogo. Quando um jogo diz "regra adotada no ON!", não espere que ela coincida com o que sua família joga.')
  };

  /* ==========================================================================
     Koi-Koi
     ========================================================================== */
  T.koikoi = {
    titulo: 'Koi-Koi',
    curto: 'Forme combinações e decida: fechar ou arriscar com Koi-Koi.',
    html:
      '<p>' + k('こいこい', 'こいこい', 'koi-koi') + ' é o jogo de Hanafuda mais famoso. É para dois jogadores. Quem forma uma combinação (' + k('役', 'やく', 'yaku') + ') escolhe entre fechar a rodada e levar os pontos ou continuar jogando, dizendo "koi-koi", para tentar mais.</p>' +
      '<h3>Preparação</h3>' +
      '<ul><li>Cada jogador recebe 8 cartas e 8 ficam abertas no campo. O restante forma o monte.</li>' +
      '<li>A partida tem 1, 3, 6 ou 12 rodadas (você escolhe). Quem vence a rodada abre a próxima.</li>' +
      '<li>Se uma mão já começa com quatro cartas do mesmo mês (' + k('手四', 'てし', 'teshi') + ') ou com quatro pares (' + k('喰付', 'くっつき', 'kuttsuki') + '), o dono ganha 6 pontos na hora e a rodada acaba. Se os dois tiverem, empata.</li></ul>' +
      '<h3>A sua vez</h3>' +
      '<p>Jogue uma carta da mão e depois vire uma do monte, como descrito em "O baralho e o site". Depois de cada vez, o jogo confere suas cartas capturadas. Se você formou uma combinação nova ou melhorou a que já tinha, precisa decidir:</p>' +
      '<ul><li><b>Fechar</b> (' + k('勝負', 'しょうぶ', 'shōbu') + '): a rodada termina e você ganha os pontos das combinações.</li>' +
      '<li><b>Koi-Koi:</b> a rodada continua. Você pode ganhar mais, mas se o adversário fechar primeiro ele leva os pontos dele, e você nada.</li></ul>' +
      '<p>Se as cartas da mão acabarem e ninguém tiver fechado, a rodada empata e ninguém pontua.</p>' +
      '<h3>Combinações</h3>' +
      tab(['Combinação', 'Cartas', 'Pontos'], [
        [k('五光', 'ごこう', 'gokō'), 'As 5 luzes ' + cs(0, 8, 28, 40, 44), '10'],
        [k('四光', 'しこう', 'shikō'), '4 luzes, sem a do salgueiro ' + cs(0, 8, 28, 44), '8'],
        [k('雨四光', 'あめしこう', 'ame-shikō'), '4 luzes, com a do salgueiro ' + cs(40), '7'],
        [k('三光', 'さんこう', 'sankō'), '3 luzes, sem a do salgueiro', '5'],
        [k('花見酒', 'はなみざけ', 'hanami-zake'), 'Cortina de cerejeira + cálice ' + cs(8, 32), '5'],
        [k('月見酒', 'つきみざけ', 'tsukimi-zake'), 'Lua + cálice ' + cs(28, 32), '5'],
        [k('猪鹿蝶', 'いのしかちょう', 'ino-shika-chō'), 'Javali, cervo e borboleta ' + cs(24, 36, 20) + ' (+1 por animal extra)', '5'],
        [k('種', 'たね', 'tane'), '5 ou mais cartas de animal (+1 por carta extra)', '1'],
        [k('赤短', 'あかたん', 'akatan'), 'As 3 fitas com poema ' + cs(1, 5, 9), '5'],
        [k('青短', 'あおたん', 'aotan'), 'As 3 fitas azuis ' + cs(21, 33, 37), '5'],
        [k('短冊', 'たんざく', 'tanzaku'), '5 ou mais fitas (+1 por fita extra)', '1'],
        [k('カス', 'かす', 'kasu'), '10 ou mais kasu (+1 por carta extra)', '1']
      ]) +
      '<h3>Dobrando os pontos</h3>' +
      '<ul><li>Se o total das combinações for 7 ou mais, o valor dobra.</li>' +
      '<li>Se alguém tiver dito koi-koi nessa rodada (você ou o adversário), o valor dobra de novo.</li></ul>' +
      nota('<b>Regra adotada no ON!:</b> o jogador 1 abre a primeira rodada, sem sorteio de cartas, e o placar não usa o sistema de meses do calendário que algumas casas adotam. Tane e Ino-shika-chō somam quando você tem as duas combinações.')
  };

  /* ==========================================================================
     Hachi-Hachi
     ========================================================================== */
  T.hachihachi = {
    titulo: 'Hachi-Hachi',
    curto: 'O mais técnico: mãos iniciais, taxas, sage e meta de 88.',
    html:
      '<p>' + k('八八', 'はちはち', 'hachi-hachi') + ' quer dizer "oito oito". É o jogo mais complexo da lista, para três jogadores ou mais. A meta de cada rodada é passar de 88 pontos em cartas. O baralho todo vale 264, e 88 é um terço disso, a parte de cada um dos três jogadores. Quem pontua mais recebe dos outros.</p>' +
      '<h3>Preparação</h3>' +
      '<ul><li>Joga-se em três por rodada. Com 4 a 6 pessoas na mesa, os outros descansam em rodízio e quem dá as cartas muda a cada rodada.</li>' +
      '<li>Cada jogador recebe 7 cartas e 6 ficam no campo.</li>' +
      '<li>O jogo tem 3, 6 ou 12 rodadas.</li></ul>' +
      '<h3>Taxa do campo</h3>' +
      '<p>Se o campo já começa com muitas cartas valiosas ou só com cartas de pouco valor, a rodada vale mais:</p>' +
      '<ul><li>Campo "grande" (totais 0, 8 ou 28): x2.</li><li>Campo "absoluto" (totais 40 ou 44): x4.</li><li>Quando a taxa é forçada, ela passa para a próxima rodada.</li></ul>' +
      '<h3>Mãos iniciais (' + k('手役', 'てやく', 'teyaku') + ')</h3>' +
      '<p>Quem recebe certas mãos ganha antes de jogar. Os valores são em kan (cada kan vale 12 pontos, multiplicado pela taxa do campo):</p>' +
      tab(['Mão', 'Descrição', 'Kan'], [
        [k('シシ', 'しし', 'shishi'), 'Quatro de um mês e três de outro', '20'],
        [k('一二四', 'いちにし', 'ichi-ni-shi'), 'Quatro de um mês e dois de outro', '8'],
        [k('手四', 'てし', 'teshi'), 'Quatro do mesmo mês', '6'],
        [k('羽拳', 'はねけん', 'hanekken'), 'Três de um mês e dois de outro', '7'],
        [k('二三本', 'ふたさんぼん', 'futa-sanbon'), 'Dois grupos de três', '6'],
        [k('三本', 'さんぼん', 'sanbon'), 'Três do mesmo mês', '2'],
        [k('くっつき', 'くっつき', 'kuttsuki'), 'Três pares', '4'],
        [k('烏', 'からす', 'karasu'), 'Nenhuma carta de luz, fita ou animal', '4'],
        [k('光一', 'ひかりいち', 'hikari-ichi'), 'Uma luz e o resto kasu', '4'],
        [k('十一', 'といち', 'tōichi'), 'Um animal e o resto kasu', '3'],
        [k('短一', 'たんいち', 'tan-ichi'), 'Uma fita e o resto kasu', '3'],
        [k('赤', 'あか', 'aka'), 'Só fitas e kasu', '2']
      ]) +
      '<h3>Combinações durante o jogo</h3>' +
      tab(['Combinação', 'Cartas', 'Kan'], [
        [k('五光', 'ごこう', 'gokō'), 'As 5 luzes', '12'],
        [k('四光', 'しこう', 'shikō'), '4 luzes', '10'],
        [k('七短', 'ななたん', 'nanatan'), '7 fitas', '10'],
        [k('赤短', 'あかたん', 'akatan'), 'As 3 fitas com poema', '7'],
        [k('青短', 'あおたん', 'aotan'), 'As 3 fitas azuis', '7']
      ]) +
      '<p>Ao formar uma dessas, você escolhe entre <b>parar</b> (a rodada acaba e você recebe o valor) e <b>sage</b> (' + k('下げ', 'さげ', 'sage') + '), que é seguir jogando. Se depois do sage você melhorar o yaku, recebe o valor novo. Se não, recebe só metade do que receberia ao parar.</p>' +
      '<h3>Fim da rodada</h3>' +
      '<p>Se ninguém formar nada, a rodada termina quando as mãos acabam. Cada jogador conta os pontos das cartas capturadas e recebe ou paga a diferença para 88, vezes a taxa do campo. Existem dois pagamentos especiais de fim de rodada:</p>' +
      '<ul><li>' + k('二八', 'にはち', 'ni-hachi') + ': 168 pontos ou mais em cartas.</li><li>' + k('素十六', 'すじゅうろく', 'suji-roku') + ': 16 ou mais kasu.</li></ul>' +
      nota('<b>Regra adotada no ON!:</b> o Hachi-Hachi tradicional tem ainda o "nuke", o "tobikomi", o "hatto" e o "tate-sanbon". Eles não estão no HanafudaON!. O pagamento do sage também foi simplificado como descrito acima. Se você joga com essas regras, o resultado das contas vai diferir.')
  };

  /* ==========================================================================
     Hana-Awase
     ========================================================================== */
  T.hanaawase = {
    titulo: 'Hana-Awase',
    curto: 'O clássico: todas as cartas são jogadas e as combinações contam no fim.',
    html:
      '<p>' + k('花合せ', 'はなあわせ', 'hana-awase') + ' é uma forma antiga do jogo, de três ou quatro jogadores. Ninguém pára no meio: todas as cartas são jogadas e só no fim se contam pontos e combinações.</p>' +
      '<h3>Preparação</h3>' +
      '<ul><li>Com 3 jogadores: 7 cartas para cada um e 6 no campo.</li>' +
      '<li>Com 4 jogadores: 5 cartas para cada um e 8 no campo.</li>' +
      '<li>A partida tem 3, 6 ou 12 rodadas.</li></ul>' +
      '<h3>Contagem</h3>' +
      '<p>Cada jogador soma o valor das suas cartas (luz 20, animal 10, fita 5, kasu 1). A média é 264 dividido pelos jogadores. Quem fica acima da média recebe, quem fica abaixo paga. Depois entram as combinações: cada uma vale pontos que os outros jogadores pagam a quem a fez.</p>' +
      tab(['Combinação', 'Cartas', 'Pontos'], [
        [k('五光', 'ごこう', 'gokō'), 'As 5 luzes', '200'],
        [k('四光', 'しこう', 'shikō'), 'Grou, cortina, lua e fênix ' + cs(0, 8, 28, 44), '60'],
        [k('七短', 'ななたん', 'nanatan'), '7 fitas', '40'],
        [k('六短', 'ろくたん', 'rokutan'), '6 fitas', '30'],
        [k('赤短', 'あかたん', 'akatan'), 'As 3 fitas com poema', '40'],
        [k('青短', 'あおたん', 'aotan'), 'As 3 fitas azuis', '40'],
        [k('呑み', 'のみ', 'nomi'), 'Cortina, lua e cálice ' + cs(8, 28, 32), '30'],
        [k('花見酒', 'はなみざけ', 'hanami-zake'), 'Cortina + cálice ' + cs(8, 32), '20'],
        [k('月見酒', 'つきみざけ', 'tsukimi-zake'), 'Lua + cálice ' + cs(28, 32), '20'],
        [k('表菅原', 'おもてすがわら', 'omote-sugawara'), 'Grou, uguisu e cortina ' + cs(0, 4, 8), '30'],
        [k('松桐坊主', 'まつきりぼうず', 'matsu-kiri-bōzu'), 'Grou, lua e fênix ' + cs(0, 28, 44), '20'],
        [k('猪鹿蝶', 'いのしかちょう', 'ino-shika-chō'), 'Javali, cervo e borboleta ' + cs(24, 36, 20), '20'],
        [k('草短', 'くさたん', 'kusa-tan'), 'As 3 fitas lisas ' + cs(13, 17, 25), '20'],
        [k('藤シマ', 'ふじしま', 'fuji-shima'), 'As 4 cartas da glicínia', '20'],
        [k('桐シマ', 'きりしま', 'kiri-shima'), 'As 4 cartas da paulównia', '20'],
        [k('雨シマ', 'あめしま', 'ame-shima'), 'As 4 cartas do salgueiro', '20']
      ]) +
      nota('<b>Regra adotada no ON!:</b> a lista de combinações e os valores foram montados a partir de fontes que divergem entre si. Cada combinação paga aos outros jogadores o valor da tabela, uma vez por oponente. Gokō e shikō não somam entre si.')
  };

  /* ==========================================================================
     Bakappana
     ========================================================================== */
  T.bakappana = {
    titulo: 'Bakappana',
    curto: 'Pescar por mês e somar valores. Sem combinações: o melhor para aprender.',
    html:
      '<p>' + k('バカ花', 'ばかはな', 'bakappana') + ' quer dizer "flor boba". É o jogo mais simples: sem combinações e sem decisões extras. Só pescar cartas do mesmo mês e somar o valor no fim. Serve para treinar a leitura das cartas.</p>' +
      '<h3>Preparação</h3>' +
      '<ul><li>2 jogadores: 10 cartas para cada um e 8 no campo.</li>' +
      '<li>3 jogadores: 7 para cada e 6 no campo.</li>' +
      '<li>4 jogadores: 5 para cada e 8 no campo.</li>' +
      '<li>A partida tem 3, 6 ou 12 rodadas.</li></ul>' +
      '<h3>Como se ganha</h3>' +
      '<p>A rodada acaba quando as mãos acabam. Cada jogador soma o valor padrão das cartas que pegou (luz 20, animal 10, fita 5, kasu 1). A média é 264 dividido pelos jogadores. Quem passa da média recebe a diferença, quem fica abaixo paga a diferença.</p>' +
      nota('<b>Regra adotada no ON!:</b> não encontramos uma regra única e fechada de Bakappana. A versão do ON! usa o jogo de pescar acima, com a contagem pela média. Os nomes de jogo variam muito por região.')
  };

  /* ==========================================================================
     Mushi
     ========================================================================== */
  T.mushi = {
    titulo: 'Mushi',
    curto: 'Duelo rápido sem peônia nem hagi. A carta de raio é coringa.',
    html:
      '<p>' + k('虫', 'むし', 'mushi') + ' quer dizer "inseto". É um duelo de pescar com um baralho menor: tiram-se os meses 6 e 7 (peônia e hagi), ficando 40 cartas.</p>' +
      '<h3>Preparação</h3>' +
      '<ul><li>Cada jogador recebe 8 cartas e 8 ficam no campo.</li>' +
      '<li>A carta do raio ' + c(43) + ' é <b>coringa</b>: pode levar qualquer carta do campo, e qualquer carta pode levá-la.</li>' +
      '<li>A partida tem 3, 6 ou 12 rodadas.</li></ul>' +
      '<h3>Combinações</h3>' +
      tab(['Combinação', 'Cartas', 'Pontos'], [
        [k('五光', 'ごこう', 'gokō'), 'As 5 luzes', '30'],
        [k('表菅原', 'おもてすがわら', 'omote-sugawara'), 'Grou, uguisu e cortina ' + cs(0, 4, 8), '25'],
        [k('藤シマ', 'ふじしま', 'fuji-shima'), 'As 4 cartas da glicínia', '10'],
        [k('桐シマ', 'きりしま', 'kiri-shima'), 'As 4 cartas da paulównia', '10']
      ]) +
      '<h3>Contagem</h3>' +
      '<p>No fim, cada um soma o valor das cartas capturadas. A diferença para 115 (a metade do baralho de 40 cartas) mais a diferença de combinações é quanto um paga ao outro.</p>' +
      nota('<b>Regra adotada no ON!:</b> a regra tradicional tem um ajuste para a carta do raio ficar no campo no final, o que não foi incluído. A tabela de combinações é adaptada.')
  };

  /* ==========================================================================
     Tensho
     ========================================================================== */
  T.tensho = {
    titulo: 'Tensho',
    curto: 'Duelo de pescar com baralho reduzido e bônus por mês completo.',
    html:
      '<p>' + k('天正', 'てんしょう', 'tenshō') + ' é o nome da era em que o Hanafuda ficou popular em Nagoya. Este é um duelo de pescar de dois jogadores com 40 cartas: sem os meses 11 e 12 (salgueiro e paulównia).</p>' +
      '<h3>Preparação</h3>' +
      '<ul><li>Cada jogador recebe 8 cartas e 8 ficam no campo.</li>' +
      '<li>A partida tem 3, 6 ou 12 rodadas.</li></ul>' +
      '<h3>Contagem</h3>' +
      '<p>Cada jogador soma o valor das cartas capturadas. Quem pega as quatro cartas de um mês inteiro (' + k('天', 'てん', 'ten') + ') ganha 10 pontos de bônus por mês. A diferença entre os totais é quanto o perdedor paga.</p>' +
      nota('<b>Regra adotada no ON!:</b> as fontes sobre o Tensho são escassas e discordam. O ON! usa o jogo de pescar acima, com bônus de 10 pontos por mês completo e pagamento pela diferença.')
  };

  /* ==========================================================================
     Roppyakken
     ========================================================================== */
  T.roppyakken = {
    titulo: 'Roppyakken',
    curto: 'Corrida até 600 pontos, com combinações de valor alto.',
    html:
      '<p>' + k('六百間', 'ろっぴゃっけん', 'roppyakken') + ' quer dizer "seiscentos ken". Joga-se em 2 ou 3 pessoas e a meta é chegar a 600 pontos acumulados. As combinações valem muito, e duas delas (shikō e shichitan) terminam a partida de uma vez.</p>' +
      '<h3>Valor das cartas</h3>' +
      '<ul><li><b>50 pontos:</b> grou, cortina, lua, o velho do salgueiro (o "oni"), fênix e uguisu. ' + cs(0, 8, 28, 40, 44, 4) + '</li>' +
      '<li><b>10 pontos:</b> os outros animais, todas as fitas e a carta ' + c(46) + '.</li>' +
      '<li><b>0:</b> o resto (kasu).</li></ul>' +
      '<h3>Preparação</h3>' +
      '<ul><li>2 jogadores: 8 cartas para cada um e 8 no campo. 3 jogadores: 7 para cada e 6 no campo.</li>' +
      '<li>A partida termina quando alguém chega a 600 pontos, ou depois de 12 rodadas.</li></ul>' +
      '<h3>Combinações</h3>' +
      tab(['Combinação', 'Cartas', 'Pontos'], [
        [k('四光', 'しこう', 'shikō'), '4 luzes (fim imediato)', '600'],
        [k('七短', 'ななたん', 'shichitan'), '7 fitas (fim imediato)', '600'],
        [k('猪鹿蝶', 'いのしかちょう', 'ino-shika-chō'), 'Javali, cervo, borboleta', '300'],
        [k('鉄砲', 'てっぽう', 'teppō'), 'Cortina, lua e cálice', '300'],
        [k('青短', 'あおたん', 'aotan'), 'As 3 fitas azuis', '200'],
        [k('二ゾロ', 'にぞろ', 'ni-zoro'), 'As 4 cartas do salgueiro', '200'],
        [k('松桐坊主', 'まつきりぼうず', 'matsu-kiri-bōzu'), 'Grou, lua e fênix', '150'],
        [k('赤短', 'あかたん', 'kōzan'), 'As 3 fitas com poema', '150'],
        [k('表菅原', 'おもてすがわら', 'ōzan'), 'Grou, uguisu e cortina', '100'],
        [k('草短', 'くさたん', 'kusa-tan'), 'As 3 fitas lisas', '100'],
        [k('花見酒', 'はなみざけ', 'hanami-zake'), 'Cortina + cálice (ou lua + cálice, tsukimi-zake)', '100'],
        [k('シマ', 'しま', 'shima'), 'Os 4 de um mês: 1, 2, 3, 8, 10 ou 12', '50']
      ]) +
      '<p>O salgueiro "cancela" o hanami-zake e o tsukimi-zake, a menos que a carta de luz do grou esteja junto.</p>' +
      '<h3>Mãos especiais</h3>' +
      '<ul><li>' + k('手三', 'てさん', 'te-san') + ': três cartas do mesmo mês na mão inicial valem 200.</li>' +
      '<li>' + k('総カス', 'そうがす', 'sō-gasu') + ': mão só de cartas sem valor vale 400.</li>' +
      '<li>' + k('ふけ', 'ふけ', 'fuke') + ': mão inicial fraca (30 pontos ou menos, sem contar os meses 11 e 12) anula a rodada e se dá de novo.</li></ul>' +
      nota('<b>Regra adotada no ON!:</b> o Roppyakken tradicional tem pontuação por rodada e ajustes de carta de oni que não foram copiados. Aqui ele foi simplificado: os pontos se acumulam até 600 e a mão fraca (fuke) só anula a rodada.')
  };

  /* ==========================================================================
     Sudaoshi
     ========================================================================== */
  T.sudaoshi = {
    titulo: 'Sudaoshi',
    curto: 'Os valores são invertidos: o kasu vale mais e a luz vale menos.',
    html:
      '<p>' + k('素倒し', 'すだおし', 'sudaoshi') + ' é um jogo de três ou mais pessoas em que o valor das cartas é virado do avesso: o kasu é a carta que mais vale e as luzes valem pouco.</p>' +
      '<h3>Valor das cartas</h3>' +
      '<ul><li>Kasu: 10 pontos cada.</li><li>Animal: 5. Fita: 1.</li><li>Luz: 5, exceto a cortina ' + c(8) + ' e a fênix ' + c(44) + ', que valem 10.</li></ul>' +
      '<h3>Preparação</h3>' +
      '<ul><li>Joga-se em três por rodada, como no Hachi-Hachi (com 4 a 6 pessoas, os outros descansam em rodízio).</li>' +
      '<li>Cada jogador começa com uma pontuação de partida (100, 110 e 120 conforme a ordem).</li>' +
      '<li>As mãos iniciais seguem a mesma tabela do Hachi-Hachi.</li></ul>' +
      '<h3>Combinações</h3>' +
      tab(['Combinação', 'Cartas', 'Kan'], [
        [k('坊主ゾロ', 'ぼうずぞろ', 'bōzu-zoro'), 'As 4 cartas do mês 8 ' + cs(28, 29, 30, 31), '2'],
        [k('坊主被り', 'ぼうずかぶり', 'bōzu-kaburi'), 'Lua e gansos ' + cs(28, 29), '1'],
        [k('雨ゾロ', 'あめぞろ', 'ame-zoro'), 'As 4 cartas do mês 11 (só vale para o terceiro jogador da mesa) ' + cs(40, 41, 42, 43), '2'],
        [k('雨被り', 'あめかぶり', 'ame-kaburi'), 'Duas cartas do mês 11 (só para o terceiro jogador)', '1']
      ]) +
      nota('<b>Regra adotada no ON!:</b> não foi possível confirmar as regras do Sudaoshi em fontes confiáveis. A versão do ON! é uma adaptação: os valores e as combinações acima foram escolhidos para manter a ideia de "kasu valioso". Trate como jogo experimental.')
  };

  /* ==========================================================================
     Oicho-Kabu
     ========================================================================== */
  T.oichokabu = {
    titulo: 'Oicho-Kabu',
    curto: 'Aposte contra a banca e chegue o mais perto possível do 9, o Kabu.',
    html:
      '<p>' + k('おいちょかぶ', 'おいちょかぶ', 'oicho-kabu') + ' é um jogo de apostas parecido com o bacará. Usa 40 cartas (meses 1 a 10), e cada carta vale o número do mês. Não se pesca no campo: só se soma o valor da mão.</p>' +
      '<h3>Como se conta</h3>' +
      '<p>Some as cartas e fique só com o último dígito. A melhor mão é 9, o ' + k('カブ', 'かぶ', 'kabu') + '. Uma mão que soma 10 vale zero, o ' + k('ブタ', 'ぶた', 'buta') + ' (porco). Outros nomes: 1 ' + k('ピン', 'ぴん', 'pin') + ', 8 ' + k('オイチョ', 'おいちょ', 'oicho') + '.</p>' +
      '<h3>A rodada</h3>' +
      '<ol><li>Uma pessoa é a banca (' + k('親', 'おや', 'oya') + '). As outras (' + k('子', 'こ', 'ko') + ') apostam fichas. A aposta máxima é 20% das fichas iniciais, e nunca mais do que a banca consegue pagar.</li>' +
      '<li>Cada um recebe duas cartas.</li>' +
      '<li>Cada jogador pode pedir uma terceira carta. Com 3 ou menos de total, é obrigatório pedir. Com 7 ou mais, não pode.</li>' +
      '<li>Os filhos comparam com a banca. Quem tem o dígito maior ganha. Em caso de empate, a banca vence.</li>' +
      '<li>A banca passa para o jogador seguinte a cada rodada.</li></ol>' +
      '<h3>Mãos especiais</h3>' +
      tab(['Mão', 'Descrição', 'Paga'], [
        [k('九ピン', 'くぴん', 'kuppin'), 'Banca com 1 e 9 (imediato)', 'x2'],
        [k('四ピン', 'しぴん', 'shippin'), 'Banca com 1 e 4 (imediato)', 'x2'],
        [k('鶴', 'つる', 'tsuru'), 'Duas cartas do mês 2', 'x2'],
        [k('五五', 'ごご', 'gogo'), 'Duas cartas do mês 5', 'x2'],
        [k('嵐', 'あらし', 'arashi'), 'Três cartas do mesmo mês', 'x3'],
        [k('ピンゾロ', 'ぴんぞろ', 'pin-zoro'), '1, 10 e 10', 'x5'],
        [k('雷神', 'らいじん', 'raijin'), '4, 7 e 9', 'x2'],
        [k('風神', 'ふうじん', 'fūjin'), '3, 7 e 10', 'x2'],
        [k('上り', 'のぼり', 'nobori'), 'Sequência 1, 2, 3', 'x2'],
        [k('下り', 'くだり', 'kudari'), 'Sequência 3, 2, 1', 'x2']
      ]) +
      '<p>Quando a banca tem Kuppin ou Shippin, todos os filhos pagam em dobro sem comparar as mãos.</p>' +
      nota('<b>Regra adotada no ON!:</b> as mãos especiais e os multiplicadores variam de casa para casa. A tabela acima é a que o ON! usa. Todas as fichas ficam em circulação: ninguém ganha o que o outro não tem.')
  };

  /* ==========================================================================
     Kingo
     ========================================================================== */
  T.kingo = {
    titulo: 'Kingo',
    curto: 'Chegue a 15 sem passar, como no blackjack, contra a banca.',
    html:
      '<p>' + k('金吾', 'きんご', 'kingo') + ' é um jogo de apostas de 2 a 10 pessoas, parecido com o blackjack. A meta é chegar o mais perto possível de 15 sem passar. Usa 40 cartas (meses 1 a 10), e cada carta vale o número do mês.</p>' +
      '<h3>A rodada</h3>' +
      '<ol><li>Uma pessoa é a banca. As outras apostam fichas e recebem uma carta cada.</li>' +
      '<li>Na sua vez, você pode pedir mais cartas ou parar. Quem tem menos de 11 (filho) ou menos de 12 (banca) precisa pedir. Com 15 ou mais, ou com 5 cartas na mão, não se pede mais.</li>' +
      '<li>Passou de 15, estourou e perde.</li>' +
      '<li>Os filhos comparam com a banca: o total maior ganha. Empate: a banca vence.</li>' +
      '<li>Chegar a 15 exatamente (' + k('金吾', 'きんご', 'kingo') + ') faz a aposta valer em dobro.</li></ol>' +
      '<h3>Mãos especiais dos filhos</h3>' +
      tab(['Mão', 'Descrição', 'Paga'], [
        [k('四五六', 'しごろ', 'shigoro'), '4, 5 e 6 em três cartas', 'x2'],
        [k('嵐', 'あらし', 'arashi'), 'Três cartas do mesmo mês', 'x2'],
        [k('五枚', 'ごまい', 'gomai'), 'Cinco cartas somando 15 ou menos', 'x2']
      ]) +
      nota('<b>Regra adotada no ON!:</b> o Kingo tem muitas variantes locais. Esta é uma adaptação simples. Se você joga com outras mãos especiais, o ON! não as reconhece.')
  };
})(typeof window !== 'undefined' ? window : globalThis);
