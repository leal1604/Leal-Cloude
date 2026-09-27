# O Pipeline de Scrub e o Padrão de Engenharia

Este é o padrão comprovado para o hero controlado por scroll e o piso de qualidade ao redor dele. Use tudo, sempre. Cada regra ou criou o polimento ou preveniu um bug que realmente embarcou e foi pego.

## A estrutura do hero

Um hero alto e fixado contendo um palco sticky de viewport inteira. O progresso de scroll pela região fixada mapeia de 0 a 1, e esse progresso comanda o tempo do vídeo. A página assenta exatamente quando o vídeo chega ao final composto de repouso, e o site de verdade começa ali.

**Dimensione o hero em distância de scroll (vh), não em segundos.** Uma tomada única de 6 segundos do Nível 1 quer uns 400vh de hero. Uma jornada encadeada de 18 segundos precisa de uns 1000vh, para cada batida ter espaço. Subdimensionar uma jornada longa faz cada legenda passar voando por mais bem calibradas que as faixas estejam; os números de ritmo vivem na seção de faixas de legenda abaixo.

## Busque o vídeo como Blob (a regra do Range)

Muitas hospedagens silenciosamente não suportam download parcial (HTTP Range). Sem ele, todo seek trava em zero e o scrub não faz nada no site no ar enquanto funciona perfeitamente no local. Busque o arquivo inteiro como Blob (o vídeo completo em memória) e reproduza a object URL; funciona em qualquer lugar.

Para um clipe pequeno (abaixo de uns 8 MB) a forma simples basta:

```js
const res = await fetch('assets/hero-scrub.mp4');
const blob = await res.blob();
video.src = URL.createObjectURL(blob);
```

Defina o pôster por JavaScript ao mesmo tempo, dentro do mesmo caminho de código que decide carregar o vídeo. Assim celulares e visitantes com movimento reduzido, que recebem o hero estático, nunca baixam nenhum dos dois arquivos.

### O Blob transmitido com anel de carregamento (qualquer vídeo acima de uns 8 MB)

Um `await fetch().blob()` puro num vídeo encadeado grande congela silenciosamente a primeira impressão da página: nada visível acontece até o arquivo inteiro chegar. Acima de uns 8 MB, transmita. A página fica usável na hora, o pôster aparece primeiro, um anel de progresso honesto enche enquanto o Blob chega, e a página está completa se o vídeo nunca chegar.

O elemento de vídeo embarca com `preload="none"` e sem `src`. O anel é um círculo SVG de raio 20 (circunferência de uns 126), comandado por uma variável CSS:

```html
<video id="hero" preload="none" muted playsinline aria-hidden="true" tabindex="-1"></video>
<svg class="ring" viewBox="0 0 48 48" aria-hidden="true">
  <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="3"
          stroke-dasharray="126" style="stroke-dashoffset:var(--ld,126)"/>
</svg>
```

```js
const VIDEO_URL = 'assets/hero-scrub.mp4';
const VIDEO_BYTES = 14476000;   // fixe o tamanho real em bytes: o recuo quando Content-Length falta
const ring = document.querySelector('.ring');
const posterLayer = document.querySelector('.poster');

// 1. O pôster vence a corrida de banda por design: pinte ele primeiro,
//    e comece a busca do blob só quando o pôster chegou (ou falhou).
posterLayer.style.backgroundImage = "url('assets/hero-poster.jpg')";
let started = false;
function startBlobFetch() {
  if (started) return;
  started = true;
  loadHeroBlob().catch(failVideo);
}
const posterImg = new Image();
posterImg.onload = startBlobFetch;
posterImg.onerror = startBlobFetch;
posterImg.src = 'assets/hero-poster.jpg';
setTimeout(startBlobFetch, 4000);   // segurança: um pôster travado nunca bloqueia o vídeo para sempre

async function loadHeroBlob() {
  const ctrl = new AbortController();
  let watchdog = setTimeout(() => ctrl.abort(), 20000);
  // priority:'low' faz o blob ceder para recursos críticos
  const res = await fetch(VIDEO_URL, { priority: 'low', signal: ctrl.signal });
  const total = Number(res.headers.get('Content-Length')) || VIDEO_BYTES;
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0, lastRing = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    clearTimeout(watchdog);                        // re-arma a cada chunk:
    watchdog = setTimeout(() => ctrl.abort(), 20000);   // 20s sem progresso aborta o stream
    chunks.push(value);
    got += value.length;
    const frac = Math.min(1, got / total);
    const now = performance.now();
    if (now - lastRing > 100 || frac === 1) {      // limitado a 100ms, mas a escrita
      lastRing = now;                              // final sempre acontece e o anel completa
      ring.style.setProperty('--ld', Math.round(126 * (1 - frac)));
    }
  }
  clearTimeout(watchdog);
  ring.style.setProperty('--ld', 0);
  video.src = URL.createObjectURL(new Blob(chunks));
  video.load();
  video.addEventListener('canplay', () => {
    requestSeek(heroProgress() * video.duration);  // pousa na posição atual do scroll
    stage.classList.add('video-ready');            // o CSS faz o vídeo surgir sobre o pôster
  }, { once: true });
}

function failVideo() {
  ring.replaceWith(makeScrollChevron());  // uma seta de scroll honesta, nunca um anel travado
  stage.classList.add('video-failed');    // os recuos de imagem estática carregam a jornada inteira
}
```

