# Digital Store — Back-end (API REST)

Back-end completo do projeto da **Digital College / Geração Tech**, **separado do React**. Implementado em **Node.js + Express + MySQL + Sequelize**, com JWT, bcrypt, migrations, Swagger e Jest.

## Requisitos

- Node.js **20+** e npm
- MySQL **8** (local ou Docker Desktop)
- Opcional: Docker Desktop e Compose, para iniciar MySQL com 1 comando

## Como rodar (macOS, Linux ou Windows)

```bash
cd digital-store-backend
cp .env.example .env
# Edite o arquivo .env: DB_PASSWORD e JWT_SECRET (32+ caracteres, aleatório)
npm install
docker compose up -d db     # ou inicie seu MySQL local
npm run db:migrate          # crie as 6 tabelas pela migration
npm run db:seed             # OPCIONAL: categorias e produtos de demonstração
npm run dev
```

> Windows PowerShell: substitua `cp` por `Copy-Item .env.example .env`.
>
> O Docker Compose usa `DB_USER=digital_store`, `DB_PASSWORD=change_me` para **desenvolvimento local**. Se alterá-los no `.env`, altere também o `docker-compose.yml` (na primeira inicialização do banco). Nunca use essas credenciais em produção.
>
> Se `3306` já estiver em uso, altere o mapeamento de porta no Compose e o `DB_PORT` no `.env`. O campo `PUBLIC_BASE_URL` precisa apontar para a URL na qual a API roda.

- **API:** `http://localhost:3001`
- **Swagger UI:** `http://localhost:3001/api-docs`
- **OpenAPI JSON:** `http://localhost:3001/openapi.json`
- **Health:** `http://localhost:3001/health`
- **Imagens:** `http://localhost:3001/media/products/<arquivo>`

Para criar um segredo aleatório com Node: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

## Endpoints exigidos (15 rotas de negócio)

| Método | Rota | JWT | Status de sucesso |
|---|---|---|---|
| GET | `/v1/user/:id` | Não | 200 |
| POST | `/v1/user` | Não | 201 |
| POST | `/v1/user/token` | Não | 200 |
| PUT | `/v1/user/:id` | Sim, dono da conta | 204 |
| DELETE | `/v1/user/:id` | Sim, dono da conta | 204 |
| GET | `/v1/category/search` | Não | 200 |
| GET | `/v1/category/:id` | Não | 200 |
| POST | `/v1/category` | Sim | 201 |
| PUT | `/v1/category/:id` | Sim | 204 |
| DELETE | `/v1/category/:id` | Sim | 204 |
| GET | `/v1/product/search` | Não | 200 |
| GET | `/v1/product/:id` | Não | 200 |
| POST | `/v1/product` | Sim | 201 |
| PUT | `/v1/product/:id` | Sim | 204 |
| DELETE | `/v1/product/:id` | Sim | 204 |

**Erros:** 400 (validação/conflito), 401 (JWT ausente/inválido), 403 (acesso a usuário de terceiros), 404 (não encontrado), 413 (JSON grande), 429 (limite de login), 500 (erro interno). Senhas nunca são retornadas.

### Exemplo: cadastro, login e categoria

```bash
curl -X POST http://localhost:3001/v1/user \
  -H 'Content-Type: application/json' \
  -d '{"firstname":"Ana","surname":"Silva","email":"ana@example.com","password":"123@123","confirmPassword":"123@123"}'

curl -X POST http://localhost:3001/v1/user/token \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@example.com","password":"123@123"}'

# Substitua SEU_TOKEN pelo valor retornado acima:
curl -X POST http://localhost:3001/v1/category \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -d '{"name":"Calçados","slug":"calcados","use_in_menu":true}'
```

### Exemplo: criação de produto com opções

```bash
curl -X POST http://localhost:3001/v1/product \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -d '{"enabled":true,"name":"Tênis Air","slug":"tenis-air","stock":10,"price":249.9,"price_with_discount":199.9,"category_ids":[1],"options":[{"title":"Tamanho","shape":"square","radius":4,"type":"text","values":["38","39","40"]}]}'
```

### Listagens e filtros

- `/v1/category/search?limit=12&page=1&fields=name,slug&use_in_menu=true`
- `/v1/product/search?limit=30&page=2&fields=name,images,price`
- `/v1/product/search?match=T%C3%AAnis&category_ids=1,2&price-range=100-200`
- `/v1/product/search?option[45]=GG,PP` — ID **45** é o ID de uma opção cadastrada.
- `limit=-1` retorna tudo, e `page` é ignorado nessa consulta.

