# Grid Dominion — Backend (Node.js + Express + MongoDB)

Custom backend for a MERN stack app. No Supabase / Firebase / Prisma / PostgreSQL.

## Setup

```bash
cd server
cp .env.example .env       # fill MONGODB_URI and JWT_SECRET
npm install
npm run migrate            # syncs MongoDB indexes
npm run dev                # starts http://localhost:5000
```

MongoDB must be running locally or use MongoDB Atlas.

Set `MONGODB_URI` in `.env` to your local or Atlas connection string.

## Endpoints

| Method | Path               | Auth | Body                        |
| ------ | ------------------ | ---- | --------------------------- |
| GET    | `/health`          | no   | —                           |
| POST   | `/api/auth/signup` | no   | `{ name, email, password }` |
| POST   | `/api/auth/login`  | no   | `{ email, password }`       |
| GET    | `/api/auth/me`     | yes  | —                           |
| POST   | `/api/auth/logout` | yes  | —                           |
| GET    | `/api/dashboard`   | yes  | —                           |

Send `Authorization: Bearer <token>` on protected routes.

## Folder structure

```
server/
  config/         MongoDB connection
  controllers/    request handlers
  middlewares/    auth, errors
  models/         Mongoose models
  routes/         express routers
  utils/          jwt, bootstrap helpers
  index.js        app entry
```

## Security

- helmet, CORS allowlist, JSON body limit
- express-rate-limit (global + stricter auth)
- bcrypt (12 rounds) password hashing
- JWT (HS256) with configurable expiry
- Mongoose models with indexed collections
- Secrets only in `.env`

## Frontend integration

Set in your frontend `.env`:

```
VITE_API_URL=http://localhost:5000
```

Use `src/lib/api.ts` (provided in frontend) to call the API.
