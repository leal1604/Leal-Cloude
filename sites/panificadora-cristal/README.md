# Panificadora Cristal: site

Site estático de 5 páginas (HTML, CSS e JavaScript puros, sem build), com a página inicial seguindo o layout de `../referencia-home.png`.

- `index.html`: Início
- `cardapio.html`: Cardápio (pães, bolos e tortas, salgados e lanches, doces, café e bebidas, almoço e sopas)
- `encomendas.html`: Encomendas, com formulário de pedido
- `historia.html`: Nossa História (desde 1998, linha do tempo, avaliações, galeria)
- `contato.html`: Contato e mapa

Para ver: abra `index.html` no navegador, ou rode `python3 -m http.server` nesta pasta e acesse `http://localhost:8000`.

**WhatsApp:** preencha `var WHATSAPP = '';` em `assets/js/site.js` (ex.: `'5584999999999'`). Enquanto estiver vazio, os botões de WhatsApp ligam para (84) 3213-3695 e o formulário monta e copia o pedido.
