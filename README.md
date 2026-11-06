# Kanban - Lavanderia Costão

O Kanban é o sistema utilizado pela Governança (equipe da lavanderia) e pela MaxClean (motoristas) para receber e gerenciar os pedidos de lavanderia realizados pelos hóspedes através do formulário.

O hóspede faz o pedido pelo formulário ([Lavanderia Front](https://github.com/costao-td/lavanderia-front)), que é enviado para o Kanban. O motorista recebe a notificação do Novo Pedido, coleta na UH solicitante e entrega à Governança, que realiza o serviço.

> **Primeiro contato com o projeto?** Comece pelo início da [documentação do Lavanderia Front](https://github.com/costao-td/lavanderia-front). Ela explica o que o hóspede faz no formulário e como o pedido chega até o Kanban.

- Formulário (hóspedes): [lavanderia.costao.com.br](https://lavanderia.costao.com.br)
- Kanban (equipe): [adm.lavanderia.costao.com.br](https://adm.lavanderia.costao.com.br)

## Integração com o Lavanderia Front

O formulário não guarda os pedidos. Ele chama a API REST deste Kanban (`/api/v1`) pelo servidor:

| Requisição | O que faz |
|---|---|
| `POST /cards` | Cria o card do pedido (título `UH - data - hora`), com as labels de entrega (Express/Normal) e de embalagem (Cabide/Dobrado), na lista e com o membro configurados no front. |
| `POST /cards/:id/checklists` | Cria o checklist de itens do card. |
| `POST /checklists/:id/items` | Adiciona cada peça (quantidade, valor unitário e tipo de serviço). |
| `GET /cards/:id` | Usado pelas telas de consulta do pedido no formulário. |

Para a integração funcionar, o `.env` do Lavanderia Front precisa de dados que vêm deste Kanban:

- **Token de acesso à API** (`KBN_AUTH_TOKEN`): criado no Kanban, na tela de Configurações (chaves de API).
- **IDs públicos** da lista onde os pedidos são criados (`LIST_PUBLIC_ID`), do membro atribuído (`MEMBER_PUBLIC_ID`) e das labels Express, Normal, Cabide e Dobrado.

Se o board for recriado ou se você usar outro banco (por exemplo, o banco local), esses IDs mudam e o `.env` do front precisa ser atualizado.

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

4. Rode o formulário ([Lavanderia Front](https://github.com/costao-td/lavanderia-front)) para testar o envio de pedidos de ponta a ponta:
   - No `.env` do front, aponte o `BACKEND_URL` para a API deste Kanban (ex.: `http://localhost:3000/api/v1`) e preencha o token e os IDs de lista, membro e labels do seu Kanban local (veja [Integração com o Lavanderia Front](#integração-com-o-lavanderia-front)).
   - Rode o front com `bun dev`. Como a porta 3000 já está ocupada pelo Kanban, o Next.js sobe automaticamente na próxima porta livre (3001, 3002…).
   - Se o front estiver rodando em Docker, use `BACKEND_URL=http://host.docker.internal:3000/api/v1`.
   - Preencha o formulário e envie. O pedido deve aparecer como um card no board de pedidos do Kanban.

Nesse modo o Kanban já sobe dentro do contêiner `web`, então não é necessário rodar `pnpm run dev`. Ele só é usado na Execução Local, quando apenas o banco está no docker, para ter hot reload.

## Produção
Link para a aplicação em produção: [adm.lavanderia.costao.com.br](https://adm.lavanderia.costao.com.br)

Esta aplicação roda na máquina NEFTIS, com docker-compose utilizando imagem armazenada no registry. O mesmo ocorre para o front-end ([Lavanderia Front](https://github.com/costao-td/lavanderia-front)), que contém as instruções em seu próprio repositório.

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

## Sistemas relacionados
- [Lavanderia Front](https://github.com/costao-td/lavanderia-front): formulário em que os hóspedes fazem os pedidos que viram cards neste Kanban.
