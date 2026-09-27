# As Leis do Vídeo Hero e a Construção de Prompts

Desenhe cada tomada por estas leis ANTES de gerar. Elas preveem quais conceitos acertam de primeira e quais queimam créditos. Cada uma veio de uma construção real que deu certo por causa dela ou falhou sem ela.

Uma nota de idioma que vale para este arquivo inteiro: a conversa com o usuário é em português, mas **os prompts enviados ao gerador são escritos em inglês**, porque os modelos de imagem e vídeo rendem melhor assim. Os modelos de prompt abaixo já estão em inglês de propósito.

## As doze leis

1. **O movimento concorda com o scroll.** Rolar para baixo precisa ler como descer, abrir ou chegar: um despejo, uma descida, uma desmontagem, uma aproximação. Pergunte de cada conceito: "quando o visitante rola para baixo, esse movimento parece descer?" Um assunto que sobe enquanto o visitante desce briga com a página e sempre perde.

2. **Um assunto, um movimento contínuo, sem cortes.** Um único assunto atravessa uma única jornada. Não peça a um vídeo de IA para transformar uma coisa em outra: transformações entre dois assuntos são a tomada mais difícil de vídeo por IA e queimam dinheiro. Se o usuário insistir, esconda a troca dentro de um flash ou momento de nuvem, mantenha uma trajetória contínua (mesma direção, mesma posição, mesma velocidade dos dois lados da troca), e espere repetições.

3. **Trave o caminho, liberte o corpo.** A trajetória fica rígida, mas o assunto nela precisa continuar vivo: movimento natural, ondulação, pequenos ajustes. A cena precisa de vida também: vapor derivando, nuvem riscando, luz mudando. Nunca estabilize uma tomada congelando o assunto. Um assunto congelado num caminho limpo lê como filmagem morta.

4. **Planeje o final primeiro.** O quadro final é onde a página vem descansar, então escreva ele no prompt explicitamente como uma chegada composta e satisfatória: a xícara pousada no balcão, o produto montado, o destino alcançado. Um final desajeitado faz um site desajeitado. Se o final é uma vitrine de produto, componha com margem generosa acima e abaixo do produto inteiro: o cabeçalho do site senta sobre o topo do quadro, e o corte de cobertura come as bordas em telas mais largas ou mais baixas. Um produto com o topo cortado lê como acidente; espremido contra a navegação lê como bagunça. A alternativa que evita o problema inteiro: um final de textura sangrada, sem nada cortável, é seguro para texto em qualquer tela. Verifique olhando o quadro final com o cabeçalho simulado por cima, numa janela larga e numa baixa, antes de aprovar.

5. **Escolha assuntos tolerantes.** Fluidos, névoa, vapor, luz, tecido e silhuetas distantes renderizam lindamente. Qualquer coisa cuja anatomia exata todo espectador conhece de perto (controles, teclados, mãos, animais conhecidos em detalhe) mostra os erros na hora. Mantenha detalhe arriscado distante, simples e em movimento.

6. **Prefira um eixo de movimento vertical.** Uma jornada reta de cima para baixo casa um a um com o eixo do scroll, então a revelação se move com a página nas duas direções. Não é obrigatório, mas quando dois conceitos empatam, pegue o vertical.

7. **Componha para o layout.** Decida no desenho do conceito onde a ação senta no quadro, e deixe espaço negativo intencional para as legendas e a história da página viverem. A faixa da ação fica livre; as palavras ladeiam.

