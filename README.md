# Kanban - Lavanderia Costão

O Kanban é o sistema utilizado pela Governança (equipe da lavanderia) e pela MaxClean (motoristas) para receber e gerenciar os pedidos de lavanderia realizados pelos hóspedes através do formulário.

## Instalação

Na pasta raiz do projeto (`/kanban`), instale as dependências executando:

    pnpm install

## Configuração do Banco de Dados

Certifique-se de que o arquivo `.env` está preenchido corretamente. Para preparar e sincronizar o banco de dados, execute os comandos abaixo:

    pnpm db:migrate
    pnpm db:push

## Execução

### Execução Local (Ambiente de Desenvolvimento)
Para rodar a aplicação localmente com o banco de dados apontando para o seu localhost:

1. No arquivo `.env`, certifique-se de que a variável `POSTGRES_URL` contém a referência para o localhost (ex: `(...)pass@localhost:(...)`).
2. Suba o contêiner do banco de dados de desenvolvimento:

       sudo docker compose -f docker-compose.dev.yml up -d

3. Inicie o servidor da aplicação:

       pnpm run dev

### Execução Integrada (Para testar o fluxo de pedidos)
Para rodar a aplicação simulando a infraestrutura completa de contêineres e permitir o teste integrado com o front-end:

1. No arquivo `.env`, altere a variável `POSTGRES_URL` para referenciar o contêiner do postgres (ex: `(...)pass@postgres:(...)`).
2. Suba a infraestrutura do docker:

       docker compose up -d

3. Inicie o servidor da aplicação:

       pnpm run dev

## Produção
Link para a aplicação em produção: [adm.lavanderia.costao.com.br](https://adm.lavanderia.costao.com.br)
