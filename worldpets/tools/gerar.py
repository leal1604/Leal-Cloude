"""Gera as páginas dos guias e as páginas institucionais do World Pets.

Uso: python3 tools/gerar.py   (a partir da pasta worldpets/)

O conteúdo de cada página está neste ficheiro. Para criar um guia novo, acrescente
uma entrada a GUIAS e corra o script outra vez. Os links da Amazon.es usam
data-amazon; o tag de afiliado é posto por assets/js/afiliados.js.
"""
from pathlib import Path
from urllib.parse import quote_plus

RAIZ = Path(__file__).resolve().parent.parent
ATUALIZADO = "28 de novembro de 2026"


def amazon(pesquisa, texto):
    url = "https://www.amazon.es/s?k=" + quote_plus(pesquisa)
    return f'<a href="{url}" data-amazon rel="sponsored nofollow noopener" target="_blank">{texto}</a>'


def nav(prefixo, atual=""):
    def item(href, nome, chave):
        cur = ' aria-current="page"' if chave == atual else ""
        return f'<li><a href="{href}"{cur}>{nome}</a></li>'
    return f"""  <a class="skip" href="#conteudo">Saltar para o conteúdo</a>

  <header class="nav">
    <div class="container nav__row">
      <a class="wordmark" href="{prefixo}index.html" aria-label="World Pets, página inicial"><b>World</b><span>Pets</span></a>
      <nav aria-label="Principal">
        <ul class="nav__links">
          {item(prefixo + "index.html#guias", "Guias", "guias")}
          {item(prefixo + "index.html#como-escolhemos", "Como escolhemos", "como")}
          {item(prefixo + "transparencia.html", "Links de afiliado", "transparencia")}
          {item(prefixo + "sobre.html", "Sobre", "sobre")}
        </ul>
      </nav>
    </div>
  </header>"""


def rodape(prefixo):
    return f"""  <footer class="footer">
    <div class="container cols">
      <div class="footer__close">
        <p>Até ao próximo guia.</p>
        <p>A equipa World Pets, Portugal</p>
      </div>
      <ul class="footer__links">
        <li><a href="{prefixo}index.html#guias">Guias</a></li>
        <li><a href="{prefixo}sobre.html">Sobre</a></li>
        <li><a href="{prefixo}transparencia.html">Links de afiliado</a></li>
        <li><a href="{prefixo}privacidade.html">Privacidade</a></li>
      </ul>
      <div class="footer__legal">
        <p>Enquanto Afiliado da Amazon, o World Pets obtém rendimentos com as compras elegíveis. En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.</p>
      </div>
    </div>
  </footer>
  <script src="{prefixo}assets/js/afiliados.js" defer></script>"""


def pagina(titulo, descricao, prefixo, corpo, atual=""):
    return f"""<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{titulo} | World Pets</title>
  <meta name="description" content="{descricao}">
  <meta name="theme-color" content="#f7f6f2">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Radio+Canada+Big:wght@400;700&family=Radio+Canada:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{prefixo}assets/css/site.css">
  <link rel="icon" href="{prefixo}assets/favicon.svg" type="image/svg+xml">
</head>
<body>
{nav(prefixo, atual)}

  <main id="conteudo">
{corpo}
  </main>

{rodape(prefixo)}
</body>
</html>
"""


AVISO = """    <aside class="disclosure" aria-label="Aviso de links de afiliado">
      <div class="container disclosure__row">
        <strong>Links de afiliado</strong>
        <p>Este guia tem links para a Amazon.es. Se comprar através deles, o World Pets pode receber uma comissão, sem custo extra para si. Preços e entrega para Portugal mudam com frequência: confirme sempre na página do produto. <a class="link" href="../transparencia.html">Como funcionam os links de afiliado</a></p>
      </div>
    </aside>"""


