export const metadata = { title: "Política de privacidade · Home Leal" };

export default function PrivacidadePage() {
  return (
    <article className="space-y-4 rounded-3xl border border-beige-200 bg-white p-5 text-sm leading-relaxed text-sage-800">
      <h1 className="font-display text-2xl font-semibold">Política de privacidade</h1>
      <p className="text-xs text-sage-500">Última atualização: 11 de outubro de 2026</p>

      <p>
        O Home Leal é uma aplicação familiar para organizar a lista de compras da casa. Esta página
        explica que dados a aplicação trata.
      </p>

      <h2 className="font-display text-lg font-semibold">Dados guardados</h2>
      <p>
        Os produtos que adiciona (nome, departamento, quantidade, unidade, preços e observações) ficam
        guardados <strong>apenas no armazenamento local do seu dispositivo</strong>. Nesta versão a
        aplicação não envia estes dados para nenhum servidor, não cria contas e não recolhe dados
        pessoais.
      </p>

      <h2 className="font-display text-lg font-semibold">Partilha</h2>
      <p>
        A lista só sai do dispositivo quando escolhe partilhá-la pelo WhatsApp ou copiar o texto. Nesse
        caso, o texto é entregue à aplicação que escolher e fica sujeito à política de privacidade
        dessa aplicação.
      </p>

      <h2 className="font-display text-lg font-semibold">Publicidade e rastreio</h2>
      <p>A aplicação não tem publicidade, não usa cookies de rastreio nem ferramentas de análise.</p>

      <h2 className="font-display text-lg font-semibold">Apagar os dados</h2>
      <p>
        Pode eliminar produtos a qualquer momento na própria aplicação. Desinstalar a aplicação ou limpar
        os dados do navegador apaga toda a informação guardada.
      </p>

      <h2 className="font-display text-lg font-semibold">Alterações</h2>
      <p>
        Se uma versão futura passar a sincronizar a lista entre dispositivos, esta política será
        atualizada antes dessa alteração, indicando que dados são guardados e onde.
      </p>
    </article>
  );
}
