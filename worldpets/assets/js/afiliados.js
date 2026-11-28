/* World Pets: links de afiliado da Amazon.es
 *
 * Quando a conta Amazon Afiliados estiver aprovada, escreva aqui o seu ID de
 * afiliado (o "tag", por exemplo "worldpets-21") e volte a publicar o site.
 * Todos os links marcados com data-amazon passam a levar o tag.
 * Enquanto o tag estiver vazio, os links abrem a Amazon.es normalmente, sem comissão.
 */
const AMAZON_TAG = '';

document.querySelectorAll('a[data-amazon]').forEach((link) => {
  link.rel = 'sponsored nofollow noopener';
  link.target = '_blank';
  if (!AMAZON_TAG) return;
  try {
    const url = new URL(link.href);
    url.searchParams.set('tag', AMAZON_TAG);
    link.href = url.toString();
  } catch (e) {
    /* link inválido: fica como está */
  }
});
