# Receitas de ffmpeg

Comandos exatos para cada passo de processamento. Estes parâmetros são padrões comprovados; o intervalo de keyframe em particular é a diferença entre um scrub liso e um travado.

## Disciplina de pastas

Primeiro, a pasta do projeto em si: crie uma pasta nomeada para o site (o nome da marca funciona bem) num lugar combinado com o usuário, com `index.html` e `assets/` dentro, e diga ao usuário onde ela vive. Gerações brutas e cópias de revisão vivem FORA dessa pasta de publicação (por exemplo em `review/` ao lado da pasta do projeto, ou um nível acima). Só arquivos processados entram em `assets/`. Nada na pasta de publicação que não deva embarcar, nunca. O arquivo `hostgator.env` e os scripts `publicar` da Fase 10 também vivem FORA dela.

## O encode de scrub (o que mais importa)

Re-encode o vídeo bruto aprovado com intervalo curto de keyframe, ou o scrub vai travar, porque o navegador só consegue buscar com precisão até keyframes:

```
ffmpeg -i raw.mp4 -c:v libx264 -crf 18 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an assets/hero-scrub.mp4
```

- `-g 8 -keyint_min 8`: um keyframe a cada 8 quadros, para toda posição de scroll buscar limpo.
- `-crf 18`: qualidade visualmente limpa.
- `-movflags +faststart`: os metadados vão para a frente, então reprodução e uso como Blob começam imediatamente.
- `-an`: remove o áudio; um vídeo de scrub nunca precisa dele.
- Mire em 4 a 8 MB para um clipe de 6 segundos em 1080p. Se ficar muito acima, suba o `-crf` na direção de 20 a 22 e re-cheque a qualidade.

### A bifurcação de compressão por tipo de filmagem

A filmagem se divide em duas famílias, e elas comprimem em direções opostas:

**Detalhe agitado mascara artefatos.** Filmagem que enche o quadro de detalhe agitado (partículas, tecido ou textura de quadro inteiro) esconde artefatos de compressão dentro do detalhe, então o crf pode apertar forte. Detalhe agitado de quadro inteiro tolera crf 25 a 26 com uma redução para uns 1700px de largura (`-vf scale=1728:-2`); pontos de partida, não alvos. Textura de quadro inteiro é a filmagem mais densa de todas e pode precisar de largura menor ou crf maior ainda.

**Gradientes suaves são o oposto.** Eles formam degraus (banding) em vez de mascarar (banding são degraus visíveis atravessando o que deveria ser uma rampa suave de cor). Aperte o crf num clipe cheio de gradiente e os quadros calmos quebram primeiro, então cheque os quadros calmos de gradiente especificamente.

**O método é sempre o mesmo:** parta dos pontos de partida acima, mova UMA variável por vez (crf primeiro, depois largura), e avalie os piores quadros fazendo scrub, não pausando. Artefatos que sobrevivem a um quadro congelado desaparecem em movimento na filmagem agitada. Orce o tamanho mais ou menos em proporção à duração: um clipe de 6 segundos quer cerca de um terço do tamanho de um master de 18. Adicione uma redução de escala antes de sacrificar densidade de keyframes, e mantenha todas as outras flags de scrub idênticas (`-preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an`).

## O corte de cauda (quando o feedback do gate é "termina antes")

O conserto de final mais barato não é um re-roll. Quando uma tomada é forte até o assunto voltar a se mover perto do fim, corte o bruto no último quadro estável. A página mapeia scroll para progresso, não para segundos, então um clipe mais curto não custa nada em lugar nenhum. Extraia quadros candidatos ao redor do segundo alvo, escolha o que descansa melhor (margens, rosto, composição), depois corte e encode de scrub num passe só:

```
ffmpeg -i raw.mp4 -t 4.3 -c:v libx264 -crf 18 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an assets/hero-scrub.mp4
```

Re-derive o pôster e o quadro final depois, e re-verifique o novo final com o cabeçalho simulado por cima, porque o quadro cortado agora é a composição de repouso da página. Só recorra a um re-roll de preço cheio quando não existir quadro estável nenhum.

## A checagem de repouso do final (objetiva, um comando)

Se o final realmente descansa não precisa ser julgamento de olho. Meça o movimento por quadro: diferencie cada quadro contra o anterior e leia o brilho médio da diferença, que é uma curva de movimento:

```
ffmpeg -i raw.mp4 -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG" -f null -
```

Cada quadro imprime uma linha `YAVG`; mais alto significa mais mudança desde o quadro anterior. Leia a cauda da curva: uma chegada sobe e volta perto do nível inicial; uma deriva fica alta até o fim. Um comando substitui o olho, e decide se o corte de cauda acima é necessário.

## Pôster (primeiro quadro) e quadro final

```
ffmpeg -i assets/hero-scrub.mp4 -frames:v 1 -q:v 2 assets/hero-poster.jpg
ffmpeg -sseof -0.1 -i assets/hero-scrub.mp4 -update 1 -frames:v 1 -q:v 2 assets/hero-ending.jpg
```

O quadro final é um material de design grátis e perfeitamente na marca. Reutilize numa seção de baixo.

## Extração de quadros para inspeção (antes do gate do vídeo)

Puxe quadros do início, do meio e do fim do vídeo BRUTO e olhe você mesmo: anatomia, transições, se o final realmente descansa. Para um clipe de 6 segundos:

