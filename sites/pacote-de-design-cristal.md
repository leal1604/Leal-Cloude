# Pacote de design: Panificadora Cristal (Nível 1, jornada única)

Fora da pasta de publicação. A construção consome este documento; o texto entre aspas embarca ao pé da letra.

## 1. A premissa da marca

**Forno aceso.** A Cristal abriu em 25 de fevereiro de 1998 na Rua Dr. Manoel Miranda, no Alecrim, e há 28 anos o forno dela não esfria: pão francês, bolo, sopa, carne de sol e almoço self-service. O site inteiro ensina uma ideia, a de que na Cristal sempre tem coisa saindo quente, e vende uma ação: encomendar para retirar quentinho na hora certa. Toda seção serve a isso.

## 2. Paleta (tirada do logotipo e do mundo do forno)

Desvio declarado: o mundo do forno puxa para escuro com brilho âmbar, que é um visual padrão de IA. Aqui ele é o mundo real da marca, então fica, com três cuidados: o escuro é o **vinho do logotipo** (não quase preto), o acento é o **dourado do diamante do logo** (não âmbar genérico), e a página de baixo vive na cor da farinha com títulos em fonte de letreiro, sem serifa de alto contraste e sem terracota.

```css
:root{
  --canvas:#f6ecdb;        /* farinha: fundo das seções claras */
  --forno:#3d100c;         /* vinho do logo, escurecido: hero e seções escuras */
  --panel:#fffaf1;         /* cartões */
  --accent:#e9b32c;        /* dourado do diamante: CTA, foco, ênfase rara */
  --accent-hover:#f6c850;
  --accent-muted:#b9862a;  /* brasa: bordas, partículas, linhas */
  --crosta:#a55a1c;        /* crosta do pão: rótulos */
  --text-secondary:#5f4540;
  --text-primary:#2a1411;
}
```

Valores finais conferidos contra a filmagem aprovada depois do gate do vídeo.

## 3. Fontes

- Display: **Caprasimo 400**, letreiro de padaria antiga, gordinha e calorosa. Usada com parcimônia.
- Texto: **Figtree 400 e 600**.
- Mono: **DM Mono 400**, rótulos pequenos.
- Assinatura: **Pinyon Script 400** só na marca "Cristal", ecoando o logotipo.

## 4. Mapa de faixas do hero (400vh, pontos de partida)

| Faixa | Intervalo | Momento da filmagem | Texto (ao pé da letra) | Entrada |
|---|---|---|---|---|
| 1 | 0.00 a 0.30 | forno ao longe no escuro quente, brasas vivas, primeira onda de calor | "28 anos de forno aceso no Alecrim." | desfoque para nítido (o calor tremendo e assentando) |
| 2 | 0.36 a 0.64 | a câmera se aproxima da boca do forno, vapor subindo | "Crocante por fora. Macio por dentro." | aproximação da profundidade (a câmera empurra para frente) |
| 3 | 0.72 a 1.00 | chegada: a bandeja de pães dourados em repouso, fumacinha | Título "Queeeeem quer pão?" · subtítulo "Panificadora Cristal. Padaria e restaurante no Alecrim, Natal." · botões "Fazer encomenda" e "Como chegar" | subida palavra por palavra em etapas |

O texto vive no espaço calmo à esquerda do quadro; a ação (a boca do forno e a bandeja) fica do centro para a direita.

## 5. Hero estático (celular e movimento reduzido)

Sobre o quadro final: rótulo "Padaria e restaurante · Alecrim, Natal/RN" · título "Queeeeem quer pão?" · subtítulo "28 anos de forno aceso no Alecrim. Pão quentinho, bolo, sopa e almoço self-service." · botões "Fazer encomenda" e "Como chegar".

## 6. Abaixo da dobra (tudo afunila para o formulário de encomenda)

1. **Prova, em faixa escura.** "4,5 no Google, com 858 avaliações" · "7,9 no Foursquare" · "Desde 1998" · "2.761 seguidores no Instagram".
2. **A fornada (momento interativo).** Título "Segure e veja o pão assar." Um pão desenhado em SVG cresce e doura enquanto o visitante segura o botão "Segure para assar"; soltar cedo faz o pão voltar devagar; completar acende a lista "Saiu agora: pão francês, pão com manteiga, bolo meio a meio." Movimento reduzido mostra o pão assado direto.
3. **Cardápio em abas.** "Do forno para a sua mesa." Pães · Bolos e doces · Salgados e lanches · Almoço self-service · Sopas · Bebidas. Itens com ◆ foram confirmados por clientes ou pelo Instagram: pão francês, pão com manteiga, bolo meio a meio, almoço com saladas, carne de sol, sopa. Nota: "Itens com ◆ aparecem nas fotos da Cristal ou nas avaliações dos clientes. O cardápio completo será conferido com a padaria."
4. **Almoço.** Citação de cliente: "A melhor carne de sol do Alecrim." Texto: "Almoço self-service com várias opções de salada, carne de sol e sopa. Perto de tudo no Alecrim."
5. **Clientes.** "Crocante e macio." (sobre o pão francês) · "Um prato colorido e cheio de saúde." (sobre o almoço) · "A sopa e o pão com manteiga são deliciosos." (Foursquare)
6. **Como encomendar, três passos com ilustração cada.** "Escolha" / "Diga o dia e a hora" / "Retire quentinho".
7. **Perguntas.** Onde fica? · Tem almoço? · Como encomendo bolo e salgados? · Qual o horário? · Cheguei tarde, ainda tem pão?
8. **Encomenda (a chamada para ação).** Rótulos "Seu nome", "O que você quer encomendar", "Para quando", "Detalhes do pedido"; botão "Montar pedido". Destino: o formulário monta a mensagem; abre o WhatsApp da Cristal assim que o número for confirmado, e até lá copia o pedido e oferece a ligação para (84) 3213-3695. Estado de sucesso diz exatamente isso.
9. **Contato e mapa.** Endereço, telefone, Instagram, Facebook, link para a análise.
10. **Rodapé.** "Protótipo de proposta. Imagens ilustrativas serão trocadas por fotos da Cristal." Link "Análise de presença digital e fontes".

## 7. Camada vetorial

- Divisor de trigo com diamante (do logotipo) que se traça sozinho no scroll.
- Molduras em arco de forno nas imagens.
- Brasas: pontinhos dourados subindo devagar nas seções escuras, em nível de sussurro.
- Ambiente fixo: brilho quente derivando atrás da página, ciclo de 70 segundos.
- O pão do momento interativo, desenhado à mão em SVG.

## 8. Engenharia

Blob com anel de carregamento, interpolação normalizada por dt, seeks travados, escritas de DOM só na mudança, faixas ritmadas em vh com teste de flick, legibilidade em quatro camadas, cinco portões do hero estático com listeners de mudança, completo sem o vídeo, piso de qualidade de `pipeline-scrub.md`.

## 9. Gate de texto

Zero travessões, zero palavras de estoque, varredura dos sinais de IA antes de qualquer pessoa ver.
