# TG Sports — E-commerce

E-commerce completo para a **TG Sports** (tênis e calçados esportivos, Jaú/SP): loja pública, carrinho, checkout,
integração de pagamentos com **Asaas** (PIX e Cartão de Crédito via Asaas Checkout), painel administrativo completo
(produtos, variações, estoque, pedidos, clientes, cupons, banners, financeiro, auditoria) e webhook idempotente.

> ⚠️ O catálogo vem com dados de **DEMONSTRAÇÃO** claramente marcados `[DEMO]`. Nenhum produto, preço ou foto é real.
> Cadastre o catálogo verdadeiro pelo painel administrativo antes de divulgar a loja.

---

## 1. Stack

- **Next.js 16** (App Router, Server Actions, Route Handlers, Turbopack)
- **TypeScript**
- **Tailwind CSS v4**
- **PostgreSQL** + **Prisma ORM 6**
- Autenticação própria (JWT em cookie httpOnly via `jose`, senhas com `bcryptjs`)
- Upload de imagens em disco (abstração pronta para trocar por S3/R2/CDN) com otimização via `sharp`
- **Asaas** (Checkout, Cliente, Webhooks) — sandbox por padrão
- **Vitest** para testes de regras de negócio

Todos os valores monetários são armazenados e calculados em **centavos** (Int) — nunca em float.

---

## 2. Configuração local

### 2.1 Pré-requisitos

- Node.js 20.9+ (recomendado 22+)
- PostgreSQL 14+ (local ou remoto)

### 2.2 Instalar dependências

```bash
npm install
```

> Este projeto foi criado com `npm install --legacy-peer-deps` devido a uma incompatibilidade pontual do resolvedor
> de dependências do npm 10 com o conjunto atual de pacotes. Se o `npm install` normal falhar, use
> `npm install --legacy-peer-deps`.

### 2.3 Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha pelo menos:

- `DATABASE_URL` — string de conexão PostgreSQL
- `AUTH_SECRET` — string aleatória forte (`openssl rand -base64 48`)
- `NEXT_PUBLIC_APP_URL` — URL pública da loja (`http://localhost:3000` em dev)
- `CRON_SECRET` — string aleatória para proteger o endpoint de varredura de reservas expiradas
- `ASAAS_API_KEY`, `ASAAS_ENV`, `ASAAS_WEBHOOK_TOKEN` — ver seção 5

### 2.4 Banco de dados

```bash
npm run db:migrate   # aplica as migrations (ambiente de desenvolvimento)
npm run db:seed      # popula categorias, marcas e produtos de DEMONSTRAÇÃO
```

Em produção, use `npm run db:deploy` (equivalente a `prisma migrate deploy`, não gera novas migrations).

### 2.5 Criar o primeiro administrador

```bash
npm run create-admin -- --name="Seu Nome" --email=admin@tgsports.com.br --password="SenhaForte123"
```

Acesse `/admin/login` com essas credenciais.

### 2.6 Rodar em desenvolvimento

```bash
npm run dev
```

- Loja: http://localhost:3000
- Painel administrativo: http://localhost:3000/admin/login

---

## 3. Estrutura do projeto (visão geral)

```
prisma/schema.prisma        Modelo de dados completo (produtos, variações, pedidos, pagamentos, etc.)
prisma/seed.ts               Seed de demonstração (marcado [DEMO])
scripts/create-admin.ts      Criação/promoção do primeiro administrador

src/lib/                     Regras de negócio e integrações (sem UI)
  auth/                       Sessão (JWT em cookie), hash de senha
  asaas/                      Cliente HTTP do Asaas + validação de webhook
  orders/                     Cálculo de totais, criação de pedido, processamento do webhook
  inventory.ts                Reserva/baixa/liberação de estoque (com lock pessimista)
  coupons.ts, shipping.ts     Cupom e frete
  storage/                    Abstração de armazenamento de arquivos

src/app/(storefront)/        Loja pública (home, catálogo, produto, carrinho, checkout, minha conta)
src/app/admin/                Painel administrativo
src/app/api/webhooks/asaas    Endpoint de webhook do Asaas
src/app/api/cron/sweep        Varredura de reservas de estoque expiradas
src/app/api/media/[...path]   Servidor de imagens enviadas pelo painel

tests/                        Testes de regra de negócio (Vitest)
```

---

