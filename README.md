# Beantown Baby Diaper Bank

This JumboCode project repository powers the internal data ingestion dashboard and public-facing distribution maps for the **Beantown Baby Diaper Bank**. It provides automated CSV data ingestion, geographic distribution metrics, and a full administrative dashboard for tracking operations across Boston.

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Database**: PostgreSQL via [Supabase](https://supabase.com/)
- **ORM**: [Prisma 6](https://www.prisma.io/)
- **Authentication**: [Clerk](https://clerk.com/)
- **Component Library**: [Mantine UI v8](https://mantine.dev/)
- **Mapping**: [Leaflet](https://leafletjs.com/) with `react-leaflet`
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/) & Mantine CSS

---

## 🚀 Getting Started

Follow these instructions to install prerequisites, clone the repository, and start local development.

### 1. Install Prerequisites

- **Node.js**: Download and install Node.js (LTS version recommended) 👉 [nodejs.org](https://nodejs.org/en/download)
- **Git**: Download and install Git 👉 [git-scm.com](https://git-scm.com/downloads)

Verify installation in your terminal:

```bash
node -v
npm -v
git --version
```

### 2. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/JumboCode/beantown-baby-diaper-bank.git
cd beantown-baby-diaper-bank
```

### 3. Install Dependencies

Inside the project folder, install all required `npm` packages:

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env.local` file in the project root containing your development keys. You will need access to our Supabase database and Clerk authentication keys for the application to function.

```bash
# Database (Prisma expects the full Postgres URL with pgbouncer params if applicable)
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:6543/postgres

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 5. Generate Prisma Client

To ensure your local Prisma client matches the schema of the remote database and features the necessary types, you must generate the client. This typically runs automatically during `npm install`, but you can trigger it manually:

```bash
npm run prisma:generate
```

> **Note**: Database seeding for City Boundaries can be run via `npm run prisma:seed:city-boundaries` if directed.

### 6. Start the Development Server

Run the development server using Turbopack for faster refreshes:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application!

---

## 👥 Development Workflow

⚠️ **Important:** Please complete these steps **each time you start working** to prevent merge conflicts and ensure you are developing against the latest stable branch.

1. **Pull the latest changes**:

   ```bash
   git checkout main
   git pull origin main
   npm install
   ```

2. **Create a new branch**:
   Use a descriptive name for your feature or fix.

   ```bash
   git checkout -b feature/my-new-feature
   ```

3. **Commit and Push**:
   Commit your work clearly and push your branch to GitHub.

   ```bash
   git add .
   git commit -m "Add responsive grid to map dashboard"
   git push -u origin feature/my-new-feature
   ```

4. **Pull Request (PR)**:
   Navigate to the GitHub repository and open a Pull Request against the `main` branch. Request a review from the tech lead before merging!

---

## 📖 Helpful Links & Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Mantine v8 UI Components](https://mantine.dev/core/)
- [Prisma Client Reference](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Clerk Authentication Docs](https://clerk.com/docs)
- [React Leaflet Docs](https://react-leaflet.js.org/)
