# World Pets

**Cuidados e escolhas inteligentes para cães e gatos em Portugal.**

Blog de guias práticos e comparações para quem vive com animais em Portugal, muitas vezes num apartamento. Monetização por links de afiliado da **Amazon.es** (Programa de Afiliados da Amazon de Espanha), com produtos que entregam em Portugal.

## O que já está feito

| Página | Ficheiro |
|---|---|
| Página inicial (carta de apresentação, como escolhemos, índice dos guias, aviso de comissão) | `index.html` |
| Guia 1: Como escolher um arranhador para um apartamento pequeno | `guias/arranhador-apartamento-pequeno.html` |
| Guia 2: Transportadoras para gatos: tamanho, abertura e limpeza | `guias/transportadoras-para-gatos.html` |
| Guia 3: Camas laváveis para cães: o que comparar antes de comprar | `guias/camas-lavaveis-para-caes.html` |
| Guia 4: Como reduzir a areia espalhada pela casa | `guias/areia-espalhada-pela-casa.html` |
| Links de afiliado e transparência | `transparencia.html` |
| Sobre | `sobre.html` |
| Privacidade | `privacidade.html` |

Site estático (HTML e CSS). Funciona em qualquer alojamento: HostGator (pasta no cPanel), Netlify, GitHub Pages, etc.

### Como os links de afiliado estão claros
- Aviso no topo de **cada guia**, antes de qualquer link.
- Frase oficial da Amazon no rodapé de **todas as páginas**, em português e na formulação original em espanhol exigida pelo programa da Amazon.es.
- Página própria de transparência e uma frase grande na página inicial: "Se comprar pela Amazon através dos nossos links, recebemos uma comissão. O preço para si é o mesmo."
- Todos os links para a Amazon têm `rel="sponsored nofollow"`.
- Cada guia diz no topo **como foi feito**: os 4 guias atuais estão marcados como "Pesquisa e comparação de características. Não testámos estes produtos em casa."

### Como ativar o ID de afiliado
1. Quando a conta Amazon Afiliados (afiliados.amazon.es) estiver criada, copie o seu ID (ex.: `worldpets-21`).
2. Abra `assets/js/afiliados.js` e escreva-o em `const AMAZON_TAG = '';`
3. Volte a publicar o site. Todos os links passam a levar o ID.

Os links atuais são **pesquisas na Amazon.es** (permitidas pelo programa). Mais tarde podem ser trocados por produtos concretos.

### Regras da Amazon a respeitar
- **Imagens de produtos:** não descarregar fotos da Amazon. Só pela API da Amazon (PA-API / Creators API), que é liberada depois das primeiras vendas. Até lá: fotos próprias ou nenhuma.
- **Preços:** os guias não mostram preços. Se vier a mostrar, têm de vir da API e ter data e hora.
- **Compras próprias** não contam e são proibidas.

## Editar ou criar guias
O conteúdo dos guias e das páginas institucionais está em `tools/gerar.py`. Para alterar ou criar um guia novo, edite esse ficheiro e corra, dentro da pasta `worldpets/`:

```
python3 tools/gerar.py
```

Depois acrescente o guia novo à tabela "Os guias" em `index.html`.

## Por preencher antes de publicar
- **E-mail de contacto:** aparece como espaço a preencher em Sobre, Transparência e Privacidade (procure `e-mail de contacto a definir` em `tools/gerar.py`).
- **Fotografia da página inicial:** é provisória (um gato do Wikimedia Commons, com crédito no rodapé). Troque por uma foto vossa em `assets/img/` e atualize `index.html`.
- **Domínio:** ainda não definido. Depois de escolhido, criar `sitemap.xml` e `robots.txt`.
- **Promessa editorial:** a página de transparência diz "Não mostramos produtos que achamos maus por darem comissão" e "Não inventamos opiniões nem testes que não fizemos". Confirme que concorda.

## Plano de 90 dias

| Etapa | O que fazer |
|---|---|
| Definir o foco | Acessórios para cães e gatos em apartamentos: higiene, descanso, brincadeira e transporte. |
| Publicar conteúdo útil | Chegar a 12–15 guias originais antes de pedir a revisão da Amazon (já existem 4). |
| Adicionar afiliação | Inscrever o site na Amazon.es quando já houver conteúdo e divulgação. A revisão pede **3 vendas qualificadas nos primeiros 180 dias**; como regra geral, pelo menos 10 publicações originais e conteúdo recente. |
| Medir resultados | Visitas, cliques para a Amazon, compras qualificadas e comissão por guia (relatórios da Amazon + estatísticas do site). |
| Expandir | Outro país só quando houver guias e categorias com vendas consistentes. |

### Próximos guias (ideias a validar com pesquisa de procura)
5. Fontes de água para gatos: vale a pena?
6. Trela, peitoral ou coleira: o que usar em passeios na cidade
7. Brinquedos para gatos que ficam sozinhos em casa
8. Cortar as unhas ao cão em casa: o que é preciso
9. Escovas para cães e gatos que largam muito pelo
10. Comedouros lentos: para que servem e para que cães
11. Como proteger o sofá do pelo e das unhas
12. Caixas de areia para dois gatos num apartamento
13. Brinquedos para cães que ficam sozinhos em casa
14. Viajar de carro com o cão: o que levar
15. Tapetes higiénicos para cachorros num apartamento

### Diferencial
Fotos próprias, comparações claras e experiência real sempre que possível. Quando não houver teste, o guia diz que é pesquisa e comparação de características.

### Conta de ganhos (ilustrativa, não é previsão)
10 000 visitas/mês × 15% de cliques para a Amazon × 5% de conversão = 75 compras.
75 × €40 de valor elegível médio × 5% de comissão hipotética = **€150/mês**.
As percentagens são ilustrativas e não correspondem a taxas confirmadas de nenhuma categoria.

## Design
Feito com a skill Hallmark, tema Grid: papel branco, tinta azul-escura, tipos Radio Canada Big e Radio Canada, um azul ultramarino para secções e um vermelho suíço para o aviso de comissão.
