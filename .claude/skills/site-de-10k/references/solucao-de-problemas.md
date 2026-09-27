# Solução de Problemas: Sintoma → Causa → Conserto

Cada entrada aconteceu numa construção real. Cheque aqui antes de inventar um diagnóstico.

## Geração

| Sintoma | Causa | Conserto |
|---|---|---|
| O gerador sugere um preset em vez de gerar | Ele casou o padrão do seu prompt com um estilo da casa | Recuse e tente de novo com o seu prompt literal; a sua tomada desenhada vence um estilo da casa |
| Um logotipo ou marca real aparece na imagem gerada | A IA contrabandeou uma marca registrada | Conserte com uma edição de imagem barata antes de animar; nunca anime um quadro com marca registrada |
| A transformação "parece dois vídeos separados" | A trajetória quebrou na troca | Um vetor contínuo pela transição (mesma direção, posição, velocidade), ou melhor, escolha um conceito de assunto único |
| O assunto parece congelado ou sem vida | O prompt sobre-estabilizou para proteger o caminho | Trave o caminho, liberte o corpo: trajetória rígida, mas exija movimento natural no assunto e vida ambiente na cena |
| Um cruzamento de fronteira (para dentro d'água, por um vidro) parece falso | A passagem foi limpa demais | Escreva o momento físico da lente no prompt: respingo, gotas na lente, uma batida de desfoque |
| O produto do hero lê como espaço reservado | Objeto genérico sem marca à distância | Aplique a marca via edição de imagem antes de animar, ou escreva o final para pousar perto o bastante para o design carregar |
| Três vídeos falhados num conceito | Problema de conceito, não de prompt | Pare de iterar o prompt e pivote o conceito; as leis preveem quais conceitos acertam de primeira |
| A tomada é forte mas o final não descansa (o assunto volta a se mover perto do fim) | O modelo passou da chegada composta e continuou animando | Não re-role primeiro. Corte o bruto no último quadro estável e encode de scrub num passe (receita em `receitas-ffmpeg.md`); a página roda em progresso, não em segundos, então um clipe mais curto não custa nada |
| A jornada encadeada trava numa junção de segmentos | Parâmetros de encode não eram idênticos, ou o vetor de movimento quebrou entre segmentos | Re-encode cada segmento com o comando de scrub exato igual e re-concatene; se o movimento em si pula, o prompt do segmento seguinte não continuou a direção e a velocidade do anterior |
| Um corte visível onde dois segmentos se encontram, mesmo com o movimento continuando | Cada geração re-imagina a textura fina do quadro inicial, então uma junção repouso-com-repouso sobre textura específica (trama, grão, pele) aparece como corte | Da próxima vez, storyboarde cada costura para dentro de movimento ou de um momento de renovação de textura (a lei da costura em `leis-de-prompt.md`); para a corrente que você já tem, use a junção com crossfade de `receitas-ffmpeg.md` |
| Um job volta marcado como nsfw numa tomada abstrata inocente | O filtro de segurança leu errado linguagem sensorial abstrata (formas brilhando, líquido fluindo ao redor de uma forma) | Verifique o saldo primeiro: jobs marcados não são cobrados. Depois re-role o mesmo quadro inicial com o prompt reescrito em palavras simples de fotografia comercial de produto: nomeie o produto cedo, descreva objetos e não sensações, mantenha o mesmo desenho de tomada |

## O hero de scrub

| Sintoma | Causa | Conserto |
|---|---|---|
| O scrub não faz nada no site no ar mas funciona no local | A hospedagem não suporta download parcial (Range), então os seeks travam em zero | Busque o vídeo como Blob e reproduza a object URL (veja `pipeline-scrub.md`); funciona em qualquer lugar |
| O scroll engasga no topo e no fim do hero, pior no Chrome | Seeks sem trava empilhando mais escritas de DOM por quadro | Trava de seek e escritas por delta (veja `pipeline-scrub.md`) |
| Ainda engasga depois da trava e do delta | O intervalo de keyframe do vídeo está longo demais | Re-encode com `-g 8 -keyint_min 8` (veja `receitas-ffmpeg.md`) |
| O scrub congela permanentemente no meio do scroll | A flag de seek ocupado travou de vez (um seek deu erro e nunca disparou `seeked`) | Resete a flag e limpe o alvo pendente no handler de `error` do vídeo; o padrão à prova de deadlock está em `pipeline-scrub.md` |
| Celulares baixam o vídeo ou o pôster que nunca mostram | Pôster definido no HTML, ou a carga do vídeo fora do portão do hero estático | Defina o pôster via JavaScript dentro do mesmo caminho de código com portão que carrega o vídeo |
| O hero estático aparece no desktop, ou o vídeo carrega em celulares | As cinco condições de portão diferem entre CSS e JS | Faça as cinco media queries baterem EXATAMENTE nos dois (veja `pipeline-scrub.md`) |
| A página quebra quando o vídeo falha ao carregar | Sem caminho de erro | Esconda o vídeo morto sobre o fundo de pôster no `error`; a página precisa estar completa sem o vídeo |
| Capturas do site rodando mostram o pôster ou um palco em branco onde o vídeo de scrub deveria estar, mas o site funciona num navegador real | A camada de compositor promovida do vídeo não compõe em capturas de navegador embutido | Verifique o comportamento do scrub pelo DOM em vez de pixels: sonde as variáveis `--k` das faixas, opacidades e transforms de palavras, e o `currentTime` em várias posições de scroll, ou assista numa janela de navegador real. Uma captura em branco de uma camada promovida não é um site quebrado |
| A página parece completamente morta na pré-visualização: pôster nunca definido, toda faixa de legenda em opacidade 0, o vídeo nunca busca, e o painel reporta estar escondido | Um painel de pré-visualização escondido ou sem exibição para de compor, então `requestAnimationFrame` nunca dispara. Tudo no hero de scrub é comandado por esse loop, então o DOM congela também. O conselho de sondar o DOM da linha acima não ajuda aqui, porque o próprio DOM está congelado | Pare de usar o painel e comande o Chrome instalado da máquina em modo headless; a receita completa está logo abaixo desta tabela |
| O hero fica em branco (sem pôster, sem legendas) depois de girar o aparelho ou redimensionar a janela | O JS decidiu estático-versus-scrub uma vez no carregamento enquanto os portões do CSS ficaram vivos | Arme e desarme o scrub por listeners de mudança nas cinco queries de portão; o padrão de portão vivo está em `pipeline-scrub.md` |
| Dois cliques no `index.html` mostram o hero estático e o vídeo nunca carrega | Navegadores bloqueiam `fetch` em URLs file://, então o carregador de Blob recua por design | Esse estado é o recuo desenhado e precisa parecer completo. Para a pré-visualização completa do scrub, sirva a pasta com um servidor de uma linha (`npx http-server`, `python -m http.server`) e abra o localhost; a hospedagem no ar serve o scrub normalmente |

### A receita de Chrome headless (quando o painel de pré-visualização está morto)

Quando o próprio painel de pré-visualização está escondido ou quebrado, verifique pelo Chrome instalado na máquina, comandado em headless pelo protocolo DevTools (o canal de controle remoto que todo Chrome traz). Não precisa de instalação nem de pacotes:

1. Lance o Chrome com `--headless=new --disable-gpu --remote-debugging-port=9222 --user-data-dir=<uma pasta temporária> --hide-scrollbars`.
2. Do Node (versão 22 em diante traz WebSocket global, então isso leva zero dependências): GET `http://127.0.0.1:9222/json/list`, pegue o `webSocketDebuggerUrl` do alvo, e conecte nele.
3. Por esse socket, comande a página com comandos de protocolo: `Page.navigate`, `Page.captureScreenshot`, `Runtime.evaluate`, `Emulation.setDeviceMetricsOverride`, `Emulation.setTouchEmulationEnabled`, `Emulation.setEmulatedMedia`, `Network.setBlockedURLs`, e `Input.dispatchMouseEvent`.

Uma pegadinha: `Emulation.setTouchEmulationEnabled` rejeita `maxTouchPoints` de 0. Sempre mande 5 e controle o comportamento pela flag `enabled`.

Além do resgate, esta rota torna possíveis as checagens genuínas do autoteste (emulação de toque real, viradas de mídia ao vivo, bloqueio de URL, pressionar de mouse real); elas estão listadas com o checklist em `pipeline-scrub.md`.

## A página

| Sintoma | Causa | Conserto |
|---|---|---|
| Uma animação de entrada nunca toca, o elemento só aparece | Uma regra posterior venceu a cascata sobre o estado inicial da animação | Prefixe estados inicial e final com a classe do contêiner (`.card .part`, `.card.in .part`) e prove que cada entrada toca |
| Hovers no 2º e 3º itens de uma grade escalonada respondem tarde mesmo depois da entrada terminar | A regra de limpeza que zera o `transition-delay` do escalonamento tem especificidade menor que as regras de atraso nth-child que aposenta (`:nth-child` conta como classe), então silenciosamente nunca vale | Faça o seletor de limpeza igualar ou vencer as regras de atraso (repita o nth-child nele) ou ponha `!important` no atraso `0s`, e prove passando o mouse nos irmãos posteriores |
| Um estilo guiado por scroll para de responder depois da entrada | `animation-fill-mode: forwards` sobrescreve para sempre | Animação de entrada no pai, estilo dinâmico num filho |
| Um loop de fundo pisca ou estala quando começa | Atraso de animação positivo | Atrasos negativos (tipo `-1.2s`) para todo loop estar no meio do ciclo na primeira pintura |
| Rabos de letra (g, y, p) cortados | Texto mascarado ou cortado sem respiro | Padding em em com margens negativas casadas na máscara (veja `pipeline-scrub.md`) |
| A página pode ser arrastada ou deslocada para o lado | `overflow-x: hidden` sozinho, ou uma decoração passando da borda | `overflow-x: clip` no `html` E no `body`, `hidden` antes como recuo |
| Hovers começam a estalar depois de um script rodar | JavaScript sobrescreveu `el.style.transition` | Alterne uma classe que declara a transição combinada completa |
| Um elemento mobile senta fora da tela com movimento reduzido ligado | `transform: none !important` geral apagou o transform posicional | Re-aplique transforms posicionais por breakpoint dentro do bloco de movimento reduzido |
| Um letreiro mostra um vão no ponto de loop | Trilha mais curta que a tela mais larga suportada | Duplique itens até cada trilha passar de uns 2560px |
| Animações rodam com a aba escondida ou a seção fora da tela | Loops rodando soltos | Restrinja regras de animação a uma classe que um IntersectionObserver alterna; no `visibilitychange` alterne uma classe de body com `body.paused *, body.paused *::before, body.paused *::after { animation-play-state: paused !important }`; loops rAF descansam ao convergir |
| Uma pausa escrita num contêiner nunca pausa as animações dentro dele | `animation-play-state` não é herdada, então um valor no pai (ou `inherit` numa regra aninhada) nunca alcança elementos aninhados nem pseudo-elementos | O padrão de classe de body acima; ele atinge cada elemento e pseudo-elemento direto |

## Publicação (HostGator via FTP)

| Sintoma | Causa | Conserto |
|---|---|---|
| `curl` responde `530 Login incorrect` | Usuário ou senha errados no `hostgator.env` | O arquivo leva o login do cPanel, exatamente como o usuário entra no painel da HostGator; peça para ele conferir os dois campos e salvar de novo. Se a senha do painel foi trocada recentemente, o arquivo precisa da nova |
| A API do cPanel (porta 2083) não responde, mas o FTP funciona | A rede do usuário bloqueia a porta 2083 | Siga sem a API; nada da publicação depende dela. O recuo para limpeza de arquivos é o comando DELE do curl ou o Gerenciador de Arquivos do cPanel |
| No Windows, o comando de FTP quebra com erro estranho ou pede parâmetros | `curl` puro no PowerShell é apelido de outro comando | Chame `curl.exe` explicitamente, sempre |
| O upload conecta mas trava sem transferir | Firewall ou rede bloqueando o modo passivo de dados | Teste em outra rede primeiro; se persistir, o Gerenciador de Arquivos do cPanel (upload de zip + extrair) é o recuo honesto que funciona de qualquer rede |
| O site no ar mostra uma listagem de pastas ou 404 | Os arquivos subiram fora de `public_html`, ou aninhados numa subpasta | O `index.html` precisa estar direto em `public_html`; confira o caminho no script e a listagem com `--list-only` |
| O site no ar mostra a página "em construção" da HostGator | O `index.html` novo não sobrescreveu a página padrão, ou um arquivo padrão com prioridade sobrou | Confirme que o upload do `index.html` terminou sem erro; remova arquivos padrão restantes (`default.html`, pastas de exemplo) pelo Gerenciador de Arquivos do cPanel |
| O domínio não abre no navegador do usuário logo após o registro | DNS ainda propagando (minutos a horas, até 24 no limite) | Normal, não quebrado. Verifique você mesmo com `curl --resolve` contra o IP do servidor (Passo 4 de `publicacao.md`) e diga o prazo ao usuário com clareza |
| Aviso de segurança no navegador logo após a primeira publicação | O certificado HTTPS gratuito ainda está sendo emitido para o domínio novo | Espere alguns minutos e re-cheque; enquanto isso a versão `http://` já mostra o site. Não é um site quebrado |
| Imagens suaves no ar mas nítidas no local | A hospedagem redimensiona e recomprime imagens no servidor | Suba maior e mais limpo (uns 1920px, um passe de alta qualidade) para o passe da hospedagem ser o único com perda |
| Pré-visualizações de link sem imagem ou com URL errada | As og tags ainda carregam o marcador | Ajuste `og:image` e `og:url` com a URL absoluta do ar no comentário `<!-- DEPLOY STEP -->` e republique |
| O site no ar ainda mostra a versão antiga depois de republicar | Cache | Recarregue forçado, ou verifique contra uma frase que você sabe que mudou |
| Vídeos brutos ou arquivos de revisão aparecem no site no ar | Estavam dentro da pasta de publicação na hora de subir | Brutos, revisões, `hostgator.env` e scripts ficam FORA da pasta de publicação, sempre |
| Um arquivo renomeado continua no ar com o nome antigo | O script sobe e sobrescreve; não apaga | Apague o antigo com um comando DELE do curl ou pelo Gerenciador de Arquivos do cPanel (Passo 3 de `publicacao.md`) |
| Caracteres especiais viram lixo depois de um busca-e-troca de script (setas e ordinais viram mojibake) | Um comando de shell leu o arquivo UTF-8 com a codificação errada e gravou o estrago de volta | Nunca ajuste arquivos do site com leitura e escrita de shell puras: use a ferramenta de edição para o ajuste de og e qualquer mudança de texto, ou leia e escreva com UTF-8 explícito. Recuperação se já aconteceu: leia o arquivo danificado como UTF-8, encode esse texto para bytes Windows-1252, decode esses bytes como UTF-8, salve como UTF-8, confira os caracteres, republique |

## Configuração

| Sintoma | Causa | Conserto |
|---|---|---|
| O site parece congelado ou quebrado no painel de pré-visualização lateral do app | O painel embutido sofre com páginas de scroll-vídeo | Abra o link localhost num navegador real; essa é a pré-visualização verdadeira |
| Ferramentas do Higgsfield sumidas logo depois de conectar | Um conector recém-adicionado às vezes só carrega no próximo início do app | Feche o Claude Code por completo, reabra, volte ao mesmo chat, e verifique de novo |
| O conector do Higgsfield mostra que precisa de autenticação | O login não completou durante a adição | Termine no painel de conectores: o navegador abre no Higgsfield para autorizar uma vez, depois re-verifique com uma chamada de saldo |
| Ferramentas do Higgsfield presentes mas as chamadas falham | Conector adicionado mas não autorizado, ou sem créditos | Re-rode o fluxo de login; verifique com uma chamada de saldo, que deve retornar números reais |
| O usuário diz que um passo está pronto mas o passo seguinte falha | "Pronto" foi tomado como verificação | Nunca é; re-cheque o sistema você mesmo depois de cada passo antes de avançar |
| O Claude pula o checklist de configuração e vai direto às perguntas de marca ou design | O zip da skill nunca foi extraído e lido por completo (comum quando o zip foi arrastado para o chat: a pasta do projeto fica vazia e os arquivos da skill nunca entraram na conversa) | Extraia o zip para a pasta de trabalho, leia o SKILL.md e cada referência de cima a baixo, e recomece na Fase 1. A mensagem do checklist é sempre a primeira coisa que o usuário vê |

**A regra dos dois travamentos (a regra de subsistema, para qualquer ferramenta):** um segundo travamento consecutivo na mesma ferramenta ou subsistema significa que ele caiu. Pare de tentar, nomeie em voz alta, e reinicie. Nunca faça uma terceira chamada num subsistema travado. Isso é diferente de um render lento: um job que reporta progresso está trabalhando, por mais que demore; uma chamada que trava sem resposta nenhuma é a que esta regra cobre.