O watchdog importa: sem ele, um stream travado congela o anel para sempre, o que é pior que nenhum anel. Com ele, 20 segundos de travamento abortam para o recuo de imagem estática e o site simplesmente funciona como site estático.

A troca que este padrão compra: até uma jornada encadeada pesando uma dúzia de MB chega em silêncio atrás do anel ao longo de alguns segundos, enquanto a página em si é usável quase na hora.

## Interpole o tempo exibido (um loop rAF que descansa)

Nunca escreva a posição do scroll direto em `currentTime`; suavize na direção dela. O loop precisa ficar ocioso quando convergir e quando o hero estiver fora da tela. Loops que rodam soltos desde o carregamento gastam bateria e marcam a construção como amadora.

```js
let target = 0;      // 0..1, definido pelo handler de scroll
let shown = 0;       // o que estamos exibindo
let rafId = null;
let lastTick = 0;

function tick(now) {
  const dt = Math.min(100, now - (lastTick || now));   // ms desde o último quadro, com teto
  lastTick = now;
  const k = 0.16;    // suavização por quadro de 60fps; ponto de partida, ajuste no scrub pelo tato
  shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
  if (Math.abs(target - shown) < 0.0005) {
    shown = target;
    rafId = null;
    lastTick = 0;                     // convergiu: descansa
  } else {
    rafId = requestAnimationFrame(tick);
  }
  requestSeek(shown * video.duration);
  updateCaptions(shown);
}

function onScroll() {
  target = heroProgress();            // 0..1 pelo hero fixado
  if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
}
```

A linha do `Math.pow` é o que torna a sensação independente de taxa de quadros: o expoente normaliza a suavização para uma referência de 60fps, então toda taxa de atualização converge na mesma velocidade. Uma constante simples por quadro (`shown += (target - shown) * 0.18`) converge duas vezes mais rápido numa tela de 120Hz que numa de 60Hz, e o site fica diferente por máquina.

Acompanhe `heroOnScreen` com um IntersectionObserver para o loop nunca rodar com o hero já passado.

## Trave os seeks (o padrão à prova de deadlock)

Nunca escreva `currentTime` enquanto um seek anterior ainda voa. Seeks sem trava se empilham e essa é a diferença entre liso e engasgado no Chrome. Reduza para o alvo mais novo, emita exatamente um seguimento quando o seek completar, e resete a flag de ocupado no erro para a trava nunca poder travar de vez:

```js
let seekBusy = false;
let pendingTime = null;

function requestSeek(t) {
  if (!video.duration) return;
  if (seekBusy) { pendingTime = t; return; }   // reduz: guarda só o mais novo
  seekBusy = true;
  video.currentTime = t;
}

video.addEventListener('seeked', () => {
  seekBusy = false;
  if (pendingTime !== null) {
    const t = pendingTime;
    pendingTime = null;
    requestSeek(t);                            // exatamente um seguimento
  }
});

video.addEventListener('error', () => {        // a saída do deadlock
  seekBusy = false;
  pendingTime = null;
});
```

Sob pressão este padrão produz uma conclusão por seek e zero sobreposições. Se o scrub ainda parecer áspero com a trava no lugar, o intervalo de keyframe do vídeo está longo demais: re-encode com `-g 8` (veja `receitas-ffmpeg.md`).

## Escreva no DOM só na mudança

Escritas de DOM por quadro são a outra metade do engasgo. Trave tudo por delta:

- Legendas, scrims e classes de estado: compute o estado desejado, compare com um valor em cache, e toque o DOM só quando diferir. Nunca alterne uma classe a cada quadro.
- Qualquer texto que atualiza com o scroll (contadores, leituras de profundidade, rótulos de progresso): limite a uns 10Hz E só escreva quando a string realmente mudou.

```js
let lastLabel = '';
let lastLabelAt = 0;

function updateLabel(text, now) {
  if (now - lastLabelAt < 100) return;   // ~10Hz
  if (text === lastLabel) return;        // só na mudança
  lastLabel = text;
  lastLabelAt = now;
  labelEl.textContent = text;
}
```

Promova o vídeo à própria camada de compositor (`will-change: transform` ou `transform: translateZ(0)` no elemento de vídeo) para os repaints dele nunca arrastarem o resto da página.

## O padrão de faixas de legenda (ritmado em distância de scroll)

Cada legenda é dona de uma faixa de progresso de scroll, por exemplo `[0.12, 0.30]`. As legendas vivem no espaço negativo da filmagem, planejado lá na fase de conceito, e a faixa da ação fica livre. Nada estala.

Ritme cada faixa em vh (alturas de viewport de scroll), nunca em segundos, porque um site de scroll é lido em flicks. O padrão:

- **Cada batida ganha um platô totalmente visível de uns 80 a 130vh**, com rampas suavizadas de uns 20vh em cada borda. Pontos de partida, validados pelo teste de flick abaixo. O platô é a maior parte da faixa; as rampas são a sobra.
- **Compute as rampas em unidades de progresso.** Para uma faixa `[a, b]`: `const f = Math.min(0.02, (b - a) / 3)`. Num intervalo de scroll de 900vh (intervalo de scroll = altura do hero menos o viewport de 100vh), 0.02 de progresso são 18vh.
- **A opacidade** usa smoothstep nas duas bordas:

```js
const smoothstep = (p, e0, e1) => {
  const t = Math.min(1, Math.max(0, (p - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const f = Math.min(0.02, (b - a) / 3);
const opacity = smoothstep(p, a, a + f) * (1 - smoothstep(p, b - f, b));
```