8. **Venda os cruzamentos de fronteira.** Quando a câmera atravessa uma superfície (para dentro d'água, através de névoa, por um vidro), escreva o momento físico da lente no prompt: um respingo, gotas na lente, uma batida de desfoque. Uma passagem limpa por uma fronteira lê como falsa; a bagunça é o realismo.

9. **Se o hero mostra um produto, marque ele ou enquadre de perto.** Um objeto genérico sem marca à distância lê como espaço reservado. Ou aplique a marca via edição de imagem antes de animar, ou escreva o final para pousar perto o bastante para o design do objeto carregar a cena.

10. **Texto sobre filmagem conquista a própria legibilidade.** Vídeo ao vivo atrás de tipografia é um fundo em movimento que você não controla quadro a quadro. Então toda faixa de texto ganha um sistema de legibilidade: um scrim local (um gradiente escuro suave atrás das palavras) que aprofunda só enquanto aquela faixa está ativa, uma sombra de texto real, e uma checagem de contraste contra o PIOR quadro daquela faixa, nunca o médio. Posicione cada faixa na região mais calma dos quadros dela. Se uma linha não pode ser lida num relance sobre o momento mais agitado da faixa dela, ela falha. O sistema que funciona, com código e auditoria, está em `pipeline-scrub.md`.

11. **Ritme o texto em distância de scroll, não em segundos.** Um site de scroll é lido em flicks, não tocado a 24 quadros por segundo. Dê a cada batida de legenda um platô longo totalmente visível (a maior parte da faixa dela, o bastante para sobreviver a vários flicks normais) com rampas curtas suavizadas nas bordas, para um leitor nunca ver texto surgir e sumir entre dois flicks e nunca precisar parar seco para pegar uma linha. Teste o mapa de batidas com flick-scroll como um visitante real, não arrastando devagar. Os números exatos e o teste de flick estão em `pipeline-scrub.md`.

12. **As guardas permanentes:** escreva "no text, no logos, no lettering anywhere" em todo prompt de imagem e de vídeo. Recuse as sugestões de preset do gerador quando você tem uma tomada desenhada. E nunca construa o site em volta de filmagem que o usuário não aprovou: andaime silencioso durante a espera do render é permitido, mas nada é mostrado ou finalizado até o vídeo passar o gate.

## Construção de prompts

### Modelo do quadro inicial (imagem, 16:9, 2k, cerca de 2 créditos)

Componha a imagem como o quadro um do movimento: o assunto posicionado para a jornada poder começar.

```
[SUBJECT] at [POSITION IN FRAME], composed as the first moment of a motion
that will [ONE-SENTENCE JOURNEY]. [LIGHTING: source, direction, mood].
[PALETTE: the three to five brand colors described as materials and light,
not hex codes]. [ATMOSPHERE: the ambient life the scene carries]. Intentional
negative space at [WHERE THE CAPTIONS WILL LIVE]. Cinematic, photorealistic,
16:9. No text, no logos, no lettering anywhere.
```

**A armadilha da frase de espaço negativo: nunca nomeie espaço vazio como escuridão ou vazio.** Quando reservar lugar para as legendas, descreva a cena como um mundo contínuo enchendo o quadro de borda a borda, com a região calma como parte desse mundo: sombra suave, profundidade recuando, uma superfície lisa. Peça "generous empty darkness left and right" e o modelo pinta painéis pretos literais nas laterais, o que custa um re-roll. Frase de borda a borda acerta de primeira.

A mesma armadilha tem um caso de simetria. Quando a composição precisa de um assunto centralizado, "centered" sozinho não basta. Diga que o assunto bissecta o quadro, centro morto, mesma distância da borda esquerda e da direita. Descreva as duas metades como um tratamento idêntico, e proíba explicitamente objetos, partes de máquina e brilhos fortes dos dois lados. Uma construção real levou três tentativas até essa frase acertar a tomada.

Se o usuário forneceu uma foto real de produto, essa foto pode ser o quadro inicial. Inspecione resolução e composição antes, e confirme que o espaço negativo funciona para o layout.

Quando o assunto é uma pessoa real (o dono, o chef, o artesão), a foto dela entra como imagem de referência em vez de quadro inicial: gere o quadro inicial com um modelo que aceita referências de personagem, reafirme os detalhes reconhecíveis no prompt (cabelo, óculos, roupa), e inspecione o resultado por semelhança do mesmo jeito que inspeciona por marcas registradas. Semelhança é um detalhe de coerência de marca; um rosto quase-certo derruba o site inteiro. E uma regra dura antes de gerar qualquer rosto: só use foto do próprio usuário ou de uma pessoa que concordou em aparecer no site. Se a foto é de outra pessoa, pare e pergunte antes de gerar.

### Modelo do vídeo (imagem-para-vídeo, 1080p, 6 segundos, modo padrão, sem áudio; cerca de 54 créditos no modelo mais caro, bem menos num intermediário)

```
One continuous shot, no cuts. [SUBJECT] [VERB OF THE JOURNEY: pours, descends,
approaches, assembles] from [START STATE] to [END STATE] along [THE EXPLICIT
TRAJECTORY: straight down the center of frame, a slow forward push, etc].
The [SUBJECT] stays alive throughout: [SMALL NATURAL MOTION: ripple, sway,
micro-adjustments]. The scene stays alive: [AMBIENT LIFE: drifting steam,
shifting light, streaking cloud]. [IF A BOUNDARY IS CROSSED: the physical
lens moment, e.g. a splash and droplets on the lens with a beat of blur].
The shot ends at rest: [THE COMPOSED FINAL FRAME, fully described: what sits
where, what the light does, why it feels arrived]. No text or lettering
anywhere.
```

Gere em 1080p, não em 4K. A versão web é re-encodada e comprimida de qualquer forma, e 4K só multiplica o custo.

## A receita de encadeamento (Nível 2: uma jornada de scroll de 15 a 20 segundos)

Uma jornada longa construída de segmentos de 6 segundos que se unem invisivelmente:

1. Gere o segmento 1 a partir do quadro inicial. Rode a inspeção completa e o ⛔ GATE DO VÍDEO nele sozinho.
2. Extraia o quadro final do segmento aprovado como PNG em qualidade cheia com ffmpeg (comando exato em `receitas-ffmpeg.md`; jpgs de revisão não servem para encadear).
3. Suba esse PNG para o Higgsfield. Esta é a ponte de um arquivo local para um `start_image`, e ela tem três passos: chame `media_upload`, que retorna uma URL de PUT pré-assinada (um endereço temporário de upload). Depois faça PUT dos bytes crus do PNG nessa URL, por exemplo `curl -X PUT --upload-file final.png "<presigned-url>"`. Depois chame `media_confirm` para registrar o upload. O id de mídia confirmado é o que você passa como `start_image` na chamada imagem-para-vídeo do próximo segmento.
4. Escreva o prompt do próximo segmento para o movimento CONTINUAR: mesma direção, mesma velocidade, mesma luz, retomando exatamente de onde o anterior descansou. A junção só é invisível se o vetor de movimento nunca quebra. Caso especial que aparece com frequência: quando um segmento termina num quadro quase vazio ou quase preto (digamos, um único ponto de luz), o prompt do segmento seguinte precisa descrever explicitamente o que cresce daquele quadro. Faça isso e a junção desaparece.
5. Gate cada segmento separadamente. Um segmento rejeitado é um re-roll único e barato, não um refazer da jornada inteira.
6. Una os segmentos aprovados num arquivo só com o concat de encode único de `receitas-ffmpeg.md`: alimente os segmentos BRUTOS num filtro só e encode exatamente uma vez com os ajustes de scrub. Um encode significa que as junções não podem divergir. O recuo, quando os brutos não existem mais, é encodar cada segmento com ajustes IDÊNTICOS e unir com o demuxer de concat; parâmetros idênticos são o que mantém esse caminho invisível nas junções, e parâmetros diferentes travam em cada junção.
7. O arquivo unido é o único vídeo de scrub que a página usa. A página nunca sabe que foram segmentos.

Só o segmento final precisa do final composto em repouso (lei 4). Segmentos do meio devem terminar em pleno movimento para o próximo poder continuar.

**A lei da costura: identidade de textura não atravessa.** Cada geração re-imagina a textura fina a partir do quadro inicial dela. Posição atravessa; a trama, o grão ou a pele exata, não. Então uma junção repouso-com-repouso sobre textura hiper-específica aparece como corte visível mesmo com o vetor de movimento perfeito. Storyboarde cada costura para cair dentro de movimento, ou dentro de um momento que motiva uma renovação de textura: uma varredura pela lente, uma batida de desfoque, um momento de escuridão, uma virada de luz. Nunca encoste dois estados de repouso sobre textura específica. Se uma corrente já foi gerada e uma costura aparece mesmo assim, o resgate é a junção com crossfade de `receitas-ffmpeg.md`.

**Quais mundos encadeiam com confiança:** mundos abstratos (luz pura, partículas, atmosfera) são os campeões de confiabilidade do encadeamento. Sem anatomia para um prompt de continuação errar, uma corrente de três segmentos pode acertar de primeira em todos. Quando um conceito de Nível 2 está em cima do muro, esta é uma razão forte para ir de abstrato.

## Recusando presets

O gerador às vezes casa o padrão do seu prompt e oferece um preset da casa em vez de gerar a sua tomada. Recuse e tente de novo com o seu prompt literal. A sua tomada desenhada obedece as leis e compõe para o seu layout; um preset não faz nenhum dos dois.

## Consulta de custos

Antes de QUALQUER geração, cheque o preço exato da chamada exata que você planeja com `get_cost: true`. É grátis. Diga cada preço ao usuário em palavras simples antes de ele se mover: o preço do quadro inicial antes do quadro ("A imagem inicial custa cerca de 2 créditos, gerando agora"), depois o cardápio de modelos de vídeo com preços reais quando o quadro for aprovado, antes de qualquer crédito de vídeo se mover. O passo barato primeiro, a decisão grande depois, cada número real.

**O modelo de vídeo é uma escolha real, e o usuário faz.** O conector oferece vários modelos de vídeo, e a diferença de preço em parâmetros idênticos (mesma duração, mesma resolução, mesmo modo) já mediu cerca de cinco para um entre o modelo mais caro e um intermediário. As duas pontas são genuinamente de primeira linha: rankings independentes colocam o padrão comprovado no topo em qualidade geral e fidelidade ao prompt, e o intermediário entre os melhores em física e movimento cinematográfico. Então consulte a MESMA tomada planejada nos dois ou três modelos de cima. Descubra a linha atual com o catálogo de modelos do conector; `get_cost` é grátis em todos. Depois apresente os números reais com a troca honesta: o padrão comprovado é onde estas leis foram calibradas e compra o teto mais alto; o intermediário é legítimo e transforma um saldo pequeno ou de teste de uma tomada em várias, o que muda o gate do vídeo de assustador para uma decisão criativa normal. O dinheiro é dele, a escolha é dele, feita antes de qualquer gasto.

Nos padrões comprovados uma imagem de hero custa cerca de 2 créditos e um vídeo de hero cerca de 54, que é o topo da faixa de vídeo, e um teste gratuito cobre mais ou menos um pipeline de hero mais uma repetição, mais com um modelo de vídeo mais barato. Para uma jornada encadeada, consulte a corrente inteira e apresente o total completo de frente, por segmento.
