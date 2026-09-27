# Panificadora Cristal — protótipo de site

Site estático (HTML + CSS + JS, sem build) criado a partir da análise de presença digital da Panificadora Cristal (Natal/RN) e dos prints do Instagram @panificadoracristalnatal.

- `index.html` — site da padaria: início, cardápio em abas, almoço, encomendas, sobre nós, avaliações, galeria e contato com mapa.
- `analise.html` — relatório completo: resumo, presença digital, auditoria do Instagram, oportunidades, estrutura, argumento comercial, pontos a confirmar e fontes.
- `fontes/` — PDF original da análise e os prints do Instagram usados como fonte.
- `img/` — fotos e logotipo recortados dos prints do Instagram da própria empresa.

## Como abrir

Abra `index.html` no navegador ou sirva a pasta: `python3 -m http.server` e acesse `http://localhost:8000`.

## Antes de publicar

- **WhatsApp:** preencha `data-whatsapp="55849XXXXXXXX"` no `<form id="form-encomenda">` de `index.html`. Sem o número, o formulário copia o pedido e oferece a ligação para (84) 3213-3695.
- **Cardápio e preços:** só pão francês, bolo meio a meio e almoço com saladas (marcados com ◆) estão confirmados pelo Instagram; o restante é estrutura sugerida.
- **Horário, Facebook, delivery, fotos autorizadas e logotipo em alta** — ver a seção 7 de `analise.html`.
