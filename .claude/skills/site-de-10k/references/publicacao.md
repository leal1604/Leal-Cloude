# Publicação: O Fluxo HostGator (via FTP)

A HostGator não tem conector para o Claude Code, e não precisa: todo plano dela fala FTP, e o `curl` que já vem instalado no macOS e no Windows 10 em diante fala FTP também. Então a ponte é montada uma única vez, vira um script `publicar` de um comando, e dali em diante atualizar o site no ar custa uma frase. A ordem importa porque as og tags precisam da URL do ar antes de os arquivos subirem.

## A conversa honesta de custos (dê na configuração, repita antes de gastar; o item de hospedagem espera a Fase 10)

Conversa de dinheiro acontece ANTES de o dinheiro se mover, sempre:

- Uma imagem de hero custa cerca de 2 créditos nos padrões comprovados.
- Um vídeo de hero custa entre uns 10 e 55 créditos dependendo do modelo escolhido; consulte para números exatos. O conector oferece vários modelos, e as duas pontas dessa faixa são genuinamente de primeira linha. A escolha, e como apresentá-la com honestidade, está na seção de consulta de custos de `leis-de-prompt.md`.
- O preço exato de toda geração pode ser checado DE GRAÇA antes de gastar com `get_cost: true`. Consulte tudo: tomadas únicas, imagens de apoio e correntes inteiras. Apresente o total em palavras simples antes de gerar.
- Comece no teste gratuito do Higgsfield. Ele basta para construir um primeiro site de jornada única, com direito a uma repetição, e uma primeira construção real já embarcou só com créditos de teste. Um modelo de vídeo mais barato estica o teste ainda mais, de uma tomada para várias. Migre para um plano pago ao construir mais sites ou ir maior, e confira os planos atuais em higgsfield.ai em vez de confiar em número escrito aqui. Diga tudo isso com clareza para o usuário poder planejar.
- Hospedagem é separada, e este é o item que espera: ele pertence à Fase 10, no momento em que o usuário diz que quer o site no ar, nunca à configuração. Qualquer plano da HostGator com cPanel serve um site estático. Os planos de hospedagem de sites custam poucos reais por mês no período promocional e mais na renovação, e o plano anual costuma incluir o domínio grátis no primeiro ano. Confira o preço atual em hostgator.com.br em vez de confiar em número escrito aqui, e se o usuário chegou a esta skill por um vídeo, o link da descrição costuma carregar o melhor preço. Publicar e republicar não custam nada.

## Passo 1: Colete o acesso, do jeito mais fácil (primeira publicação apenas)

A ponte é montada agora, não na configuração, porque nada antes deste momento precisa dela. Se o arquivo de acesso e o script `publicar` já existem de uma publicação anterior, pule direto para o Passo 2.

**O caminho fácil, e o padrão desta skill: um arquivo só, com o login do cPanel.** Na HostGator, o usuário e a senha do cPanel são os mesmos da conta FTP padrão. Então em vez de fazer o usuário caçar dados de FTP, peça o que ele já tem na mão: o login do painel. Esse mesmo par resolve a publicação por FTP E ainda abre a API do cPanel para você (o bônus logo abaixo).

1. O usuário precisa de um plano ativo na HostGator (este é o momento do item de hospedagem da conversa de custos, se ainda não surgiu). Com a conta ativa, pergunte ao usuário só duas coisas, em uma pergunta clicável: o **domínio do site**, e o **endereço do servidor** (o nome tipo `br000.hostgator.com.br` que aparece no e-mail de boas-vindas da HostGator e no canto do cPanel; o e-mail de boas-vindas é o lugar mais fácil de achar). O nome do servidor tem uma vantagem real: funciona ANTES de o domínio propagar, então a primeira publicação nunca espera o DNS.
2. **Login e senha nunca passam pelo chat; vão direto para o arquivo.** Crie você mesmo um arquivo `hostgator.env` FORA da pasta de publicação (ao lado dela, junto da pasta de revisão), com este conteúdo:

```
HG_HOST=endereco-do-servidor
HG_USER=SEU_USUARIO_DO_CPANEL
HG_PASS=SUA_SENHA_DO_CPANEL
SITE_URL=https://www.seudominio.com.br
```

Preencha `HG_HOST` e `SITE_URL` com o que o usuário informou, e peça para ELE abrir o arquivo e trocar os dois marcadores pelo usuário e pela senha do cPanel (os mesmos com que ele entra no painel da HostGator), salvando em seguida. Diga em uma linha honesta o que esse arquivo é: a chave completa da hospedagem dele, guardada só no computador dele, que é o que permite você publicar e cuidar de tudo sem ele nunca abrir um painel. Dê uma confirmação clicável ("Preenchi, verifica aí"). No Mac e no Linux, rode `chmod 600` no arquivo. Esse arquivo nunca entra na pasta de publicação e nunca embarca.
3. **Verifique a ponte antes de subir qualquer coisa**, com uma listagem inofensiva:

```
curl --ssl -u "$HG_USER:$HG_PASS" "ftp://$HG_HOST/public_html/" --list-only
```

Uma lista de arquivos de volta (mesmo que só com os arquivos padrão da hospedagem) confirma servidor, usuário e senha de uma vez. Um erro 530 é login ou senha errados (o par do cPanel, digitado como no painel); a tabela de `solucao-de-problemas.md` cobre os outros. No Windows, chame `curl.exe`, nunca `curl` puro: no PowerShell, `curl` sozinho é um apelido para outro comando e quebra de formas confusas.

### O bônus do login do cPanel: a API

Com o par do cPanel no arquivo, você também fala com a API do cPanel direto, por HTTPS na porta 2083, e isso transforma você no administrador completo da hospedagem. Um exemplo que serve de dupla verificação (valida as credenciais E mostra o que existe em `public_html`):

```
curl -sS -u "$HG_USER:$HG_PASS" "https://$HG_HOST:2083/execute/Fileman/list_files?dir=public_html"
```

Usos que valem a pena quando a situação pedir: listar e limpar os arquivos padrão de "em construção" que a HostGator deixa, conferir o estado do certificado HTTPS em vez de só esperar, e checar espaço em disco. Duas regras: a publicação em si continua sendo o FTP do Passo 3 (a API é apoio, não o caminho principal), e se a porta 2083 estiver bloqueada na rede do usuário, siga em frente sem a API, porque nada da publicação depende dela.

## Passo 2: Acerte o endereço, depois ajuste as og tags

Primeiro, onde o site vai viver? O domínio registrado junto do plano anual já aponta sozinho para a hospedagem; nada a configurar. Confirme o endereço com o usuário em uma pergunta clicável (com e sem `www` são o mesmo site na HostGator; proponha a forma com `www` como canônica ou a que o usuário preferir).

Depois ajuste as tags. `og:image` e `og:url` precisam de URLs absolutas. Encontre o comentário `<!-- DEPLOY STEP -->` deixado na construção e ajuste as duas com a URL do ar escolhida. Faça isso ANTES de subir os arquivos, ou a página embarcada carrega tags de pré-visualização mortas.

Ajuste com a ferramenta de edição, nunca com um comando de shell de uma linha. Um busca-e-troca de script pode ler o arquivo UTF-8 com a codificação errada e destruir cada caractere especial da página. A recuperação, se acontecer mesmo assim, está em `solucao-de-problemas.md`.

## Passo 3: Monte o script `publicar` (uma vez), depois publique

O site é uma pasta de arquivos estáticos, e publicar é subir essa pasta para `public_html` no servidor. Escreva o script uma vez; toda publicação dali em diante é um comando.

**Mac e Linux**, `publicar.sh`, ao lado da pasta de publicação (ajuste `DEPLOY` para o nome real da pasta):

```bash
#!/bin/bash
set -e
source "$(dirname "$0")/hostgator.env"
DEPLOY="$(dirname "$0")/site"
cd "$DEPLOY"
find . -type f | while read -r f; do
  remote="${f#./}"
  echo "subindo $remote"
  curl -sS --ssl --ftp-create-dirs -u "$HG_USER:$HG_PASS" \
    -T "$f" "ftp://$HG_HOST/public_html/$remote"
done
echo "publicado em $SITE_URL"
```

**Windows**, `publicar.ps1`:

```powershell
Get-Content "$PSScriptRoot\hostgator.env" | ForEach-Object {
  if ($_ -match '=') { $k, $v = $_ -split '=', 2; Set-Variable -Name $k -Value $v }
}
$deploy = "$PSScriptRoot\site"
Get-ChildItem $deploy -Recurse -File | ForEach-Object {
  $remote = $_.FullName.Substring($deploy.Length + 1) -replace '\\','/'
  Write-Host "subindo $remote"
  curl.exe -sS --ssl --ftp-create-dirs -u "${HG_USER}:${HG_PASS}" `
    -T $_.FullName "ftp://$HG_HOST/public_html/$remote"
}
Write-Host "publicado em $SITE_URL"
```

As regras do script:

- `--ftp-create-dirs` cria `assets/` e qualquer subpasta no servidor sozinho.
- `--ssl` pede conexão cifrada quando o servidor oferece e segue sem quando não; nunca trava a publicação por causa de certificado. Se quiser exigir cifra, `--ssl-reqd` é o upgrade, e se ele falhar por certificado o recuo honesto é voltar ao `--ssl`.
- No Mac, se `lftp` estiver instalado (`brew install lftp`), ele é um motor melhor para sites com muitos arquivos, com um espelhamento de verdade: `lftp -u "$HG_USER","$HG_PASS" -e "set ftp:ssl-allow true; mirror -R '$DEPLOY' /public_html; quit" "$HG_HOST"`. Opcional, nunca obrigatório: o caminho do curl funciona em toda máquina sem instalar nada.
- O `index.html` novo sobrescreve a página padrão "em construção" que a HostGator deixa em `public_html`. Se sobrarem arquivos padrão com outros nomes (um `default.html`, uma pasta de exemplo), eles são inofensivos, mas podem ser removidos pelo Gerenciador de Arquivos do cPanel para deixar a casa limpa.
- Um vídeo de hero de vários MB leva alguns segundos para subir. Não é instantâneo, e isso é normal; avise na primeira publicação.
- O script sobe e sobrescreve; ele não apaga. Quando um arquivo for renomeado ou removido do site, apague o antigo do servidor (um `curl --ssl -u "$HG_USER:$HG_PASS" "ftp://$HG_HOST/public_html/" -Q "DELE public_html/nome-antigo.jpg"` resolve, ou a API do cPanel do Passo 1, ou o Gerenciador de Arquivos), senão o arquivo morto continua no ar.

Rode o script, leia a saída, e confirme que cada arquivo subiu sem erro antes de declarar qualquer coisa.

## Passo 4: Verifique o site no ar você mesmo (antes de dizer ao usuário que está pronto)

- A página carrega por HTTPS com um 200: `curl -sSI "$SITE_URL"` e leia a primeira linha.
- A URL do vídeo em si serve (busque direto): `curl -sSI "$SITE_URL/assets/hero-scrub.mp4"`.
- O console do navegador está limpo na URL do ar.
- Faça o scrub do hero no site no ar: a busca por Blob faz o seek funcionar mesmo sem suporte a Range no servidor, mas confirme.

**Um domínio novo tem uma janela de assentamento, em duas camadas.** Primeiro o DNS: um domínio recém-registrado pode levar de minutos a algumas horas para propagar (até 24 no limite), e nesse meio tempo o endereço não abre na máquina do usuário. Isso não trava a verificação: teste através do nome do servidor com `curl --resolve "www.seudominio.com.br:443:IP-DO-SERVIDOR" "$SITE_URL"` (o IP aparece no cPanel e no e-mail de boas-vindas), que conversa com o servidor certo antes de o mundo saber o endereço. Segundo o cadeado: o certificado HTTPS gratuito da HostGator é emitido sozinho depois que o domínio aponta, e pode levar de minutos a algumas horas na primeira vez. Um aviso de segurança logo após a primeira publicação é o certificado sendo emitido, não um site quebrado. Diga isso ao usuário com clareza, espere, e re-verifique antes de declarar pronto. Enquanto o cadeado não sai, a versão `http://` já mostra o site inteiro funcionando.

## Passo 5: Os recibos de velocidade (meça, depois apresente)

Logo após a verificação no ar, meça o site publicado e registre os números. Eles são a prova de que o site é rápido, e o usuário vai precisar deles. Meça na URL do ar:

- **Peso total da página sem o vídeo.** Uma construção saudável fica nas dezenas de KB.
- **Tempo de carregamento da página.** Uma construção saudável carrega bem abaixo de um segundo.
- **O tamanho do vídeo e o tempo de chegada atrás do anel de carregamento.** Uma tomada única chega em poucos segundos numa conexão comum; uma jornada encadeada leva mais. Tudo isso com a página já completamente usável.

**Como medir, concretamente.** Duas opções prontas:

- Cronometragem com curl na URL do ar: `curl -s -o /dev/null -w "TTFB %{time_starttransfer}s, total %{time_total}s, %{size_download} bytes\n" https://a-url-do-ar/` (no Windows chame `curl.exe`, e `-o NUL` também funciona). Rode contra a página e contra a URL do vídeo para os tamanhos e tempos.
- Ou abra a URL do ar pela ferramenta de navegador e leia a cronometragem de navegação: `performance.getEntriesByType('navigation')[0].loadEventEnd` para o tempo de carga, e `performance.getEntriesByType('resource')` para o `transferSize` de cada arquivo.

Só medições reais. Nunca apresente uma estimativa como recibo.

Apresente os números ao usuário junto com o argumento estrutural, porque juntos eles respondem a objeção número um a sites cinematográficos ("bonito, mas deve ser lento, deve ter um backend ruim"): estes sites são arquivos estáticos puros. Sem framework, sem build, sem código de servidor, então não existe backend para ser ruim. O vídeo chega por trás de um pôster e de um anel de progresso honesto, e telas pequenas nunca baixam a versão pesada. Registre os números para o usuário poder citar ao próprio cliente.

## Passo 6: O teste do usuário no aparelho real

Peça para o usuário testar o site no ar no desktop E no celular, na rede real, não só no localhost. Peça para checar o scroll no topo e no fim do hero especificamente, no Chrome, onde engasgos aparecem primeiro. Os olhos e o hardware dele pegam o que auditorias não pegam.

## Passo 7: Iterar é barato

Mude os arquivos e rode o `publicar`. Um comando. Não tema rodadas de polimento; o loop custa um minuto. Re-verifique a página no ar depois de cada publicação (um cache velho pode mostrar a versão antiga; recarregue forçado ou confira uma frase que você sabe que mudou).