## 4. Fluxo de pedido e estoque (resumo)

```
Carrinho (persistido por cookie httpOnly, banco de dados)
   ↓
Checkout: backend RECALCULA subtotal, desconto, frete e total
   (nunca confia em valores enviados pelo navegador)
   ↓
Cria o Pedido local + RESERVA de estoque (status ACTIVE, expira em 60 min,
   com lock pessimista por variação — impede overselling em concorrência)
   ↓
Cria o Checkout no Asaas (PIX ou Cartão) com externalReference = id do pedido
   ↓
Cliente paga no ambiente do Asaas
   ↓
Asaas envia Webhook → validado por token (asaas-access-token) e IDEMPOTENTE
   (evento duplicado é ignorado, id do evento é único no banco)
   ↓
CHECKOUT_PAID/PAYMENT_CONFIRMED/PAYMENT_RECEIVED → baixa definitiva do estoque,
   pedido = PAGAMENTO_APROVADO
CHECKOUT_CANCELED/EXPIRED → libera a reserva, pedido = CANCELADO
PAYMENT_REFUNDED → estorna e devolve o estoque se já havia sido baixado
```

A página de retorno do checkout (`/pedido/[id]/sucesso`) **nunca confirma pagamento** — ela apenas informa que o
pedido foi recebido. A única fonte de verdade é o webhook.

Reservas expiradas (cliente não pagou) são liberadas por `POST /api/cron/sweep` (proteja com um agendador externo —
veja seção 6).

---

## 5. Integração com Asaas

### 5.1 Comece pelo Sandbox

1. Crie uma conta em https://sandbox.asaas.com
2. Gere uma API Key em **Configurações > Integrações > Chaves de API** (comece com `sandbox`)
3. Preencha no `.env`:
   ```
   ASAAS_API_KEY="$aact_hmlg_..."
   ASAAS_ENV="sandbox"
   ```

Toda chamada ao Asaas acontece **exclusivamente no backend** (`src/lib/asaas/client.ts`) — a API key nunca é exposta
ao navegador.

### 5.2 Como funciona o pagamento

Usamos o **Asaas Checkout** (página de pagamento hospedada pelo Asaas) em vez de manipular dados de cartão
diretamente na aplicação — isso reduz drasticamente a superfície de dados sensíveis tratados pela TG Sports. O
cliente escolhe PIX ou Cartão de crédito no nosso checkout; ao confirmar, criamos uma sessão em `POST /v3/checkouts`
com `externalReference` = id do pedido interno e é redirecionado para o Asaas para concluir o pagamento.

### 5.3 Configurar o Webhook

**URL a cadastrar no Asaas:**

```
https://SEU-DOMINIO.com.br/api/webhooks/asaas
```

Em desenvolvimento local, use um túnel (ex.: `ngrok http 3000`) e cadastre a URL pública gerada.

**Passos no painel do Asaas** (Configurações > Integrações > Webhooks):

1. Crie um novo webhook apontando para a URL acima
2. Gere/informe um **Token de autenticação** — copie o mesmo valor para `ASAAS_WEBHOOK_TOKEN` no `.env`
3. Selecione os eventos de **Cobranças** e **Checkout** (no mínimo: `CHECKOUT_PAID`, `CHECKOUT_CANCELED`,
   `CHECKOUT_EXPIRED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`,
   `PAYMENT_DELETED`)
4. Salve

O endpoint valida o header `asaas-access-token` enviado pelo Asaas em toda notificação e rejeita (401) qualquer
requisição sem o token correto. Cada evento é gravado em `payment_events` com um identificador único — eventos
duplicados (reentrega "at-least-once") são reconhecidos e **não reprocessados**.

> As integrações (endpoints, payloads e headers) foram implementadas a partir da documentação oficial em
> docs.asaas.com (setembro/2026). Antes de ir para produção, **revalide os campos do Checkout e dos eventos de
> webhook na documentação atual do Asaas** — APIs de pagamento evoluem com frequência.

### 5.4 Indo para produção

1. Gere uma API Key de **produção** no painel real do Asaas
2. Troque `ASAAS_ENV=production` e `ASAAS_API_KEY` no ambiente de produção
3. Cadastre um novo Webhook apontando para a URL de produção com um novo token forte

---

## 6. Cron de expiração de reservas

