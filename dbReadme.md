# Database Setup

## 1. Start the Database

```bash
docker run -e POSTGRES_PASSWORD=creapwd -p 5432:5432 postgres
```

## 2. Configure Environment

Add to `.env`:

```
DATABASE_URL="postgresql://postgres:creapwd@localhost:5432/postgres"
```

## 3. Initialize the Database

In a new terminal tab:

```bash
npm run db:generate
npm run db:migrate
```

## 4. Start the Project

```bash
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run the app in watch mode (auto-restarts on file changes) |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` |
| `npm run start` | Run the compiled app from `dist/` |
| `npm run db:migrate` | Apply pending Prisma migrations to the database |
| `npm run db:generate` | Regenerate the Prisma client from the schema |
| `npm run db:push` | Push schema changes to the database without creating a migration |
