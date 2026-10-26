# Landing page do ebook

Página de vendas em um único arquivo (`index.html`), sem build e sem dependências.

| Arquivo | O que é |
|---|---|
| `index.html` | A landing page |
| `privacidade.html`, `termos.html` | Modelos de Política de Privacidade e Termos de Uso |
| `favicon.svg` | Ícone da aba do navegador |
| `og-image.png` | Imagem que aparece ao compartilhar o link (1200×630) |

## O que trocar

1. **Textos:** tudo que está entre `[COLCHETES]` aparece com fundo amarelo na página. Procure por `[` no `index.html` e troque. Depois de trocar, apague o `<span class="ph">` que envolve o texto (ou deixe: só some o fundo amarelo quando você apagar).
2. **Link de compra, WhatsApp, e-mail e Instagram:** no final do `index.html`, no bloco `CONFIGURAÇÃO`:
   ```js
   const LINK_DE_COMPRA = "https://pay.hotmart.com/XXXX";
   const WHATSAPP = "5511999999999";
   const EMAIL = "contato@seusite.com.br";
   const INSTAGRAM = "https://instagram.com/seuperfil";
   ```
   Todos os botões “Quero o ebook” passam a usar o mesmo link. Campo vazio = o link some da página.
3. **Preço:** procure `[R$ PREÇO]`. A barra fixa do celular copia esse valor sozinha.
4. **Capa:** coloque `capa.jpg` na pasta e siga o comentário logo acima de `<div class="book"`.
5. **Depoimentos:** use só depoimentos reais. Coloque as fotos como `depoimento-1.jpg`, `depoimento-2.jpg`, `depoimento-3.jpg`. Sem depoimentos, apague a seção marcada com `<!-- 6. PROVA SOCIAL`.
6. **Cores:** no topo do `<style>`, em `:root` (`--accent` é a cor dos botões).
7. **SEO:** `<title>`, `description` e `og:` no topo do `index.html`.

## Publicar na HostGator

1. Entre no **Portal do Cliente HostGator** e abra o **cPanel**.
2. Abra o **Gerenciador de Arquivos** e entre em **`public_html`**.
   - Página no domínio principal (`seusite.com.br`): use `public_html` direto. Se já existir um `index.html` ou `index.php` lá, renomeie para `index-antigo.html` antes.
   - Página numa subpasta (`seusite.com.br/ebook`): crie a pasta `ebook` dentro de `public_html` e entre nela.
3. Clique em **Carregar** e envie `ebook-landing.zip`.
4. Volte, clique com o botão direito no `.zip`, escolha **Extract** e confirme. Depois apague o `.zip`.
5. Em **cPanel → Domínios → SSL/TLS Status**, confirme que o domínio tem SSL ativo (o AutoSSL da HostGator é gratuito) para o site abrir com `https://`.

Para atualizar depois: edite o arquivo no próprio Gerenciador de Arquivos (botão direito → **Edit**) ou envie o `index.html` novo por cima.
