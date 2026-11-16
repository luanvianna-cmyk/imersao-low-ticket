/* Produto vendido pelo lightbox. Fonte única: o navegador usa para exibir
   preços e as funções em /api usam para montar o pedido ao DG Labs.
   Os valores espelham a página https://dglabs.app/p/imersao-mercado-ads-turma-05
   (conferidos em 16/11/2026). O preço cobrado é sempre o do DG Labs: se o
   cadastro mudar lá, atualize aqui para a tela não mostrar outro valor. */
(function (root, factory) {
  var config = factory();
  if (typeof module === 'object' && module.exports) module.exports = config;
  else root.DG_CHECKOUT = config;
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    origin: 'https://dglabs.app',
    slug: 'imersao-mercado-ads-turma-05',
    product: {
      id: '98f6e4a5-9acb-49ce-983b-92caaa87e049',
      terms: { billingMode: null, accessDays: null },
      title: 'Imersão Mercado Ads: Do Zero ao Lucro',
      label: 'Turma 05 · Black Friday',
      priceCents: 3939,
      compareAtCents: 19990,
      maxInstallments: 3
    },
    bump: {
      offerId: '3fe0519f-48a3-4e54-b614-cd5d510f0b3f',
      terms: { billingMode: null, accessDays: null },
      headline: 'Adicionar o E-book Estratégias Avançadas para Escalar no Mercado Livre',
      body: 'Estratégias avançadas para escalar documentadas e detalhadas em um material didático',
      targetTitle: 'Estratégias avançadas para Escalar no Mercado Livre',
      cover: 'assets/ebook-estrategias-avancadas-828.webp',
      coverSource: 'https://vhnfuqpouypankrmcsbw.supabase.co/storage/v1/object/public/covers/products/eb59e839-c368-46ea-bbc4-f802db632905/cover-1789442595215.png',
      priceCents: 2990
    }
  };
});