A primeira faixa pula a suavização de entrada e a última pula a de saída, para a jornada começar e terminar com texto já assentado.

- **O progresso de montagem do texto** (a variável `--k` em que a seção de coreografia abaixo roda) assenta uns 20vh dentro da faixa, deixando o platô longo totalmente assentado:

```js
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const k = clamp((p - a) / (ramp || Math.min(0.025, (b - a) * 0.35)), 0, 1);
```

`ramp` é o override opcional `data-ramp` da faixa, descrito na seção de coreografia. Aplique tudo com escritas travadas por delta, como todo toque de DOM guiado por scroll.

**O teste de flick (como um mapa de batidas é validado):** simule passos de roda de 120px (um flick normal), 240px, e 360px (um flick duplo agressivo). Cada batida precisa ficar legível por 5 a 6 flicks normais, e nenhuma batida pode ser pulável mesmo em passos de 360px. Arrastar devagar não prova nada; visitantes reais dão flick. Se uma legenda falha o teste, funda ela numa vizinha. Nunca encolha as rampas para espremer uma batida que falhou.

A bancada é um loop pequeno rodado na página pela ferramenta de navegador (ou colado no console), um tamanho de passo por rodada:

```js
// flick(120, 12), depois flick(240, 8), depois flick(360, 6). Comece do topo a cada rodada.
async function flick(step, count) {
  for (let i = 0; i < count; i++) {
    window.scrollBy(0, step);
    await new Promise(r => setTimeout(r, 400));   // uma batida entre flicks, como um leitor real
    const bands = [...document.querySelectorAll('.band')]
      .map((b, n) => n + ':' + getComputedStyle(b).opacity);
    console.log('y=' + Math.round(scrollY), bands.join('  '));
  }
}
```

Leia as opacidades registradas entre os passos. Uma faixa que nunca chega à opacidade cheia em lugar nenhum da rodada de 360px é uma batida pulável. Uma faixa que segura opacidade cheia por menos de 5 passos consecutivos de 120px é curta demais para ler.

## O sistema de legibilidade (texto sobre filmagem viva)

Lei 10 de `leis-de-prompt.md`: vídeo ao vivo atrás de tipografia é um fundo em movimento que você não controla quadro a quadro. Cada faixa de texto do hero ganha as quatro camadas abaixo, e depois passa a auditoria.

**1. O scrim base global.** Um escurecimento radial suave (scrim é uma camada escura translúcida) sobre o vídeo inteiro, sempre ligado, para nenhum quadro ficar cru atrás da página:

```css
.scrim{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 120% 90% at 50% 45%,rgba(10,10,18,0) 35%,rgba(10,10,18,.62) 100%)}
```

**2. O scrim por faixa.** O `::before` de cada faixa carrega um scrim radial que acompanha a opacidade da faixa comandada por JS e aprofunda com a variável de progresso `--k` da faixa, então a filmagem escurece exatamente enquanto o texto daquela faixa está ligado e em nenhum outro lugar. Escureça, nunca achate: o gradiente morre aos 76 por cento para os cantos ficarem vivos. A forma que funciona:

```css
.band::before{content:"";position:absolute;inset:-4%;pointer-events:none;opacity:calc(.25 + .75*var(--k,1));background:radial-gradient(ellipse 74% 62% at 50% 50%,rgba(5,5,10,.66) 0%,rgba(5,5,10,.44) 46%,rgba(5,5,10,0) 76%)}
```

Calibre o alfa de pico por faixa contra os quadros reais daquela faixa. A faixa comprovada: 0.62 para batidas quietas até 0.72 para o gancho. Esses picos são também as constantes a mexer quando o usuário pedir a filmagem mais clara.

**A variante de dois lados para composições de ação centralizada.** O radial único centralizado acima presume o assunto fora do centro com o texto ladeando. Quando o assunto é centralizado e colunas de texto sentam dos DOIS lados (um pedido natural), nunca estique um scrim atravessando o meio. Use dois: um pseudo-elemento ancorado na coluna esquerda e um na direita, cada um uma elipse centrada na própria coluna, com a pista central completamente livre para o assunto ficar claro. A faixa de assentamento, onde as colunas convergem, ganha uma elipse única centrada em cima. Esta variante não é um meio-termo: uma construção real mediu contraste de pior pixel de 7,17 para 1 com ela.

**3. O token de sombra de texto.** Três camadas (uma borda justa, um brilho médio, uma queda larga), aplicadas em toda faixa do hero e desligadas em botões, onde um rótulo sombreado lê como sujeira:

```css
:root{--tshadow:0 1px 2px rgba(5,5,10,.95),0 3px 12px rgba(5,5,10,.78),0 10px 44px rgba(5,5,10,.8)}
.band{text-shadow:var(--tshadow)}
.band .btn{text-shadow:none}
```

**4. O chip para texto pequeno.** Linhas de HUD, leituras e rótulos pequenos sobre filmagem não ganham o radial grande. Ganham um chip, uma pílula pequena com fundo desfocado:

```css
.chip{background:rgba(8,8,15,.55);border:1px solid rgba(96,96,126,.3);border-radius:10px;backdrop-filter:blur(10px);text-shadow:0 1px 3px rgba(5,5,10,.85)}
```

**A auditoria do pior quadro (o que torna o sistema honesto).** Extraia os quadros de cada faixa, amostre por canvas os pixels sob a zona de texto COM o scrim aplicado, e exija contraste de pior pixel de pelo menos 3.5:1 em cada faixa. Faixas bem calibradas passam com folga. Calibre os alfas contra o pior quadro, nunca o médio. O quadro médio mente; o pior quadro é o que o visitante vai estar lendo.