O endpoint `POST /api/cron/sweep` (header `x-cron-secret: <CRON_SECRET>`) expira reservas de estoque vencidas e
cancela pedidos que ficaram mais de 65 minutos aguardando pagamento. Agende-o a cada 5–15 minutos usando:

- Vercel Cron (`vercel.json`)
- GitHub Actions com `schedule`
- cron-job.org ou qualquer scheduler externo

Exemplo de chamada:

```bash
curl -X POST https://SEU-DOMINIO.com.br/api/cron/sweep -H "x-cron-secret: SEU_CRON_SECRET"
```

---

## 7. Cadastrando o catálogo real

1. Entre em `/admin/login`
2. **Marcas** → cadastre as marcas que a TG Sports está autorizada a vender (nome + logo opcional)
3. **Categorias** → Basquete, Corrida, Treino, Casual, etc.
4. **Produtos → Novo produto** → preencha nome, SKU, marca, preços, categorias
5. Na tela de edição do produto:
   - **Fotos do produto**: arraste e solte (ou clique) para enviar quantas imagens quiser; reordene arrastando as
     miniaturas; defina a foto principal; exclua quando quiser
   - **Numeração e estoque**: adicione as numerações vendidas (34–44) com o estoque de cada uma; o estoque de cada
     numeração é ajustável a qualquer momento (auditado)
6. Repita para o restante do catálogo. Depois, marque produtos como **destaque**, **oferta** ou **novo** conforme a
   estratégia comercial.

Nenhuma etapa acima exige alteração de código.

---

## 8. Como subir fotos

As imagens são enviadas na tela de edição do produto (seção **Fotos do produto**), do banner (**Banners**) e da
marca (**Marcas**). Formatos aceitos: JPG, PNG, WebP — até 8MB por arquivo. Toda imagem é reprocessada para WebP
(qualidade otimizada) e uma miniatura é gerada automaticamente, para performance no catálogo (Core Web Vitals).

Os arquivos ficam em `storage/uploads/` (fora de `/public`, fora do controle de versão) e são servidos pela própria
aplicação em `/api/media/...`. Para produção com múltiplas instâncias, configure `STORAGE_DIR` para um volume
persistente compartilhado, ou substitua `src/lib/storage/storage.ts` por um driver S3/R2 compatível — a interface
`StorageDriver` foi desenhada para isso sem exigir mudanças no resto da aplicação.

---

## 9. Colocando em produção (checklist rápido)

1. Provisione um PostgreSQL gerenciado (ou equivalente) e configure `DATABASE_URL`
2. Configure um volume persistente para `storage/uploads` (ou migre para S3/R2)
3. Defina `AUTH_SECRET`, `CRON_SECRET`, `ASAAS_*` de produção como variáveis de ambiente do host
4. Rode `npm run build` e `npm run db:deploy` no pipeline de deploy
5. Crie o primeiro admin com `npm run create-admin -- ...`
6. Cadastre o Webhook do Asaas apontando para a URL de produção (ver seção 5.3)
7. Agende o cron de varredura de reservas (ver seção 6)
8. Rode `npm run typecheck`, `npm run lint` e `npm test` no CI antes de cada deploy

---

## 10. Testes

```bash
npm test
```

Os testes usam um banco PostgreSQL de teste separado (padrão `tgsports_test`, configurável via
`DATABASE_URL_TEST`). Antes de rodar pela primeira vez:

```bash
DATABASE_URL="postgresql://usuario:senha@localhost:5432/tgsports_test" npx prisma migrate deploy
```

Cobertura atual: cálculo de carrinho/subtotal, desconto de cupom (todas as regras de validação), desconto PIX e
parcelamento, reserva de estoque (incluindo teste de **concorrência real** que garante que duas reservas simultâneas
nunca vendem além do estoque disponível), confirmação/baixa de estoque, liberação de reserva, expiração de reservas,
e o webhook do Asaas (idempotência de eventos duplicados, aprovação de pagamento, cancelamento, expiração, e a
garantia de que um pedido já pago nunca é revertido por um evento tardio).

---

## 11. Segurança — decisões importantes

- Preço, desconto, frete e status de pagamento **nunca** são aceitos do navegador — o backend recalcula tudo a
  partir do banco a cada requisição de carrinho/checkout
- Senhas com `bcryptjs` (12 rounds); sessões JWT assinadas (`AUTH_SECRET`) em cookies `httpOnly`, `sameSite=lax`,
  `secure` em produção
