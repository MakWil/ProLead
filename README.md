## Stocks Users CRUD (Node.js + Express + PostgreSQL)

Simple CRUD app for a `users` table (name, age, date_of_birth, favorite_food).

### Run locally

1. Install deps:
```
npm install
```
2. Copy env and set DB URL:
```
cp .env.example .env
# edit .env if needed
```
3. Start dev server:
```
npm run dev
```
Open http://localhost:3000

### Environment
- PORT (default 3000)
- DATABASE_URL or PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD

### Deploy (server)
Use PM2 + Nginx. Example `.env`:
```
PORT=3000
DATABASE_URL=postgres://stocks_user:password@localhost:5432/stocksdb
```