**O método preferido, quando existe um navegador controlável** (a rota de Chrome headless em `solucao-de-problemas.md`): injete `visibility: hidden` nos spans de texto divididos, capture a página real composta naquela posição de scroll, e encontre o pixel mais claro dentro da caixa do texto. Isso mede cada camada de scrim e a queda radial exatamente como o visitante vê, e é conservador, porque esconder os glifos remove também a sombra do texto. O procedimento de quadro-mais-matemática abaixo é o recuo quando nenhum navegador pode ser controlado.

O procedimento, concretamente:

1. Converta o intervalo de cada faixa para tempo de vídeo (`time = progress * duration`) e extraia três ou quatro quadros pelo trecho com ffmpeg: `ffmpeg -ss <t> -i assets/hero-scrub.mp4 -frames:v 1 review/band2-a.png`.
2. Para cada quadro, componha o scrim da faixa no pico de alfa sobre a zona de texto e encontre o pior pixel. Para texto claro é o pixel mais claro sobrevivente. Este trecho faz o passo inteiro:

```js
// auditFrame('audit/band2-a.png', {x:420,y:300,w:600,h:200}, 0.66, [244,242,236])
// zone é a caixa do texto em pixels no quadro, alpha é o pico do scrim da faixa, textColor é RGB
async function auditFrame(src, zone, scrimAlpha, textColor) {
  const img = await createImageBitmap(await (await fetch(src)).blob());
  const c = new OffscreenCanvas(img.width, img.height).getContext('2d');
  c.drawImage(img, 0, 0);
  const d = c.getImageData(zone.x, zone.y, zone.w, zone.h).data;
  const lum = ([r, g, b]) => {
    const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const scrim = [5, 5, 10];                      // a cor base do scrim
  let worst = 0;
  for (let i = 0; i < d.length; i += 4) {
    const px = [0, 1, 2].map(j => d[i + j] * (1 - scrimAlpha) + scrim[j] * scrimAlpha);
    worst = Math.max(worst, lum(px));            // pixel mais claro, o pior caso para texto claro
  }
  const lt = lum(textColor);
  const hi = Math.max(lt, worst), lo = Math.min(lt, worst);
  return (hi + 0.05) / (lo + 0.05);              // precisa ser pelo menos 3.5
}
```

Rode pela ferramenta de navegador na página pré-visualizada. Se buscar de `review/` for bloqueado, copie os quadros para `assets/audit/` para a auditoria e apague essa pasta antes de qualquer publicação.

3. A razão retornada de cada faixa precisa ser pelo menos 3.5:1. Uma faixa reprovada ganha um pico de alfa mais fundo no scrim, e re-auditoria contra o mesmo pior quadro.

## Coreografia de texto (uma personalidade de entrada por batida)

**O princípio do eco:** cada batida do hero ganha a própria entrada, e a entrada ecoa o que a filmagem está fazendo naquele momento. Palavras derivam para baixo enquanto algo cai. Uma palavra soca a entrada quando um impacto pousa. Caracteres se montam em dispersão enquanto tinta se junta. Entrada e filmagem leem como um evento só, e é isso que faz a página parecer dirigida em vez de decorada.

A engenharia é a parte fixa, para toda entrada incluindo as que você inventar: todos os efeitos são só `transform` e `opacity`, guiados pelo scroll via a propriedade custom `--k` da faixa (progresso de montagem 0 a 1, escrito pelo loop e travado por delta em 0.008 para faixas convergidas custarem nada), e totalmente reversíveis (role para cima e eles desmontam; a rampa única de carregamento da faixa um é a única exceção desenhada).

**A primeira faixa abre assentada, caracteres incluídos.** O padrão de faixas acima já pula a suavização de entrada da faixa um, mas isso sozinho não basta: no scroll zero o `--k` da faixa ainda é 0, então os caracteres dela sentam desmontados e o hero abre em filmagem sem palavras até o usuário rolar. Dê à faixa um uma rampa de montagem única baseada em tempo no carregamento que passa o bastão para o scroll: comande a entrada dela com `k = max(scrollK, loadK)`, onde `loadK` sobe de 0 a 1 nos primeiros momentos após a página aparecer. Quando `loadK` chega a 1 o max segura a faixa um montada, o que é certo para a batida de abertura: não há nada acima dela para voltar rolando. Toda faixa seguinte fica puramente guiada por scroll e reversível.

**A divisão, feita uma vez no carregamento.** Divida o texto dos títulos em spans de palavra e caractere em JS com um gerador pseudo-aleatório com semente, para os offsets "aleatórios" serem idênticos em todo carregamento:

```js
function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}
```

Envolva um span visualmente oculto com a frase inteira para leitores de tela, mais uma cópia visual `aria-hidden="true"` feita de spans de palavra `.w` contendo spans de caractere `.c`. Atribua a cada span as propriedades custom (`--th`, `--jx`, `--jy`, `--jr`) do gerador com semente na hora da divisão.

**O cardápio (exemplos trabalhados, cada um nomeado com o momento de filmagem que ecoa):**

**(a) Dispersão.** Voo de entrada por caractere de offsets aleatórios com semente; ecoa tinta se juntando, partículas montando, detritos assentando. Cada `.c` ganha `--th` (um limiar aleatório, 0 a 0.55) e valores de tremor `--jx`/`--jy`/`--jr`:

