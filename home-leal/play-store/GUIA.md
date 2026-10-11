# Publicar o Home Leal na Play Store

A app Android é criada a partir da app web publicada (tecnologia *Trusted Web Activity*,
gerada pelo PWABuilder). Não é preciso programar nem instalar nada no computador.

## Antes de começar
- [ ] App publicada na Vercel (ver `../README.md`) — vai precisar do endereço `https://….vercel.app`.
- [ ] Conta Google para a Play Console e cartão para pagar **25 USD (uma única vez)**.
- [ ] Recomendado: fazer os passos 2 a 5 num computador (também dá no telemóvel, mas é mais trabalhoso).

## 1. Criar a conta de programador Google Play
1. Abrir <https://play.google.com/console/signup>.
2. Escolher **Conta pessoal**, preencher os dados e pagar os 25 USD.
3. Concluir a **verificação de identidade** (documento de identificação). Pode demorar alguns dias.
4. Confirmar que tem um telemóvel Android associado (a Play Console pede isso).

## 2. Gerar o pacote Android no PWABuilder
1. Abrir <https://www.pwabuilder.com>, colar o endereço da Vercel e carregar em **Start**.
2. Carregar em **Package for stores** → **Android** → **Generate package**.
3. Em **Package ID** escrever, por exemplo, `com.leal.homeleal` (não poderá mudar depois).
   Deixar **Signing key: Create new**.
4. Descarregar o ZIP. Contém:
   - `Home Leal.aab` — o ficheiro a enviar para a Play Store;
   - `signing.keystore` e `signing-key-info.txt` — **a chave da app**;
   - `assetlinks.json` — ficheiro de verificação do domínio.

> 🔐 **Guarde `signing.keystore` e `signing-key-info.txt` num local seguro** (ex.: Google Drive privado).
> Sem eles não é possível publicar atualizações. **Nunca os envie para o GitHub nem para o chat.**

## 3. Criar a app na Play Console
1. **Criar app** → nome *Home Leal*, idioma *Português (Portugal)*, *App*, *Gratuita*.
2. Em **Conteúdo da app** preencher as declarações com as respostas de `FICHA-DA-LOJA.md`.
3. Em **Presença na loja** copiar os textos e carregar as imagens desta pasta.

## 4. Teste interno (Paulo e Ana)
1. **Testar e lançar → Testes → Teste interno → Testadores**: criar uma lista com os e-mails
   Google do Paulo e da Ana.
2. **Criar novo lançamento** → carregar o ficheiro `.aab` → **Guardar e publicar**.
3. Copiar o **link de participação** e abri-lo nos dois telemóveis → **Aceitar** → instalar pela Play Store.

O teste interno fica disponível em minutos e não exige revisão pública. A app não aparece a mais ninguém.

> Para publicar para **toda a gente**, as contas pessoais novas têm primeiro de fazer um
> **teste fechado com pelo menos 12 testadores durante 14 dias**. Para uso familiar, o teste interno basta.

## 5. Tirar a barra do navegador (verificação do domínio)
Sem este passo a app funciona, mas mostra uma barra com o endereço no topo.
1. Na Play Console: **Testar e lançar → Configuração → Integridade da app → Assinatura de apps**.
   Copiar a **impressão digital do certificado SHA-256** da *chave de assinatura da app*.
2. Enviar ao Claude:
   - o conteúdo do `assetlinks.json` do ZIP do PWABuilder;
   - a impressão digital SHA-256 copiada no passo anterior.

   (Estes dois dados são públicos — não são segredos.)
3. O Claude junta-os em `public/.well-known/assetlinks.json`. A Vercel publica automaticamente e,
   ao reabrir a app, a barra desaparece.
