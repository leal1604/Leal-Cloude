# DESPERTAR

> Pare de procrastinar. Comece a agir.

App web instalável (PWA) para transformar tarefas em ação: tarefas, sessões de foco, modo compromisso, metas, lembretes, sequência de dias, XP, níveis, conquistas e estatísticas. São ficheiros estáticos, sem dependências nem passo de build.

Disponível em três idiomas: **português do Brasil**, **português de Portugal** e **inglês**. Na primeira visita o idioma vem do aparelho; depois muda-se no seletor (landing: BR · PT · EN; app: Ajustes → Idioma). A escolha fica guardada e é partilhada entre a landing e o app.

- `index.html`: landing page (conteúdo e secções da versão original, refeitos).
- `app.html`: o app.
- `manifest.webmanifest`, `sw.js`, ícones: instalação no ecrã inicial e funcionamento sem rede.

## Como funciona o app

1. **Escolha**: crie uma tarefa e a duração da sessão (10 a 90 min ou personalizada), ligada ou não a uma meta.
2. **Desperte**: comece a sessão. Com o **modo compromisso**: ecrã inteiro e sempre ligado, sem pausa, o botão CONCLUIR só fica disponível no fim, cada saída do app é registada e desistir exige segurar o botão 3 s.
3. **Faça**: contagem regressiva, progresso e mensagens de foco.
4. **Conclua**: ganha XP (10 + 1 por minuto de foco, +10 no modo compromisso sem saídas), sobe de nível e desbloqueia conquistas.

Lembretes por hora e dia da semana podem abrir diretamente a sessão de uma tarefa.

## Backup

Ajustes → Backup gera `despertar-backup.json` com `name`, `alarms` (lembretes), `history`, `tasks`, `goals` e `settings`. A importação aceita também ficheiros só com `name`, `alarms` e `history`.

## Limitações

- O app corre no navegador: não consegue bloquear outros apps, e os lembretes só tocam com o app aberto.
- Os dados ficam no aparelho (localStorage); para mudar de telemóvel use o backup.

## Executar localmente

```bash
cd despertar
npx http-server -p 8080
```

Abrir <http://localhost:8080>. O service worker só é registado em HTTPS.

## Publicar

Qualquer alojamento estático serve (Vercel, Netlify, GitHub Pages). No Vercel: importar o repositório e escolher `despertar` como **Root Directory**, sem framework.

## Ícones

`node scripts/make-icons.mjs` gera `icon-192.png`, `icon-512.png` e `icon-maskable-512.png` a partir de `icon.svg` (requer Playwright).