```css
.c{--kc:clamp(0,(var(--k,0) - var(--th,0))*2.6,1);opacity:var(--kc);
   transform:translate(calc((1 - var(--kc))*var(--jx,0px)),calc((1 - var(--kc))*var(--jy,0px)))
             rotate(calc((1 - var(--kc))*var(--jr,0deg)))}
```

**(b) Alinhamento em grade.** Caracteres deslizam horizontalmente para o lugar em ordem de leitura. Mesmo CSS da dispersão com tremor só horizontal, mas o limiar é ordenado em vez de aleatório: `--th: charIndex / total * spread + rng() * 0.06`, então o valor de spread controla quanto o escalonamento dura.

**(c) Desfoque-para-nítido.** A entrada da batida quieta; ecoa névoa clareando ou foco chegando. Duas cópias empilhadas do texto em crossfade só por opacidade. A cópia suave carrega um `filter: blur(10px)` ESTÁTICO; nunca anime o `filter` em si, ele não é amigo do compositor. A cópia nítida surge com `--k`, a suave some.

**(d) Soco de palavra com overshoot.** Ecoa um impacto pousando. Pop por palavra (`--kc`) e um assentamento mais lento (`--ks`); a palavra escala além de 1 e volta suave:

```css
.w{--kc:clamp(0,(var(--k,0) - var(--th,0))*3,1);
   --ks:clamp(0,(var(--k,0) - var(--th,0) - var(--sd,.1))*var(--ss,3.2),1);
   opacity:var(--kc);
   transform:scale(calc(0.6 + (0.4 + var(--ov,.12))*var(--kc) - var(--ov,.12)*var(--ks)))}
.w.em{--ov:0.24;--sd:0.16;--ss:2.6}
```

Palavras enfatizadas (`.em`) ganham o overshoot maior com o assentamento mais tardio e lento, então elas penduram no overshoot uma batida a mais.

**(e) Subida palavra por palavra num assentamento em etapas.** A entrada de final comprovada, casando com a chegada da filmagem ao repouso. As palavras do título sobem em ordem de leitura (`--th` por palavra), depois o subtítulo surge via `--ks: clamp(0, (var(--k) - 0.66) * 4, 1)`, depois a fileira do CTA via `--kb: clamp(0, (var(--k) - 0.78) * 5, 1)`. Três chegadas, uma faixa.

**(f) Deriva para baixo.** Ecoa uma queda ou um despejo. Cada palavra começa acima do lugar de repouso e deriva para baixo até ele:

```css
.w{--kc:clamp(0,(var(--k,0) - var(--th,0))*2.8,1);opacity:var(--kc);
   transform:translateY(calc((1 - var(--kc))*-24px))}
```

**(g) Aproximação da profundidade.** Ecoa um túnel ou um empurrão para frente. A linha começa levemente pequena e cresce até o lugar como se aproximando da câmera: `transform: scale(calc(0.82 + 0.18 * var(--kc)))` com opacidade acompanhando `--kc`. Empilhe uma cópia suave de desfoque estático embaixo (o padrão desfoque-para-nítido) quando a aproximação também deve afiar.

**(h) Metades se abrindo.** Ecoa dobras abrindo ou cortinas se afastando. Divida o título em duas metades; cada uma começa puxada para a linha central e desliza para fora até o repouso conforme `--kc` sobe, sinais opostos de `--jx` por metade.

**(i) Trama.** Ecoa fios se cruzando ou fibras se entrelaçando. Caracteres chegam alternando de cima e de baixo: o CSS da dispersão com tremor só vertical e sinais de `--jy` alternando por índice de caractere.

**Este cardápio são exemplos, não um conjunto fechado.** Inventar uma entrada nova para esta filmagem é o trabalho. Pegue o momento em que a faixa senta, pergunte o que a filmagem está fisicamente fazendo, e construa a entrada que faz a mesma coisa com as palavras. Toda invenção mantém a parte fixa: só transform e opacity, guiados pelo `--k` da faixa, totalmente reversíveis no scroll para cima (a rampa única da faixa um é a única exceção desenhada).

**O padrão de controle (calibrar uma batida sem tocar a matemática das faixas):** cada faixa aceita dois atributos HTML opcionais. `data-ramp` sobrescreve a janela padrão de montagem (o padrão é `Math.min(0.025, bandLength * 0.35)` de progresso; `data-ramp="0.036"` saboreia uma montagem uns 50 por cento mais longa). `data-spread` define o espalhamento do escalonamento de caracteres para entradas de dispersão e grade. A sensação de qualquer batida é calibrada pelo markup dela, e o loop nunca muda.

## O portão do hero estático (cinco condições, em CSS E JS)

Alguns visitantes recebem um hero de imagem estática composta em vez do scrub. Os cinco portões, e eles precisam bater EXATAMENTE nas media queries do CSS e na decisão do JavaScript, ou um lado carrega materiais que o outro esconde:

1. Celulares: `(max-width: 720px)`
2. Tablets em retrato: `(orientation: portrait) and (max-width: 1024px)`
3. Retrato com ponteiro grosso: `(orientation: portrait) and (pointer: coarse)`
4. Celulares deitados: `(orientation: landscape) and (pointer: coarse) and (max-height: 560px)` (um celular de lado passa toda checagem de largura mas não tem altura para a jornada)
5. Movimento reduzido: `(prefers-reduced-motion: reduce)`