def guia(g, todos):
    seccoes = g["seccoes"]
    toc = "\n".join(f'          <li><a href="#{s[0]}">{s[1]}</a></li>' for s in seccoes)
    prosa = "\n".join(
        f'        <h2 id="{s[0]}">{s[1]}</h2>\n{s[2]}' for s in seccoes
    )
    outros = "\n".join(
        f'          <li><a href="{o["slug"]}.html">{o["titulo"]}</a></li>'
        for o in todos if o["slug"] != g["slug"]
    )
    corpo = f"""    <header class="doc__head">
      <div class="container cols">
        <div class="doc__title">
          <h1>{g["titulo"]}</h1>
          <p class="lead">{g["lead"]}</p>
        </div>
        <dl class="doc__meta">
          <div><dt>Para</dt><dd>{g["para"]}</dd></div>
          <div><dt>Tipo</dt><dd>{g["tipo"]}</dd></div>
          <div><dt>Como fizemos este guia</dt><dd>{g["metodo"]}</dd></div>
          <div><dt>Atualizado</dt><dd><time datetime="2026-11-28">{ATUALIZADO}</time></dd></div>
        </dl>
      </div>
    </header>

{AVISO}

    <article class="doc__body">
      <div class="container cols">
        <nav class="toc" aria-label="Neste guia">
          <p>Neste guia</p>
          <ol>
{toc}
          </ol>
        </nav>
        <div class="prose">
{g["intro"]}
{prosa}
        </div>
      </div>
    </article>

    <section class="more" aria-labelledby="mais">
      <div class="container cols">
        <h2 id="mais">Outros guias</h2>
        <ul>
{outros}
        </ul>
      </div>
    </section>"""
    return pagina(g["titulo"], g["descricao"], "../", corpo, "guias")


METODO_PESQUISA = "Pesquisa e comparação de características. Não testámos estes produtos em casa."

