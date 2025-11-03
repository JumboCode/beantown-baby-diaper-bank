# Beantown Baby Diaper Bank

This JumboCode project repository powers the Beantown Baby Diaper Bank’s hot map features.
Follow the instructions below to install prerequisites, clone the repo, and start development.

⚠️ **Important:** Please complete _all_ of these steps **each time you start working** to make sure you are always working with the most recent changes from the repository.

---

## 1. Install Prerequisites

### Node.js

We use Node.js to run the development server.

- Download and install Node.js (LTS version recommended):  
  👉 https://nodejs.org/en/download
- Verify installation:
  ```bash
  node -v
  npm -v
  ```

### Git

We use Git for version control and syncing code.

- Download and install Git:  
  👉 https://git-scm.com/downloads
- Verify installation:
  ```bash
  git --version
  ```

---

## 2. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/JumboCode/beantown-baby-diaper-bank.git
cd beantown-baby-diaper-bank
```

---

## 3. Install Dependencies

Inside the project folder, install dependencies with:

```bash
npm install
```

---

## 4. Stay Up To Date

Before starting development **each time**, make sure you pull the latest changes:

```bash
git pull origin main
npm install
```

---

## 5. Start the Development Server

Run the following command:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Configure Database Access (Prisma + Supabase)

Our API routes now use Prisma to talk directly to the Supabase Postgres database.
Before hitting them locally:

1. Create a `.env.local` file in the project root (Next.js loads it automatically).
2. Add the Supabase connection string. Prisma expects the full URL including any optional query
   params Supabase suggests (e.g. `?pgbouncer=true&connection_limit=1`):

   ```bash
   DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:6543/postgres
   ```

3. Install dependencies (this runs `prisma generate` automatically):

   ```bash
   npm install
   ```

   If you already have `node_modules`, you can regenerate manually with
   `npm run prisma:generate`.

4. Restart `npm run dev` so the new env vars are picked up.

---

## 7. Workflow Notes

- Always **`git pull`** before making changes.
- Create a new branch for your work:
  ```bash
  git checkout -b feature/my-feature
  ```
- Commit and push your branch, then open a Pull Request (PR) for review.

---

## Helpful Links

- Node.js docs: https://nodejs.org/docs
- Git docs: https://git-scm.com/doc
- Next.js docs (framework used in this repo): https://nextjs.org/docs