**O portão é decidido ao vivo, não uma vez no carregamento.** As media queries do CSS reavaliam a cada rotação, redimensionamento e mudança de preferência. Uma checagem JS única deixa um hero em branco no momento em que um tablet gira de retrato para paisagem, uma janela encaixada é maximizada além de 720px, ou o movimento reduzido é desligado no meio da sessão: o CSS des-esconde o palco do scrub, mas nenhum pôster, nenhum vídeo e nenhum listener de scroll existem do lado do JS. Ligue o evento de mudança das cinco queries a uma função que arma e desarma o scrub:

```js
const GATES = [
  '(max-width: 720px)',
  '(orientation: portrait) and (max-width: 1024px)',
  '(orientation: portrait) and (pointer: coarse)',
  '(orientation: landscape) and (pointer: coarse) and (max-height: 560px)',
  '(prefers-reduced-motion: reduce)'
];
let scrubOn = false;
function enableScrub(){
  if (scrubOn) return; scrubOn = true;
  initHeroOnce();                       // embrulhe a pintura do pôster e o fluxo startBlobFetch do carregador de Blob acima numa função de rodar-uma-vez; esta chamada é esse embrulho
  addEventListener('scroll', onScroll, {passive:true});
  bands.forEach(b => { b.op = -1; b.k = -1 });   // reseta caches para estilos fixados velhos serem reescritos
  unpinFinalStates();                   // desfaz o que pinToFinalStates aplicou, para linhas, contadores e holds voltarem ao comando do scroll
  updateCaptions(heroProgress());
  onScroll();                           // re-busca o vídeo na posição atual do scroll; sem isso o quadro fica velho até o usuário rolar
}
function disableScrub(){
  if (!scrubOn) return; scrubOn = false;
  removeEventListener('scroll', onScroll);
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
}
function applyHeroMode(){
  if (GATES.some(q => matchMedia(q).matches)) disableScrub();
  else enableScrub();
}
const MQLS = GATES.map(q => matchMedia(q));   // mantenha as listas de query referenciadas; sem referência elas historicamente perderam os listeners em navegadores antigos
MQLS.forEach(m => m.addEventListener('change', applyHeroMode));
applyHeroMode();
```

As cinco strings precisam ser idênticas caractere por caractere nos dois lugares, e o pôster e a busca do Blob vivem SÓ dentro do caminho com portão.

Uma guarda relacionada para telas capazes de scrub que são apenas baixas (uma janela de desktop rasa, não um celular): mantenha o scrub mas esconda os overlays pequenos guiados por scroll (setas, leituras, tickers), que não têm espaço. Um exemplo com nomes de classe de uma construção; use os seus:

```css
@media (max-height:560px){.cue,.hud,.feed{display:none}}
```

O hero estático é um layout desenhado, não um pedido de desculpas: o pôster ou o quadro final composto com as legendas visíveis. A decisão de mobile é tomada conscientemente por projeto. Hero estático é o padrão. Considere um scrub mobile cortado em cobertura só quando os três valerem: o vídeo encodado é pequeno (abaixo de uns 8 MB), a composição ainda lê cortada para retrato (a faixa da ação sobrevive ao corte), e o resultado foi verificado num celular real. Quando qualquer um dos três falhar, embarque o hero estático com orgulho.

## Completa sem o vídeo

A página precisa estar completa e bonita se o vídeo nunca carregar. Ligue o evento `error` do vídeo a esconder o elemento morto sobre o fundo de pôster. Cada legenda, cada seção e a chamada para ação precisam funcionar com uma imagem parada atrás. Teste esse estado de propósito renomeando o arquivo de vídeo e carregando a página.

## O sistema de movimento ao redor do hero

- **Nada estala.** Cada aparição, hover e mudança de estado tem easing. Defina duas curvas de easing como tokens e use em tudo. Até a página em si entra suave.
- **Entradas são coreografia.** IntersectionObserver adiciona uma classe `.in`; filhos chegam em sequência com passos de escalonamento de 60 a 150ms. Estados inicial e final da entrada precisam do prefixo da classe do contêiner (`.card .part`, `.card.in .part`) para vencerem a cascata; uma regra posterior pode senão cancelar a animação em silêncio. E quando a entrada termina, APOSENTE os atrasos de escalonamento: a regra de limpeza que zera o `transition-delay` precisa igualar ou vencer a especificidade das regras de atraso nth-child que aposenta (`:nth-child` conta como classe), ou ela silenciosamente nunca vale e cada hover nos irmãos posteriores atrasa pelo escalonamento para sempre. Prove a aposentadoria passando o mouse no segundo e no terceiro item depois da entrada terminar.
- **Nunca coloque um estilo dinâmico num elemento que também tem uma animação de entrada com `forwards`.** O valor final da animação vence permanentemente. Entrada no pai, estilo dinâmico num filho.
- **Um elemento vivo por seção** em nível de sussurro depois da entrada: um ciclo lento ou pulso de brilho suave, quatro segundos ou mais. Dê a animações em loop atrasos negativos (tipo `-1.2s`) para estarem no meio do ciclo na primeira pintura. Pause fora da tela restringindo as regras de animação a uma classe que um IntersectionObserver alterna, e pause tudo em abas escondidas com uma classe de body. `animation-play-state` não é propriedade herdada, então defini-la num contêiner silenciosamente nunca alcança elementos aninhados nem pseudo-elementos. O padrão que não pode errar: `body.paused *, body.paused *::before, body.paused *::after { animation-play-state: paused !important }`, alternado no `visibilitychange`.
- **Um momento interativo desenhado por site.** Desenhado, não decorativo; a forma comprovada tem a própria seção abaixo.
- **Anime só `transform` e `opacity`.** Para pulsos de brilho, coloque a sombra num pseudo-elemento em força total e anime a opacidade dele.
- **Texto mascarado precisa de espaço para descendentes:** todo reveal com `overflow: hidden` ganha respiro de padding/margem negativa em em, ou g, y e p têm os rabos cortados.
- **Nunca sobrescreva `el.style.transition` em JavaScript.** Alterne uma classe que declara a transição combinada completa.

