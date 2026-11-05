# Kanban - Lavanderia Costão

O Kanban é o sistema utilizado pela Governança (equipe da lavanderia) e pela MaxClean (motoristas) para receber e gerenciar os pedidos de lavanderia realizados pelos hóspedes através do formulário.

O hóspede faz o pedido pelo Formulário (repositório lav-front), que é enviado para o Kanban. O motorista recebe a notificação do Novo Pedido, coleta na UH solicitante, e entrega à governança que realiza o serviço. 

## Instalação

Na pasta raiz do projeto (`/kanban`), instale as dependências executando:

    pnpm install

## Configuração do Banco de Dados

Certifique-se de que o arquivo `.env` está preenchido corretamente (use o `.env.example` como base; `POSTGRES_PASSWORD` e `POSTGRES_URL` são necessários para o banco).

As migrations só podem ser executadas **depois que o contêiner do banco estiver rodando** (veja os passos de execução abaixo). Com o banco no ar, prepare e sincronize o schema com:

    pnpm db:migrate
    pnpm db:push

## Execução

### Execução Local (Ambiente de Desenvolvimento)
Para rodar a aplicação localmente com o banco de dados apontando para o seu localhost:

1. No arquivo `.env`, certifique-se de que a variável `POSTGRES_URL` contém a referência para o localhost (ex: `(...)pass@localhost:(...)`).

2. Suba o contêiner do banco de dados de desenvolvimento:

       sudo docker compose -f docker-compose.dev.yml up -d

3. Com o banco no ar, rode as migrations:

       pnpm db:migrate
       pnpm db:push

4. Inicie o servidor da aplicação:

       pnpm run dev

### Execução Integrada (Para testar o fluxo de pedidos)
Para rodar a aplicação simulando a infraestrutura completa de contêineres e permitir o teste integrado com o front-end:

1. No arquivo `.env`, altere a variável `POSTGRES_URL` para referenciar o contêiner do postgres (ex: `(...)pass@postgres:(...)`).
2. Suba a infraestrutura do docker:

       docker compose up -d

3. Com o banco no ar, rode as migrations. Como os comandos são executados na sua máquina, e não dentro da rede do docker, o host `postgres` não é encontrado (`getaddrinfo ENOTFOUND postgres`). Sobrescreva a `POSTGRES_URL` apontando para `localhost` na própria linha de comando, sem precisar alterar o `.env`:

       POSTGRES_URL="postgresql://kan:<senha>@localhost:5432/kan_db" pnpm db:migrate
       POSTGRES_URL="postgresql://kan:<senha>@localhost:5432/kan_db" pnpm db:push

Nesse modo a aplicação já sobe dentro do contêiner `web`, então não é necessário rodar `pnpm run dev`. Ele só é usado na Execução Local, quando apenas o banco está no docker, para ter hot reload.

## Produção
Link para a aplicação em produção: [adm.lavanderia.costao.com.br](https://adm.lavanderia.costao.com.br)

Esta aplicação roda na máquina NEFTIS, com docker-compose utilizando imagem armazenada no registry. O mesmo ocorre para o front-end (lav-front), que contém as instruções em seu próprio repositório.

1. **Buildar a imagem**

       docker build -t cr.costao.com.br/kanban:v0.0.0 -f apps/web/Dockerfile .

2. **Logar no registry**

       docker login cr.costao.com.br -u <user> -p <password>

3. **Dar push na imagem**

       docker push cr.costao.com.br/kanban:v0.0.0

4. **Atualizar no servidor**

   Acesse a máquina NEFTIS e entre na pasta do projeto:

       cd /var/www/kanban-lavanderia/kanban

   Derrube o container atual:

       docker compose down

   Remova a imagem antiga, já que as imagens são grandes e ocupam muito espaço no servidor. Confira a imagem com `docker images` e remova pela tag:

       docker images
       docker image rm cr.costao.com.br/kanban:v0.0.0

   A saída deve mostrar `Untagged` e `Deleted`. Se aparecer apenas `Untagged`, a imagem possui outra tag e continua ocupando espaço: remova as demais tags ou use o `IMAGE ID`.

   Baixe a nova imagem:

       docker pull cr.costao.com.br/kanban:v0.0.0

5. **Subir o container novamente**

       docker compose up -d

   Caso esteja utilizando versionamento, é necessário atualizar a tag da imagem no `docker-compose.yml` antes de subir o container.
