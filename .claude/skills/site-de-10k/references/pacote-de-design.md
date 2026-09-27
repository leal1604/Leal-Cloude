# O Pacote de Design

A entrega única do Loop do Diretor Criativo da Fase 5. Um documento que segura cada decisão criativa, escrito completo ANTES de qualquer geração, e consumido pela construção na Fase 8. Quem pegar este documento não deve precisar de mais nada para construir a página certa.

Duas regras governam:

- **Cada linha de texto do pacote embarca ao pé da letra.** O pacote é onde a escrita acontece; a construção é onde a fiação acontece. Os passes de construção ligam as linhas autorais exatamente e nunca parafraseiam.
- **Números são pontos de partida.** Faixas e números de platô aqui são rotulados como pontos de partida. O teste de flick de `pipeline-scrub.md` valida depois, e as faixas se movem se o teste mandar.

O Nível 1 ganha o mesmo pacote, enxuto: menos faixas, mesmas seções.

## 1. A premissa da marca

Um parágrafo curto construído sobre UMA palavra ou ideia real do mundo do assunto, e o site inteiro ensina e vende essa ideia. Cada seção, o momento interativo e a linha de fechamento servem a ela. Se uma seção não serve a premissa, ela não pertence à página.

## 2. A paleta como tokens CSS

Amostrada do mundo da filmagem, para página e vídeo lerem como um lugar só. Antes da geração o pacote nomeia a direção da paleta a partir do mundo do storyboard; os valores exatos dos tokens são finalizados da filmagem aprovada depois do gate do vídeo. Papéis nomeados, prontos para colar na construção:

```css
:root{
  --canvas:#___;        /* fundo da página, tingido para o tratamento da filmagem, nunca preto ou branco puro */
  --panel:#___;         /* cartões e superfícies elevadas */
  --accent:#___;        /* o CTA e a ênfase rara */
  --accent-hover:#___;  /* o estado hover do acento */
  --accent-muted:#___;  /* o acento em nível de sussurro: bordas, brilhos, partículas */
  --text-secondary:#___;
  --text-primary:#___;
}
```

## 3. O trio de fontes

Uma display fresca, uma de texto quieta, e uma mono para rótulos pequenos. Nunca Inter ou Roboto como display. Escolha faces do mundo da própria marca em vez de um padrão de costume. Nomeie cada face e os pesos exatos em uso.

## 4. O mapa de faixas

Uma tabela, uma linha por faixa do hero:

| Faixa | Intervalo (ponto de partida) | Momento da filmagem | Texto (ao pé da letra) | Entrada |
|---|---|---|---|---|
| 1 | 0.00 a 0.14 | o que o vídeo está fazendo | "As palavras exatas." | uma entrada nomeada |
| 2 | 0.16 a 0.32 | ... | "..." | ... |

- **Intervalo:** um ponto de partida rotulado em progresso de scroll, validado depois pelo teste de flick.
- **Momento da filmagem:** o que o vídeo mostra enquanto esta faixa está ativa, para o layout manter a faixa da ação livre.
- **Texto:** as palavras finais exatas, no registro da marca.
- **Entrada:** uma entrada nomeada por faixa, ecoando o momento da filmagem (o princípio do eco em `pipeline-scrub.md`).

## 5. O bloco de texto do hero estático

O texto composto para visitantes que recebem o hero estático (celulares, movimento reduzido): título, subtítulo e CTA, escritos para ficar de pé sobre o pôster ou o quadro final sem jornada atrás.

## 6. O esboço abaixo da dobra

As seções depois do assentamento, em ordem, cada uma com o texto ao pé da letra. Toda seção afunila para UMA âncora de chamada para ação. O esboço inclui:

- O momento interativo único e em qual seção ele vive.
- O FAQ, respondendo as objeções reais encontradas na pesquisa, nas palavras dos próprios compradores.
- O texto de citações ou depoimentos.
- O microtexto do formulário: rótulos, placeholders, rótulo do botão, e o estado de sucesso, mais a escolha de destino do formulário num site estático (estado de sucesso só em JS, link mailto, um serviço de formulário gratuito, ou nenhum formulário; as opções vivem na Fase 8 da skill).
- O rodapé, com a declaração de marca fictícia quando a marca é inventada.

## 7. O plano da camada vetorial

Os elementos SVG que você vai desenhar à mão (motivos, linhas que se traçam sozinhas, divisórias), as partículas em nível de sussurro, e onde cada um vive na página. Tudo honra movimento reduzido: estados finais mostrados, motores parados.

## 8. A lista de engenharia

Nomeie o padrão completo para a construção não poder lembrar pela metade: a busca por Blob com o anel de carregamento, a interpolação normalizada por dt, os seeks travados, as escritas de DOM com delta, o ritmo de faixas com o teste de flick, o sistema de legibilidade de quatro camadas, os cinco portões do hero estático mantidos vivos com listeners de mudança, completo-sem-o-vídeo, e o piso de qualidade, tudo em `pipeline-scrub.md`, mais o padrão site-inteiro-animado na Fase 8 da skill.

## 9. A linha do gate de texto

Termine o pacote com o gate, declarado para a construção herdar: cada linha voltada ao visitante acima embarca ao pé da letra, e a página construída precisa passar o gate de grep da Fase 9 (zero travessões, zero palavras de estoque, mais a varredura do corpo por sinais de IA) antes de alguém ver. Dispositivos de marca deliberados escritos neste pacote (um trio desenhado, um staccato planejado) são ofício e ficam; a varredura caça o que derivou sem convite.
