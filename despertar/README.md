# Despertar

Despertador para o telemóvel, feito como app web instalável (PWA). Sem dependências nem passo de build: são ficheiros estáticos.

- `index.html`: landing page.
- `app.html`: a app (alarmes, histórico, ajustes).
- `manifest.webmanifest`, `sw.js`, ícones: instalação no ecrã principal e funcionamento sem rede.

## O que a app faz

- Alarmes com hora, nome, dias da semana (ou só uma vez), toque, tempo e número máximo de adiamentos.
- Quatro toques gerados no próprio navegador (Aurora, Sino, Pássaros, Clássico), com subida gradual de volume em 45 s.
- Para desligar, mantém-se o botão premido 1,2 s ou resolve-se uma soma.
- Histórico: hora prevista, hora a que se levantou, adiamentos, sequência de dias e gráfico dos últimos 14 dias. Um alarme que toca 10 minutos sem resposta fica registado como «sem resposta».
- Modo cabeceira: relógio escuro com o ecrã sempre ligado (Wake Lock).
- Backup em `despertar-backup.json` com o formato `{ "name", "alarms", "history" }`. Importa-se em Ajustes → Importar ficheiro (ou colando o texto).

## Limitação

Uma app web só toca enquanto está aberta. Os navegadores não acordam um telemóvel com a app fechada. Por isso a app explica que deve ficar aberta no modo cabeceira, com o telemóvel a carregar.

## Executar localmente

```bash
cd despertar
npx http-server -p 8080
```

Abrir <http://localhost:8080>. O service worker só é registado em HTTPS (ou seja, depois de publicado).

## Publicar

Qualquer alojamento estático serve (Vercel, Netlify, GitHub Pages). No Vercel: importar o repositório e escolher `despertar` como **Root Directory**, sem framework.
No Android: abrir o endereço no Chrome → menu ⋮ → **Adicionar ao ecrã principal**.

## Ícones

`node scripts/make-icons.mjs` gera `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` a partir de `icon.svg` (requer Playwright).