## O momento interativo único (a forma comprovada)

Um por site, no tema, executado no meio da jornada. A forma que funcionou repetidas vezes: uma ação que espelha a própria história do produto. Um pressionar-e-segurar que deixa um aroma assentar. Um pressionar-e-segurar que puxa um fio e costura uma bainha. O visitante não só lê a ideia única da marca; ele a executa.

A mecânica que faz parecer desenhado em vez de truque:

- O progresso constrói enquanto o visitante segura.
- Soltar cedo desce o progresso suavemente; nunca estala para zero.
- Completar acende o conteúdo da seção em sequência, então a ação do visitante conquista algo real.
- Movimento reduzido recebe o estado final instantâneo, sem segurar.

O segurar é um exemplo, não uma lei. Qualquer interação funciona se ela encena a ideia única da marca.

## Overflow e movimento reduzido

- `overflow-x: clip` no `html` E no `body`, com `hidden` declarado antes como recuo. `hidden` sozinho ainda deixa código rolar a página de lado, e um link de âncora pode deixar a página inteira deslocada.
- Movimento reduzido é honrado POR COMPLETO: mate animações e transições em elementos e em `::before`/`::after`, zere todo `transition-delay`, mostre cada elemento coreografado no estado final pronto, e re-aplique transforms posicionais por breakpoint (um `transform: none !important` geral pode jogar um elemento posicionado de mobile para fora da tela). O vídeo não é carregado (é um dos cinco portões do hero estático).
- Movimento reduzido é honrado AO VIVO, nas DUAS direções. Escute o evento de mudança da media query. Na virada para dentro, fixe cada elemento desenhado por scroll no estado final e pare os motores JS: linhas que se traçam terminam, contadores pulam para os alvos, interações de segurar completam. Na virada de volta, re-arme o scrub pela mesma função de portão que as cinco queries usam, para os caches resetarem e as legendas recomputarem em vez de ficarem fixadas. E desfaça tudo que o pinToFinalStates aplicou: remova as classes fixadas ou estilos inline das linhas desenhadas, dos contadores e das interações de segurar, para os motores de scroll voltarem a comandar. Re-armar o hero deixando o resto da página fixado é o meio-conserto que parece pronto e não está.

```js
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', e => {
  if (e.matches) pinToFinalStates();   // linhas traçadas, contadores no alvo, holds prontos, motores parados
  else applyHeroMode();                // o movimento voltou: re-arma o scrub, nunca deixe os pinos para trás
});
```

## Direção de design (o que "caro" significa)

O piso de engenharia impede o site de quebrar. Esta barra impede ele de parecer feito por IA:

- **Comprometa-se com UMA direção tirada do mundo do assunto** e deixe ela comandar paleta, tipo, movimento e imagem juntos, para a página e a filmagem lerem como um mundo só.
- **Invente um elemento assinatura** único deste site e gaste o orçamento de ousadia nele. Todo o resto fica quieto para a assinatura ler. Depois teste o volume dela: se a assinatura fosse removida, a página mudaria de verdade? Se mal mudaria, não é assinatura. Gaste o orçamento de ousadia em algo cuja ausência seria notada.
- **Duas seções vizinhas nunca dividem o mesmo esqueleto de layout.** Se duas vizinhas abrem ambas com kicker, título, lede sobre a mesma grade, remodele uma. Um visitante nunca deve sentir o mesmo molde carimbado duas vezes seguidas.
- **Proíba os visuais que gritam "IA fez isso",** a menos que o usuário brife um explicitamente: tela creme com serifa e acento terracota, quase-preto com verde-ácido, quase-preto com acento âmbar quente e serifa de alto contraste (o padrão seguinte da fila sempre que alguém diz escuro, rico ou cinematográfico), e brutalismo de borda fininha. Uma exceção: eles são proibidos como reflexos padrão, não como assuntos. Quando um deles genuinamente É o mundo material do próprio assunto (um ateliê de cerâmica vive mesmo em creme e terracota), comprometer-se com o mundo do assunto vence. Mereça: amostre os tons da própria filmagem, invente o elemento assinatura, e fique longe do layout de molde de estoque, para a página ler como o mundo desta marca e não como o visual padrão. Diga o desvio em voz alta.
- **O acento aparece em doses raras:** a chamada para ação, estados de foco, e um ou dois momentos de ênfase. Um acento que está em tudo não é acento.
- **A tela nunca é `#000` ou `#fff` puros.** Tinja na direção do tratamento da filmagem.
- **Faça a página ser um ambiente:** uma camada de fundo fixa atrás de tudo (uma deriva lenta, grão, ou brilho suave no mundo da filmagem), ciclando a 60 segundos ou mais, para rolar parecer atravessar um lugar em vez de passar por seções empilhadas.

## O piso de qualidade (tudo, sempre)

