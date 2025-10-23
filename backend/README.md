# 🚀 Projeto Backend — NestJS + PostgreSQL

Este projeto é uma API desenvolvida com **NestJS**, utilizando **TypeORM** para integração com banco de dados **PostgreSQL**.  
A configuração inclui suporte tanto para execução local quanto com **Docker Compose**.

## 🧰 Requisitos

Antes de começar, certifique-se de ter instalado:
- [Node.js 22+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)


## ⚙️ Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```bash
# App
PORT=3030
BCRYPT_SALT=salt

DB_PORT=5100
DB_DATABASE=paciente360_db
DB_USERNAME=postgres
DB_PASSWORD=postgres

BCRYPT_SALT="salt"
JWT_SECRET="secret"
```

## 🧩 Executando o projeto

Instale as dependências:
```bash
npm install
```

Inicia todos os containers definidos no arquivo docker-compose.yml
```bash
sudo docker compose up -d
```
Rode a aplicação:
```bash
npm run start
```

Acesse:

- API: http://localhost:3030

- Swagger (se habilitado): http://localhost:3001/api