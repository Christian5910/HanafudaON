# HanafudaON!

10 jogos de Hanafuda em um site só (HTML, CSS e JavaScript puros, sem build), no estilo ON!.
Koi-Koi, Hana-Awase, Hachi-Hachi, Bakappana, Mushi, Tensho, Roppyakken, Sudaoshi, Oicho-Kabu e Kingo.
Contra o robô (5 níveis) ou no mesmo aparelho (2 a 10 pessoas conforme o jogo). Funciona offline.

## Como publicar
1. Rode `sync.ps1` na pasta Base-Compartilhada: ele copia `on.css`, `on.js`, `hanafuda.js`, `hanafuda.css` e as pastas `hanafuda/preta` e `hanafuda/vermelha`.
2. Suba a pasta `HanafudaON` inteira no Netlify (site `hanafudaon`).
3. A cada mudança de arquivo, aumente `CACHE_NAME` em `service-worker.js` (hoje `hanafudaon-v1`).

## Arquivos
| Arquivo | Função |
|---|---|
| `nucleo.js` | Cartas, tipos, sorteio com semente e funções comuns |
| `captura.js` | Motor genérico dos jogos de pescar |
| `jogos-captura.js` | As regras dos 8 jogos de pescar (Koi-Koi, Hachi-Hachi etc.) |
| `kabu.js` | Oicho-Kabu e Kingo (apostas contra a banca) |
| `robo.js`, `robo-worker.js` | Robô de 5 níveis (nível 4 e 5 usam simulação, em um Worker) |
| `mesa.js` | Posição e deslize das 48 cartas, toque e arrasto |
| `javinhas.js` | Tela: escolher jogo, partida, decisões, resultados, estatísticas |
| `textos.js` | Como Jogar de cada jogo |
| `colorido.css` | Visual do jogo (o resto vem de `on.css` e `hanafuda.css`) |

Os motores não tocam no DOM e rodam no Node (testes em `testes-hanafudaon`).

## Créditos das cartas
Borda preta: Louie Mantia e すけじょ. Borda vermelha: Louie Mantia Jr. e すけじょ. CC BY-SA 4.0, via Wikimedia Commons.
Detalhes em `hanafuda/CREDITOS.txt`. As imagens modificadas (renomeadas e otimizadas com SVGO) continuam sob a mesma licença.

## O que é regra adotada
Hanafuda tem muitas variantes. Koi-Koi, Hana-Awase e Hachi-Hachi seguem as regras mais comuns (o Hachi-Hachi sem nuke, tobikomi, hatto e tate-sanbon). Bakappana, Mushi, Tensho, Roppyakken, Sudaoshi, Oicho-Kabu e Kingo são adaptações simples, avisadas no Como Jogar de cada um.