- RBAC simples (`ADMIN`/`STAFF`) verificado em toda Server Action administrativa, não apenas na navegação
- Reserva de estoque com **lock pessimista** (`SELECT ... FOR UPDATE`) dentro de transação — impede overselling em
  requisições concorrentes (coberto por teste automatizado)
- Webhook do Asaas validado por token (`asaas-access-token`) com comparação de tempo constante, e idempotente por
  `event_id` único
- Upload de imagem: valida MIME type e tamanho, gera nomes de arquivo aleatórios (sem usar o nome enviado pelo
  usuário), reprocessa a imagem (remove metadados) e nunca salva como base64 no banco
- CPF de clientes é mascarado nas listagens do painel para usuários com papel `STAFF`; apenas `ADMIN` vê o valor
  completo
- Rate limiting simples em memória para login (admin e cliente) e checkout — para múltiplas instâncias em produção,
  troque por um store compartilhado (Redis)
- Auditoria (`audit_logs`) registra alterações de preço, estoque, status de pedido, criação/exclusão de cupom,
  upload/exclusão de imagem e mais — com usuário, ação, entidade e IP

---

## 12. Checklist do que foi implementado

- [x] Loja pública completa (home, catálogo com filtros/ordenação/busca, página de produto com galeria e zoom,
      variações por numeração com estoque independente, tabela de medidas, política de troca/entrega)
- [x] Carrinho persistente (cookie + banco), com atualização de quantidade e remoção
- [x] Checkout com escolha de entrega/retirada, endereço com autopreenchimento por CEP (ViaCEP), cupom, PIX ou
      Cartão de crédito
- [x] Integração oficial com Asaas Checkout (sandbox), criação/reuso de cliente, webhook idempotente e seguro
- [x] Reserva de estoque com expiração + baixa definitiva apenas após confirmação do pagamento
- [x] Pedidos com status de pagamento e status logístico separados, histórico completo
- [x] Painel administrativo: dashboard com gráfico, produtos (CRUD completo + imagens + variações/estoque), marcas,
      categorias, pedidos (com filtros e mudança de status), clientes (com LGPD — CPF mascarado), cupons, banners,
      financeiro, auditoria e configurações da loja (frete, retirada, conteúdo institucional)
- [x] Conta do cliente (cadastro, login, pedidos)
- [x] Favoritos (localStorage, sem exigir conta)
- [x] Frete desacoplado (retirada / fixo / grátis acima de X), pronto para integrar Correios/Melhor Envio depois
- [x] SEO: URLs amigáveis, meta tags, Open Graph, `sitemap.xml`, `robots.txt`, Schema.org Product/Offer,
      breadcrumbs
- [x] Páginas institucionais editáveis pelo painel (conteúdo padrão claramente marcado como não revisado
      juridicamente)
- [x] Testes automatizados das regras de negócio críticas (carrinho, cupom, estoque, reserva, webhook)
- [x] Seed de demonstração claramente identificado `[DEMO]`

## 13. O que ainda depende de credenciais/dados reais da TG Sports

- [ ] **Credenciais Asaas de produção** (API Key + Webhook) — hoje configurado apenas para Sandbox
- [ ] **Catálogo real**: produtos, preços, fotos, marcas autorizadas — o seed é 100% fictício
- [ ] **Número de WhatsApp real** (botão flutuante e checkout) — configurável em Admin > Configurações
- [ ] **Textos jurídicos definitivos** (Política de privacidade, Termos de uso, Trocas e devoluções) — os textos
      atuais são apenas placeholders claramente identificados como não revisados juridicamente
- [ ] **Logo oficial da TG Sports** — atualmente a marca é representada apenas em texto ("TG"); adicionar o arquivo
      de logo real requer apenas trocar o componente de logo no `Header`/`Footer`/e-mails
- [ ] **CEP/endereço reais da loja** em Jaú/SP (Admin > Configurações)
- [ ] Decisão sobre **frete real** (integração Correios/Melhor Envio) — hoje é frete fixo configurável +
      grátis acima de X, arquitetura já preparada para o gateway
- [ ] Envio de notificações via WhatsApp (Z-API/API oficial) — a camada `NotificationService` está prevista na
      arquitetura mas a integração real depende de credenciais que a TG Sports precisa contratar