GUIAS = [
    {
        "slug": "arranhador-apartamento-pequeno",
        "titulo": "Como escolher um arranhador para um apartamento pequeno",
        "descricao": "Postes, arranhadores de cartão, de parede ou árvores compactas: o que comparar para um gato num apartamento pequeno em Portugal.",
        "lead": "Altura, estabilidade e material contam mais do que o tamanho da árvore.",
        "para": "Gatos",
        "tipo": "Guia de compra",
        "metodo": METODO_PESQUISA,
        "intro": """          <p>Arranhar é uma necessidade do gato, não um mau hábito. Serve para tratar as unhas, esticar o corpo e deixar o cheiro no território. Se não tiver um sítio certo para isso, o sofá ou a porta passam a ser esse sítio. Num apartamento pequeno a questão é escolher um arranhador que o gato use e que caiba na casa.</p>""",
        "seccoes": [
            ("tipos", "Quatro tipos para casas pequenas", """          <ul>
            <li><strong>Poste vertical de sisal:</strong> ocupa pouco chão e permite ao gato esticar-se de pé.</li>
            <li><strong>Arranhador de cartão:</strong> fica no chão, é barato e muitos gatos gostam de arranhar na horizontal.</li>
            <li><strong>Arranhador de parede ou de canto:</strong> fixa-se à parede ou protege a esquina do sofá, sem ocupar chão.</li>
            <li><strong>Árvore compacta:</strong> junta poste, plataforma e esconderijo numa base pequena, para gatos que gostam de subir.</li>
          </ul>
          <div class="table-wrap">
            <table class="compare">
              <caption>Comparação dos tipos de arranhador</caption>
              <thead><tr><th scope="col">Tipo</th><th scope="col">Espaço no chão</th><th scope="col">Arranha</th><th scope="col">Bom para</th></tr></thead>
              <tbody>
                <tr><th scope="row">Poste de sisal</th><td>Pouco</td><td>Na vertical</td><td>Gatos que arranham o sofá de pé</td></tr>
                <tr><th scope="row">Cartão</th><td>Pouco</td><td>Na horizontal</td><td>Gatos que arranham tapetes; trocar com frequência</td></tr>
                <tr><th scope="row">Parede ou canto</th><td>Nenhum</td><td>Na vertical</td><td>Proteger uma esquina concreta</td></tr>
                <tr><th scope="row">Árvore compacta</th><td>Médio</td><td>Na vertical</td><td>Gatos jovens e ativos que gostam de altura</td></tr>
              </tbody>
            </table>
          </div>"""),
            ("medidas", "As medidas que mais contam", """          <p><strong>Altura:</strong> o gato deve conseguir esticar-se por completo sem chegar ao topo do poste. Um gato adulto esticado mede muitas vezes 70 a 90 cm; meça o seu e escolha um poste pelo menos desse tamanho.</p>
          <p><strong>Estabilidade:</strong> um poste que abana quando o gato puxa deixa de ser usado. Procure uma base larga e pesada, ou um modelo que se possa fixar à parede. Nas opiniões dos compradores, procure referências a ser estável ou a tombar.</p>
          <p><strong>Material:</strong> a corda de sisal é a mais resistente. O tecido de sisal é mais suave e alguns gatos preferem. O cartão gasta-se depressa, mas as recargas são baratas.</p>"""),
            ("onde", "Onde o pôr", """          <p>O sítio conta tanto como o modelo. Os gatos costumam arranhar ao acordar e perto das zonas de passagem, por isso funcionam bem estes lugares:</p>
          <ul>
            <li>junto ao sítio onde o gato dorme;</li>
            <li>ao lado do móvel que ele já arranha;</li>
            <li>perto da entrada da sala, onde passa muitas vezes.</li>
          </ul>
          <p>Para o habituar, recompense-o quando o usar e esfregue erva-gateira no arranhador. Evite pegar nas patas e forçar o gesto.</p>"""),
            ("comprar", "Antes de comprar na Amazon.es", """          <ul>
            <li>Confirme a altura útil do poste, não a altura total com a base.</li>
            <li>Veja o diâmetro e o peso da base.</li>
            <li>Confirme que o vendedor envia para Portugal e quanto custa a entrega.</li>
            <li>Veja a política de devolução, útil se o gato não lhe ligar.</li>
          </ul>
          <div class="shop">
            <h3>Ver opções na Amazon.es</h3>
            <ul>
              <li>""" + amazon("poste arranhador gato sisal alto", "Postes de sisal para gatos") + """</li>
              <li>""" + amazon("rascador carton gato", "Arranhadores de cartão") + """</li>
              <li>""" + amazon("rascador pared gato", "Arranhadores de parede") + """</li>
              <li>""" + amazon("arbol rascador gato pequeño", "Árvores compactas") + """</li>
            </ul>
            <small>Links de pesquisa na Amazon.es. Podemos receber uma comissão.</small>
          </div>"""),
        ],
    },
    {
        "slug": "transportadoras-para-gatos",
        "titulo": "Transportadoras para gatos: tamanho, abertura e limpeza",
        "descricao": "Rígida, flexível ou mochila: como escolher a transportadora certa para levar o gato ao veterinário ou em viagem, em Portugal.",
        "lead": "Uma boa transportadora torna a ida ao veterinário mais fácil para os dois.",
        "para": "Gatos",
        "tipo": "Comparação",
        "metodo": METODO_PESQUISA,
        "intro": """          <p>Para muitos gatos, a transportadora só aparece no dia do veterinário, e por isso ficam nervosos ao vê-la. Escolher um modelo fácil de abrir e de limpar, e deixá-lo à vista em casa, ajuda bastante.</p>""",
        "seccoes": [
            ("tamanho", "O tamanho certo", """          <p>O gato deve conseguir ficar de pé, virar-se e deitar-se lá dentro. Meça-o do nariz à base da cauda e do chão ao topo da cabeça, e compare com as medidas interiores da transportadora, não as exteriores.</p>
          <p>Maior nem sempre é melhor: numa transportadora demasiado grande, o gato escorrega quando a leva na mão. Se o gato ainda vai crescer, escolha pelo tamanho de adulto.</p>"""),
            ("tipos", "Rígida, flexível ou mochila", """          <div class="table-wrap">
            <table class="compare">
              <caption>Comparação dos tipos de transportadora</caption>
              <thead><tr><th scope="col">Tipo</th><th scope="col">Pontos fortes</th><th scope="col">Pontos fracos</th><th scope="col">Bom para</th></tr></thead>
              <tbody>
                <tr><th scope="row">Rígida de plástico</th><td>Protege bem, lava-se com facilidade</td><td>Ocupa espaço guardada</td><td>Veterinário e viagens de carro</td></tr>
                <tr><th scope="row">Flexível de tecido</th><td>Leve, dobra-se para guardar</td><td>Mais difícil de limpar a fundo</td><td>Casas com pouca arrumação, transportes públicos</td></tr>
                <tr><th scope="row">Mochila</th><td>Mãos livres</td><td>Nem todos os gatos aceitam, fica quente</td><td>Gatos calmos e trajetos curtos a pé</td></tr>
              </tbody>
            </table>
          </div>"""),
            ("abertura", "Abertura: o detalhe que mais ajuda", """          <p>Uma transportadora com <strong>abertura em cima</strong>, além da porta da frente, permite pôr o gato lá dentro sem o empurrar. No veterinário, a parte de cima que se tira por completo deixa observar o gato sem o obrigar a sair.</p>
          <p>Veja também se os fechos são firmes e se a porta não abre por dentro com uma pata.</p>"""),
            ("limpeza", "Limpeza", """          <p>Acidentes acontecem, sobretudo com gatos nervosos. Prefira uma base lisa, de plástico, e use por cima uma manta ou um resguardo absorvente que se possa lavar. Nos modelos de tecido, confirme se o forro sai e se vai à máquina.</p>"""),
            ("viagens", "Comboio, autocarro e avião", """          <p>As regras para levar animais mudam de transportador para transportador, incluindo tamanho máximo da caixa e se é preciso bilhete. Confirme sempre no site da empresa antes de comprar a transportadora para uma viagem concreta, sobretudo de avião, em que as medidas para a cabine são apertadas.</p>
          <p class="note">Deixe a transportadora aberta em casa durante uns dias, com uma manta e um brinquedo. Quando chegar o dia da consulta, o gato já a conhece.</p>"""),
            ("comprar", "Antes de comprar na Amazon.es", """          <div class="shop">
            <h3>Ver opções na Amazon.es</h3>
            <ul>
              <li>""" + amazon("transportin gato rigido apertura superior", "Transportadoras rígidas com abertura em cima") + """</li>
              <li>""" + amazon("transportin gato plegable", "Transportadoras flexíveis dobráveis") + """</li>
              <li>""" + amazon("mochila transporte gato", "Mochilas para gatos") + """</li>
            </ul>
            <small>Links de pesquisa na Amazon.es. Podemos receber uma comissão.</small>
          </div>"""),
        ],
    },
    {
        "slug": "camas-lavaveis-para-caes",
        "titulo": "Camas laváveis para cães: o que comparar antes de comprar",
        "descricao": "Tamanho, formato, capa removível e lavagem na máquina: como escolher uma cama lavável para o seu cão.",
        "lead": "A cama certa é a que o cão usa e que cabe na sua máquina de lavar.",
        "para": "Cães",
        "tipo": "Guia de compra",
        "metodo": METODO_PESQUISA,
        "intro": """          <p>Uma cama de cão suja-se depressa: pelo, terra das patas e, com cachorros ou cães mais velhos, alguns acidentes. Por isso a primeira pergunta não é o desenho, é como se lava.</p>""",
        "seccoes": [
            ("tamanho", "O tamanho", """          <p>Meça o cão deitado na posição em que mais dorme, do nariz à cauda, e some 15 a 20 cm. Um cão que dorme esticado precisa de mais comprimento; um que dorme enrolado fica bem numa cama mais pequena e com bordas.</p>"""),
            ("formato", "O formato, pela maneira como o cão dorme", """          <div class="table-wrap">
            <table class="compare">
              <caption>Formatos de cama e para que cão servem</caption>
              <thead><tr><th scope="col">Formato</th><th scope="col">Como é</th><th scope="col">Bom para</th></tr></thead>
              <tbody>
                <tr><th scope="row">Ninho ou redonda</th><td>Bordas altas à volta</td><td>Cães que dormem enrolados e gostam de encostar a cabeça</td></tr>
                <tr><th scope="row">Colchão</th><td>Plana, sem bordas</td><td>Cães que dormem esticados e cães grandes</td></tr>
                <tr><th scope="row">Ortopédica</th><td>Espuma firme e mais grossa</td><td>Cães mais velhos ou com dores nas articulações, por indicação do veterinário</td></tr>
                <tr><th scope="row">Elevada</th><td>Tela esticada sobre uma estrutura</td><td>Varandas e dias quentes; arrefece por baixo</td></tr>
              </tbody>
            </table>
          </div>"""),
            ("lavagem", "Lavagem: as quatro coisas a confirmar", """          <ol>
            <li><strong>Capa com fecho:</strong> a capa sai e o enchimento fica de fora.</li>
            <li><strong>Temperatura:</strong> veja na descrição e na etiqueta a que temperatura a capa se pode lavar.</li>
            <li><strong>Tamanho da máquina:</strong> uma cama grande pode não caber numa máquina de 7 kg, comum em apartamentos. Veja as medidas da capa.</li>
            <li><strong>Secagem:</strong> em Portugal muita roupa seca no estendal; uma capa fina seca mais depressa no inverno.</li>
          </ol>
          <p>Uma capa interior impermeável protege a espuma de acidentes e é útil com cachorros e cães mais velhos.</p>"""),
            ("detalhes", "Outros detalhes", """          <ul>
            <li>Base antiderrapante, para pisos de madeira ou cerâmica.</li>
            <li>Tecido resistente se o cão gosta de escavar ou roer.</li>
            <li>Uma capa de reserva, para não ficar sem cama no dia da lavagem.</li>
          </ul>"""),
            ("comprar", "Antes de comprar na Amazon.es", """          <div class="shop">
            <h3>Ver opções na Amazon.es</h3>
            <ul>
              <li>""" + amazon("cama perro funda desenfundable lavable", "Camas com capa removível") + """</li>
              <li>""" + amazon("cama ortopedica perro viscoelastica desenfundable", "Camas ortopédicas com capa") + """</li>
              <li>""" + amazon("cama elevada perro", "Camas elevadas") + """</li>
            </ul>
            <small>Links de pesquisa na Amazon.es. Podemos receber uma comissão.</small>
          </div>"""),
        ],
    },
    {
        "slug": "areia-espalhada-pela-casa",
        "titulo": "Como reduzir a areia espalhada pela casa",
        "descricao": "Tapetes, caixas com entrada por cima, tipos de areia e posição da caixa: soluções para a areia que o gato espalha pela casa.",
        "lead": "Na maior parte das casas, junta-se um tapete a uma caixa mais alta.",
        "para": "Gatos",
        "tipo": "Dúvida prática",
        "metodo": METODO_PESQUISA,
        "intro": """          <p>A areia sai da caixa de duas maneiras: presa nas patas e almofadas, ou atirada para fora quando o gato escava. Cada uma tem a sua solução, e muitas vezes é preciso juntar duas.</p>""",
        "seccoes": [
            ("tapete", "Um tapete à saída da caixa", """          <p>É a mudança mais simples. Os tapetes de <strong>dupla camada em favo</strong> deixam a areia cair para dentro e esvaziam-se no caixote do lixo. Os de borracha ou com relevo são mais fáceis de aspirar. O tapete deve ser grande o bastante para o gato dar dois ou três passos em cima dele ao sair.</p>"""),
            ("caixa", "Uma caixa que segura a areia", """          <div class="table-wrap">
            <table class="compare">
              <caption>Tipos de caixa e o que mudam</caption>
              <thead><tr><th scope="col">Caixa</th><th scope="col">Ajuda com</th><th scope="col">Atenção</th></tr></thead>
              <tbody>
                <tr><th scope="row">Bordas altas</th><td>Areia atirada ao escavar</td><td>Gatos idosos precisam de uma entrada baixa</td></tr>
                <tr><th scope="row">Com tampa</th><td>Areia atirada e cheiro na sala</td><td>Alguns gatos não gostam de espaços fechados</td></tr>
                <tr><th scope="row">Entrada por cima</th><td>Areia nas patas: o gato sai pela grelha da tampa</td><td>Não serve para gatos idosos, com dores ou muito pequenos</td></tr>
              </tbody>
            </table>
          </div>
          <p>Uma caixa maior também ajuda: o gato escava menos contra as paredes. A regra mais citada é ter uma caixa por gato, mais uma.</p>"""),
            ("areia", "O tipo de areia", """          <p>Grãos muito finos colam-se mais às patas. Grãos maiores, como os pellets de madeira ou alguns tipos de sílica, tendem a espalhar-se menos, mas cada gato reage de forma diferente.</p>
          <p class="note">Mude de areia aos poucos, misturando a nova com a antiga ao longo de uma a duas semanas. Uma mudança brusca pode levar o gato a deixar de usar a caixa.</p>"""),
            ("sitio", "Onde pôr a caixa", """          <p>Num canto, com duas paredes à volta, a areia atirada fica contida. Num apartamento, evite pô-la ao lado da máquina de lavar: o barulho pode assustar o gato. Deixe espaço à frente para o tapete.</p>"""),
            ("comprar", "Antes de comprar na Amazon.es", """          <div class="shop">
            <h3>Ver opções na Amazon.es</h3>
            <ul>
              <li>""" + amazon("alfombrilla arena gato doble capa", "Tapetes apanha-areia de dupla camada") + """</li>
              <li>""" + amazon("arenero gato entrada superior", "Caixas com entrada por cima") + """</li>
              <li>""" + amazon("arenero gato bordes altos", "Caixas de bordas altas") + """</li>
            </ul>
            <small>Links de pesquisa na Amazon.es. Podemos receber uma comissão.</small>
          </div>"""),
        ],
    },
]