```
ffmpeg -ss 0 -i raw.mp4 -frames:v 1 -q:v 2 review/frame-start.jpg
ffmpeg -ss 3 -i raw.mp4 -frames:v 1 -q:v 2 review/frame-mid.jpg
ffmpeg -sseof -0.1 -i raw.mp4 -update 1 -frames:v 1 -q:v 2 review/frame-end.jpg
```

## O quadro de encadeamento (qualidade cheia, nunca qualidade de revisão)

O quadro que vira o `start_image` do próximo segmento precisa ser um PNG de qualidade cheia. Os jpgs `-q:v 2` de revisão acima são só para os seus olhos; encadear de um deles assa compressão em cada segmento seguinte:

```
ffmpeg -sseof -0.1 -i seg.mp4 -update 1 -frames:v 1 -q:v 1 final.png
```

Este PNG é o que você sobe via `media_upload` e `media_confirm` (a ponte está detalhada em `leis-de-prompt.md`), e o id de mídia confirmado vira o `start_image` do próximo segmento.

## Concat de segmentos (jornadas encadeadas do Nível 2)

**Preferido: concat dos brutos e encode exatamente uma vez.** Alimente os segmentos BRUTOS num filtro único e aplique o encode de scrub uma vez no resultado unido. Um encode significa que as junções não podem divergir, porque não há nada para divergir:

```
ffmpeg -i seg1-raw.mp4 -i seg2-raw.mp4 -i seg3-raw.mp4 -filter_complex "[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]" -map "[v]" -c:v libx264 -crf 25 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an assets/hero-scrub.mp4
```

(O `-crf 25` aqui mostra o valor de filmagem agitada; o crf vem da bifurcação de compressão, e 18 é o ponto de partida normal.)

Defina o `-crf` pela bifurcação acima: 18 como ponto de partida normal, valores mais duros (mais uma redução de escala) para filmagem agitada de partículas ou textura, mais suaves para filmagem cheia de gradiente.

**Recuo quando os brutos não existem mais:** encode cada segmento com parâmetros IDÊNTICOS (o encode de scrub acima: mesmo codec, resolução, taxa de quadros, formato de pixel, `-g 8`), depois concatene sem perdas com o demuxer de concat:

`concat-list.txt`:
```
file 'seg1-scrub.mp4'
file 'seg2-scrub.mp4'
file 'seg3-scrub.mp4'
```

```
ffmpeg -f concat -safe 0 -i concat-list.txt -c copy assets/hero-scrub.mp4
```

Se uma junção pelo demuxer travar na reprodução, os parâmetros dos segmentos não eram realmente idênticos: re-rode o encode de scrub em cada segmento a partir do bruto com o comando exato igual, e concatene de novo. Não maquie uma junção travada re-encodando o arquivo concatenado em qualidade menor. E se você ainda tem os brutos, use o caminho de encode único; ele torna esse modo de falha impossível.

## O resgate por crossfade (quando uma junção encadeada aparece)

Quando uma corrente já gerada mostra um corte visível numa junção mesmo com o movimento continuando (geralmente textura re-imaginada na costura; a lei da costura está em `leis-de-prompt.md`), troque o concat duro por um crossfade curto por junção usando `xfade`. Um quarto de segundo é o ponto de partida comprovado. Um visitante rolando lê como a superfície mudando, não como um corte.

O offset é o comprimento da primeira entrada menos o comprimento do fade. Dois segmentos de 6 segundos com fade de 0,25 segundo:

```
ffmpeg -i seg1-raw.mp4 -i seg2-raw.mp4 -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.25:offset=5.75[v]" -map "[v]" -c:v libx264 -crf 18 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an assets/hero-scrub.mp4
```

Para três segmentos, encadeie os xfades. Cada offset seguinte é o comprimento unido até ali menos o fade (6 + 6 - 0,25 - 0,25 = 11,5):

```
ffmpeg -i seg1-raw.mp4 -i seg2-raw.mp4 -i seg3-raw.mp4 -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.25:offset=5.75[a];[a][2:v]xfade=transition=fade:duration=0.25:offset=11.5[v]" -map "[v]" -c:v libx264 -crf 18 -preset slow -g 8 -keyint_min 8 -pix_fmt yuv420p -movflags +faststart -an assets/hero-scrub.mp4
```

Defina `-crf` e qualquer redução pela bifurcação de compressão acima. Isto ainda é um encode único, então as junções não podem divergir. Cada fade encurta o total pelo comprimento dele; a página nunca nota, porque tudo roda em progresso, não em segundos. Verifique fazendo scrub para frente e para trás sobre cada junção, não assistindo em velocidade. Um site de scrub é lido em velocidade de scrub, e é ali que uma costura aparece ou desaparece.

## Dimensionamento de imagens para web

Redimensione as imagens de apoio para uns 1920px de largura com UM passe limpo de compressão. Muitas hospedagens recomprimem imagens no servidor, então suba grande e limpo e deixe o passe da hospedagem ser o único com perda (vídeos passam pelas hospedagens intocados):

```
ffmpeg -i raw-still.png -vf scale=1920:-2 -q:v 2 assets/nome-da-secao.jpg
```

`-q:v 2` é qualidade JPEG quase transparente. `-2` mantém a altura par, que alguns encoders exigem. Capturas de tela e outras imagens de UI com bordas duras ficam em PNG ou WebP sem perdas; o passe JPEG é para imagens fotográficas.

## Verifique depois de cada encode

Reproduza ou extraia um quadro da saída antes de usar. Uma falha silenciosa de encode pega agora é de graça; pega depois da publicação é uma republicação.
