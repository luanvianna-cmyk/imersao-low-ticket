# Imersão Mercado Ads — Black Friday

Landing page estática da oferta de R$ 39,90. HTML, CSS, JavaScript, fontes e mídia em `assets/`.

## Origem desta versão

Versão da LP revisada em 13/11/2026, correspondente ao commit `6671b59733b871f56ebb5d64f6cfc47bc275ecdf` da cópia de trabalho anterior. Inclui programa interativo, vídeos das aulas, bônus Growth Kit, oferta, adaptações mobile, contagem regressiva e WhatsApp.

## Hospedagem

- Vercel. Site estático, sem instalação de dependências ou comando de build.
- Diretório de publicação: raiz do repositório. Entrada: `index.html`.
- As funções em `api/` sobem junto no deploy. Em hospedagem só estática elas não existem, e o lightbox leva o comprador para a página de venda do DG Labs.

## Integração comercial

Os CTAs abrem um lightbox de checkout na própria LP (`checkout-lightbox.js` e `.css`, marcação no fim do `index.html`). Ele coleta os dados necessários ao checkout da Turma 05 no DG Labs, `https://dglabs.app/p/imersao-mercado-ads-turma-05`: nome, e-mail, confirmação obrigatória do e-mail e WhatsApp, com order bump do e-book e cupom opcionais. Os dois e-mails precisam coincidir; sugestões de correção de domínio nunca alteram a confirmação automaticamente. Ao enviar, o comprador segue para o Mercado Pago e volta para a página de obrigado do DG Labs, pelo fluxo que já existe lá.

Como funciona:

- O DG Labs não aceita chamada de navegador vinda de outro domínio nem pode ser embutido em iframe. Por isso o lightbox posta em `/api/checkout`, na mesma origem, e a função repassa o pedido a `POST https://dglabs.app/api/checkout/public` de servidor para servidor. `/api/cupom` faz o mesmo com a prévia do cupom.
- Produto, order bump e preços exibidos ficam em `checkout-config.js`, usado pela tela e pelas funções. Se o produto ou a oferta mudarem no DG Labs (id, preço, parcelas), atualize esse arquivo.
- O valor cobrado é sempre o do cadastro no DG Labs. Em 16/11/2026 o produto estava a R$ 39,39 (3x de R$ 13,13); os textos da LP anunciam R$ 39,90.
- Quando o repasse não consegue criar a cobrança (limite de tentativas, DG Labs fora do ar, cadastro alterado), o comprador é levado para a página de venda do DG Labs com a campanha e o cupom na URL, e conclui a compra lá.

Limites de repassar o pedido sem alterar o DG Labs:

- O checkout do DG Labs aceita 15 tentativas a cada 10 minutos por IP, e todo pedido da LP sai dos IPs da Vercel. Em pico, parte dos compradores cai na página de venda.
- A página de obrigado mostra "confira seu e-mail" em vez do acesso imediato, porque o cookie de primeiro acesso do DG Labs não chega ao navegador do comprador. A compra e o acesso são criados normalmente.
- O IP registrado na compra é o da Vercel. Cookies do Pixel e do GA, UTMs e navegador do comprador são repassados.

O domínio definitivo desta LP ainda precisa ser definido para atualizar canonical e Open Graph.