def institucional(slug, titulo, descricao, lead, prosa, atual):
    corpo = f"""    <header class="doc__head">
      <div class="container cols">
        <div class="doc__title">
          <h1>{titulo}</h1>
          <p class="lead">{lead}</p>
        </div>
        <dl class="doc__meta">
          <div><dt>Atualizado</dt><dd><time datetime="2026-11-28">{ATUALIZADO}</time></dd></div>
        </dl>
      </div>
    </header>

    <article class="doc__body">
      <div class="container cols">
        <div class="prose">
{prosa}
        </div>
      </div>
    </article>"""
    return pagina(titulo, descricao, "", corpo, atual)


CONTACTO = '<span class="fill" data-fill="email">e-mail de contacto a definir</span>'

PAGINAS = [
    ("transparencia", "Links de afiliado e transparência",
     "Como o World Pets ganha dinheiro com links de afiliado da Amazon.es e o que isso significa para si.",
     "Como ganhamos dinheiro, dito de forma simples.",
     f"""          <h2 id="resumo">Em resumo</h2>
          <p>O World Pets participa no Programa de Afiliados da Amazon.es. Quando clica num link nosso para a Amazon.es e compra, a Amazon pode pagar-nos uma pequena comissão. <strong>O preço que paga é o mesmo</strong>, com ou sem o nosso link.</p>
          <p class="note">Enquanto Afiliado da Amazon, o World Pets obtém rendimentos com as compras elegíveis.<br>En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.</p>
          <h2 id="identificar">Como identificar os links</h2>
          <ul>
            <li>Todos os guias com links para a Amazon.es têm um aviso no topo.</li>
            <li>As caixas azuis “Ver opções na Amazon.es” levam sempre à Amazon.es.</li>
            <li>Os links de afiliado estão marcados no código como patrocinados (<code>rel="sponsored"</code>).</li>
          </ul>
          <h2 id="independencia">O que a comissão não muda</h2>
          <ul>
            <li>Não mostramos produtos que achamos maus por darem comissão.</li>
            <li>No topo de cada guia dizemos se testámos o produto em casa ou se o guia é uma pesquisa e comparação de características.</li>
            <li>Não inventamos opiniões nem testes que não fizemos.</li>
          </ul>
          <h2 id="precos">Preços e entrega em Portugal</h2>
          <p>Não mostramos preços nos guias porque mudam várias vezes por dia. O preço válido é o que aparece na Amazon.es no momento da compra. A entrega para Portugal depende do produto, do vendedor e da morada: confirme-a antes de finalizar a encomenda.</p>
          <h2 id="contacto">Dúvidas</h2>
          <p>Se tiver alguma pergunta sobre os nossos links, escreva para {CONTACTO}.</p>""", "transparencia"),
    ("sobre", "Sobre o World Pets",
     "O World Pets ajuda quem vive em Portugal a escolher produtos para cães e gatos, com preços em euros e entrega no país.",
     "Cuidados e escolhas inteligentes para cães e gatos em Portugal.",
     f"""          <h2 id="porque">Porque existe</h2>
          <p>Escolher um arranhador, uma cama ou uma transportadora parece simples até ter dez opções parecidas no ecrã. O World Pets compara o que interessa, a pensar em quem vive em Portugal, muitas vezes num apartamento com pouco espaço.</p>
          <h2 id="foco">Por onde começamos</h2>
          <p>Começamos pelos acessórios para cães e gatos em apartamentos:</p>
          <ul>
            <li>higiene;</li>
            <li>descanso;</li>
            <li>brincadeira;</li>
            <li>transporte.</li>
          </ul>
          <h2 id="metodo">Como trabalhamos</h2>
          <ul>
            <li>Cada guia responde a uma dúvida prática e compara características: medidas, materiais, limpeza.</li>
            <li>Dizemos sempre se testámos o produto ou se o guia é pesquisa.</li>
            <li>Quando tivermos fotografias próprias e experiência de uso, mostramo-las.</li>
            <li>Indicamos o que confirmar na Amazon.es antes de comprar: o preço do dia e a entrega para a sua morada.</li>
          </ul>
          <h2 id="dinheiro">Como nos financiamos</h2>
          <p>Somos afiliados da Amazon.es. Se comprar através dos nossos links, podemos receber uma comissão, sem custo extra para si. <a class="link" href="transparencia.html">Ler a página de transparência</a></p>
          <h2 id="contacto">Contacto</h2>
          <p>Sugestões de guias e correções são bem-vindas: {CONTACTO}.</p>""", "sobre"),
    ("privacidade", "Privacidade",
     "Que dados o World Pets recolhe e como funcionam os links para a Amazon.es.",
     "O que recolhemos, e o que acontece quando clica num link para a Amazon.",
     f"""          <h2 id="dados">Dados que recolhemos</h2>
          <p>O World Pets não pede nome, e-mail nem pagamento, e não tem contas de utilizador. Neste momento o site não usa cookies próprios nem ferramentas de estatística.</p>
          <p class="note">Se passarmos a medir visitas, esta página será atualizada antes, com a ferramenta usada e a forma de recusar.</p>
          <h2 id="fontes">Tipos de letra</h2>
          <p>Os tipos de letra do site são carregados a partir do Google Fonts, o que faz o seu navegador contactar servidores da Google.</p>
          <h2 id="amazon">Links para a Amazon.es</h2>
          <p>Ao clicar num link para a Amazon.es, sai do World Pets. A Amazon pode usar cookies para registar que a visita veio do nosso site, e é assim que a comissão é atribuída. O tratamento desses dados segue a política de privacidade da Amazon.</p>
          <h2 id="direitos">Os seus direitos</h2>
          <p>Para qualquer questão sobre privacidade, escreva para {CONTACTO}.</p>""", ""),
]


def main():
    for g in GUIAS:
        (RAIZ / "guias" / f'{g["slug"]}.html').write_text(guia(g, GUIAS), encoding="utf-8")
    for slug, titulo, descricao, lead, prosa, atual in PAGINAS:
        (RAIZ / f"{slug}.html").write_text(institucional(slug, titulo, descricao, lead, prosa, atual), encoding="utf-8")
    print("ok:", len(GUIAS), "guias e", len(PAGINAS), "páginas")


if __name__ == "__main__":
    main()