### Imagens e opções do produto

- Em **POST**, imagens novas usam `images: [{"type":"image/png", "content":"<base64>","enabled":true}]`.
- A API verifica a assinatura do arquivo (PNG/JPEG/WEBP) e grava-o em `media/products`. Use imagens com até 5 MiB (configurável por `MAX_IMAGE_BYTES`); o JSON da requisição suporta até 20 MiB.
- Em **PUT**, `images: [{"id":1,"deleted":true}]` apaga a imagem, ou `images: [{"id":1,"type":"image/png","content":"<base64>"}]` troca o arquivo.
- `images: [{"id":1,"enabled":true}]` só altera a visibilidade. Referências de imagens existentes por `id` podem ser preservadas sem fazer novo upload.
- **Opções** seguem o mesmo padrão: crie com `title`, `shape`, `type`, `values`; atualize por `id`; remova com `deleted:true`.
- A API aceita `value` (singular) como alias de `values` e `radius` como inteiro ou string no formato `"4px"`, normalizando no banco.
- Arrays omitidos num `PUT` permanecem inalterados; `category_ids: []` remove todas as categorias. Os arquivos antigos são apagados após o commit do banco.
- Ao excluir um produto, o banco apaga os vínculos em cascata e o servidor apaga os arquivos de mídia.

## Estrutura

```text
src/
  config/         .env, conexão Sequelize e sequelize-cli
  controllers/    Camada HTTP/status
  middleware/     Bearer JWT, autorização e erros
  models/         Models e associações Sequelize
  routes/         Rotas Express /v1
  services/       Regras de negócio e transações
  utils/          Validação, tratamento e arquivos
  app.js          Configuração de middlewares/Swagger
  server.js       Inicialização e conexão ao MySQL
migrations/       Criação e reversão das seis tabelas
seeders/          Dados opcionais de demonstração
docs/openapi.yaml Contrato completo Swagger
media/products/   Imagens armazenadas localmente (fora do Git)
tests/            Unitários e integração MySQL
```

## Executar os testes

```bash
npm run check                      # sintaxe de todos os .js
npm run test:unit                  # sem dependência de banco
npm run test:coverage              # cobertura
```

Os testes com MySQL são opcionais e **não apagam a base inteira**. Para executar:

1. Crie uma base vazia `digital_store_test` no MySQL (não use a base de desenvolvimento).
2. Defina `DB_NAME=digital_store_test` e execute `npm run db:migrate`.
3. Na mesma configuração de ambiente, execute `RUN_DB_TESTS=1 npm run test:integration`.

> Os testes de integração exigem um banco de teste isolado. A suite protege contra `DB_NAME=digital_store` por padrão.

## Consumo no front React

No `.env` do **front** (Vite), configure `VITE_API_URL=http://localhost:3001/v1` e faça requisições com `fetch` ou `axios`. O backend libera CORS apenas para `http://localhost:5173` por padrão (ou URLs adicionadas em `FRONTEND_ORIGIN`, separadas por vírgula). **Não copie código de servidor para o front**. A integração das telas do Figma é uma etapa independente.

## Decisões sobre divergências da documentação

O README oficial apresenta dois pontos ambíguos: (1) exige Bearer em todo POST, mas `POST /v1/user/token` e `POST /v1/user` precisam ser públicos para permitir autenticação e primeiro cadastro; (2) cita `400` na ausência de token em uma seção e `401` nas rotas protegidas. Esta implementação **libera exclusivamente cadastro e login** e usa `401` para ausência/token inválido nos endpoints protegidos, conforme semântica HTTP e tabelas das rotas. A documentação também alterna `value`/`values` e `radius` numérico/`px`, tratados por compatibilidade. Campos de produto e suas tabelas seguem a especificação (inclusive `FLOAT` solicitado para preços).

## Segurança e produção

- JWT HS256 com segredo forte definido no `.env`, expiração configurável. Login com rate limit.
- bcrypt com custo 12. Cadastro, JSON e campos validados. Senha e hash não são retornados na API.
- Atualização/deleção de usuário só com o token do próprio usuário.
- IDs e nomes de arquivos gerados no servidor; MIME e assinatura do arquivo verificados, evitando path traversal.
- Antes de colocar online, configure HTTPS, `FRONTEND_ORIGIN`, `PUBLIC_BASE_URL`, segredo real, credenciais de banco, limites de payload, monitoramento e backup. Mídia local exige volume persistente se for hospedada em contêiner.

Referência do enunciado: https://github.com/digitalcollegebr/projeto-backend
