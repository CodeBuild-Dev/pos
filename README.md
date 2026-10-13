# Shop POS — Point of Sale & Inventory Dashboard

A full-stack point-of-sale system for small shops: fast billing with barcode scanning, inventory with low-stock alerts, sales history, customers and a revenue dashboard.

**Stack:** React · TypeScript · tRPC · Express · PostgreSQL · Drizzle ORM

---

## Features

**Billing**
- Cart-based checkout with discounts
- **Barcode scanning** with a USB/Bluetooth scanner or the phone camera
- Prices in Pakistani Rupees (stored as integer paisa to avoid rounding errors)

**Inventory**
- Products with categories, barcodes, stock levels and low-stock thresholds
- Low-stock alerts on the dashboard and in the notification bell
- Search, filters and pagination

**Sales & customers**
- Sales history with filters and full transaction details
- Customer list with purchase stats

**Dashboard**
- Revenue and sales charts for the last day, 3 days, week, month or year
- Sales by category

**Staff & security**
- Two roles: `admin` (everything, including staff management) and `salesperson` (billing, products, customers, sales)
- Admins create staff accounts; there is no public sign-up
- JWT access + refresh tokens, bcrypt passwords, forgot/reset password by email
- Audit log of create/update/delete actions
- Security headers (Helmet) and rate-limited login and password-reset endpoints
- Light / dark theme

---

## Tech stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Recharts, html5-qrcode |
| API      | tRPC on Express, Zod validation |
| Auth     | JWT, bcrypt |
| Database | PostgreSQL with Drizzle ORM and migrations |
| Email    | Resend (optional) |
| Tooling  | pnpm workspaces (monorepo) |

```
client/    React app
server/    Express + tRPC API — routes → services → database
shared/    Types and Zod schemas shared by client and server
drizzle/   SQL migrations
```

---

## Getting started

**Requirements:** Node.js 20+, pnpm 9+, PostgreSQL 14+

```bash
git clone https://github.com/CodeBuild-Dev/pos.git
cd pos
pnpm install

cp .env.example .env    # then set DATABASE_URL and JWT_SECRET
pnpm db:migrate         # create tables
pnpm db:seed            # demo products, customers, sales and an admin account
pnpm dev                # app on http://localhost:5173, API on :3001
```

Sign in with the demo admin printed by the seed: `admin@shoppos.local` / `changeme123`. Change it before using the app for real.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Signs login tokens (16+ random characters) |
| `APP_URL` | Optional | Used in password-reset links (default `http://localhost:5173`) |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Optional | Sends password-reset emails. Without a key, reset links are printed to the server log |

See [.env.example](./.env.example). Never commit your `.env` file.

---

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run the app and API together in watch mode |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Load demo data |
| `pnpm build` | Build the frontend |
| `pnpm start` | Start the production server (serves the API and the built app) |

---

## License

[MIT](./LICENSE)
