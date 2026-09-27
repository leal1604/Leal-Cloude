# Panificadora Cristal: site de scroll cinematográfico

Feito com a skill Site de 10K (`.claude/skills/site-de-10k`). HTML, CSS e JavaScript puros, sem build. O pacote de design fica em `../pacote-de-design-cristal.md`, fora da pasta de publicação.

- `index.html`: site da padaria. O vídeo do forno avança conforme a pessoa rola a página e termina nos pães, com o título "Queeeeem quer pão?". Depois vêm as seções: prova, a fornada (segure para assar), cardápio, almoço, clientes, como encomendar, perguntas, formulário de encomenda e contato.
- `analise.html`: análise de presença digital completa, com a pesquisa de clientes e todas as fontes.
- `assets/hero-scrub.mp4`: vídeo do topo (1910x1080, keyframe a cada 8 quadros, sem áudio). `hero-poster.jpg` e `hero-ending.jpg` são o primeiro e o último quadro.
- `assets/fontes/`: PDF original e prints do Instagram.

## Pré-visualizar

O vídeo precisa de um servidor local (o navegador bloqueia o carregamento por `file://`):

```
cd sites/panificadora-cristal
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Com dois cliques no `index.html`, aparece a versão com imagem parada, que também é a versão de celular.

## Antes de publicar

- **WhatsApp:** preencha `data-whatsapp="55849XXXXXXXX"` no `<form id="form-encomenda">`. Sem o número, o formulário monta o pedido, copia e orienta a ligar para (84) 3213-3695.
- **og:url e og:image:** trocar `SEU-DOMINIO` pelo endereço do ar (comentário `DEPLOY STEP` no `index.html`).
- **Imagens:** o vídeo e o quadro do forno foram gerados por IA como ilustração; trocar por fotos da Cristal quando chegarem.
- **Cardápio, preços, horário e delivery:** ver a seção 7 de `analise.html`.