- Fontes enxugadas só para os pesos em uso, com `preconnect`. Display com personalidade real, texto quieto, mono para rótulos pequenos. Nunca Inter ou Roboto como display.
- Dimensione blocos de texto em unidades `ch` no próprio elemento de texto, nunca num contêiner. Um `ch` resolve contra a fonte que o elemento herda, não a display dentro dele, então um teto de `ch` no contêiner é medido na fonte errada. Contêineres levam `px` ou `min()`. Uma construção real limitou um bloco de assentamento ao `ch` da fonte de texto e o título quebrou em três linhas.
- Contraste real na tela: compute, não chute. 4.5:1 texto de corpo, 3:1 texto grande e bordas de interface. Cores de linha fina geralmente falham para bordas interativas; dê a elas um valor próprio mais forte.
- Marcos semânticos: `<nav>`, `<main id="main" tabindex="-1">`, `<footer>`, um link de pular para `#main`, uma hierarquia real de títulos, e `aria-hidden="true"` nas decorações.
- O vídeo de scrub é decorativo, então trate assim: `aria-hidden="true"` no elemento de vídeo, sem atributo `controls`, e fora da ordem de tab (`tabindex="-1"` no vídeo, ou `inert` na camada decorativa do palco sticky) para usuários de leitor de tela e teclado pousarem nas legendas e no conteúdo.
- `:focus-visible` estilizado no acento. Alvos de toque de pelo menos 44px sob `(pointer: coarse)`, adicionados sem mudar layout: `@media (pointer:coarse){ .btn { min-height:44px; display:inline-flex; align-items:center; justify-content:center } }`. Nunca troque o display de um elemento sem re-declarar o alinhamento; um `display:inline-flex` solto alinha rótulos de botão à esquerda e encolhe fileiras de largura cheia para o texto.
- `<title>` real, meta description, `theme-color`, e um favicon SVG inline da marca.
- `og:image` e `og:url` precisam de URLs absolutas, que não existem até a publicação. Deixe um comentário claro `<!-- DEPLOY STEP -->` e ajuste com a URL do ar na hora de publicar (veja `publicacao.md`).
- Decorações nunca colidem com conteúdo: elementos posicionados absolutos ganham espaço reservado e se escondem em telas baixas com uma media query de `max-height`.
- Fileiras de texto alinham na linha de base (`align-items: baseline`), não caixas centradas.

## O checklist de autoteste (rode antes de mostrar qualquer coisa ao usuário)

Audite de forma adversarial. Prove, não presuma:

1. Capture o site construído em tamanho desktop e em larguras de celular (375px no mínimo; cheque 1280x800, 1440x900, 375x812, 375x667).
2. Exercite cada botão e link. Envie o formulário e confirme o estado de resposta.
3. Faça o scrub do hero no topo, no meio e no fim. Depois rápido. Observe engasgos, especialmente no Chrome.
4. Rode o teste de flick no mapa de batidas: passos de roda de 120px, 240px e 360px. Cada legenda legível por 5 a 6 flicks normais, nenhuma batida pulável em 360px.
5. Rode a auditoria de legibilidade do pior quadro: o pior pixel de cada faixa sob o texto, com o scrim aplicado, em 3.5:1 de contraste ou melhor.
6. Prove que cada entrada realmente toca (a ordem da cascata pode matá-las em silêncio).
7. Tente forçar a página para o lado: links de âncora, decorações largas, larguras estreitas.
8. Rode com movimento reduzido ligado: estados finais visíveis, nenhuma requisição de vídeo. Depois vire o movimento reduzido LIGADO com a página aberta, não só antes de carregar: cada elemento desenhado por scroll fixa no estado final e os motores JS param.
9. Carregue com o vídeo faltando: página ainda completa sobre o pôster.
10. Cheque o console do navegador em tamanhos de desktop e celular: zero erros.
11. Cheque os rabos das letras (g, y, p) em todo texto mascarado ou cortado em zoom de 100 por cento.
12. **O passe de olhos frescos, por último.** Largue o checklist e olhe a página como um visitante de primeira vez com zero contexto. Cada elemento tem o lugar dele, ou algo flutua sem explicação? Algum elemento paralelo é desigual: um passo sem imagem, um cartão estilizado diferente dos irmãos? A página lê como premium e feita sob medida para esta marca, ou algum trecho lê como enchimento? Conserte o que o olho fresco pegar antes de o usuário ver. Este é um ato diferente de auditar, e pega o que auditorias não pegam.

**Quando existe um navegador controlável, rode as checagens reais, não aproximações.** A rota de Chrome headless em `solucao-de-problemas.md` dá controle total de um navegador real, e quatro checagens acima só podem ser testadas de verdade assim: a emulação de toque faz `(pointer: coarse)` realmente casar, o único teste verdadeiro de três dos cinco portões do hero estático; a mídia emulada vira `prefers-reduced-motion` ao vivo no meio da sessão, o único teste verdadeiro da exigência das duas direções no passo 8; bloquear a URL do vídeo com `Network.setBlockedURLs` testa completo-sem-vídeo sem renomear arquivo nenhum; e um pressionar e soltar de mouse reais, com intervalo entre eles, testa o momento de pressionar-e-segurar como um visitante executa.

Se o ambiente puder escalar revisores independentes (um segundo agente, um par de olhos fresco), aponte-os para a construção pronta também. O checklist prova o que você pensou em checar; adversários acham o que você não pensou.

Reporte o que encontrou e o que consertou. A última checagem é do usuário, mas ele nunca deve ser quem acha os seus bugs.
