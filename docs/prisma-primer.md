# Prisma ORM Primer

## Why ORMs Exist
- Databases speak SQL; applications speak JavaScript/TypeScript. An ORM (Object-Relational Mapper) translates between the two so you write code, not raw SQL.
- Prisma Client is an auto-generated library tailored to your schema. Import it, call methods like `prisma.user.findMany()`, and Prisma handles the SQL plus result parsing.
- Benefits: compile-time checks, autocompletion, and one mental model whether you’re on SQLite, Postgres, or MySQL.

## Prisma Client Essentials
- Instantiate once and reuse; in Next.js, follow the `globalThis.prisma` pattern so hot reloads don’t spawn extra connections.
- Queries are async functions returning promises; `await prisma.city.findMany({ where: { name: "Boston" } })` yields typed JS objects.
- `select` chooses columns; `include` eagerly loads relations. Combine both for precise payloads and predictable performance.

## Type Safety Superpowers
- Prisma generates `.d.ts` files mirroring your schema. Mistyping a column or passing the wrong type breaks at compile time.
- Narrow large responses with reusable args:
  ```ts
  const cityArgs = {
    select: {
      id: true,
      name: true,
      distributions: {
        select: { month: true, numberDiapers: true },
      },
    },
  } as const;
  type CityWithDistributions = Prisma.CityGetPayload<typeof cityArgs>;
  ```
- When building dynamic filters, use `satisfies`:
  ```ts
  const cityFilter = {
    name: { equals: name, mode: "insensitive" },
  } satisfies Prisma.CityWhereInput;
  ```
  TypeScript ensures you only use valid conditions while keeping the object mutable.

## Query Patterns You’ll Use Constantly
- **Filtering**: `where` supports nested `AND`/`OR` logic; build objects first, then spread them into the query for clarity.
- **Pagination**: pair `take`, `skip`, and `orderBy`; stable ordering is required for reliable paging.
- **Aggregations**: `aggregate` and `groupBy` let you compute sums/averages without raw SQL.
- **Relations**:
  ```ts
  prisma.city.findMany({
    include: {
      distributions: {
        where: { year: "2025" },
        select: { numberDiapers: true },
      },
    },
  });
  ```
  Load only what you need—large relations can explode response size.

## Readability & Reuse
- Wrap repeated query shapes in helpers (e.g., `getCityDistributions(name, { year })`) to keep API routes lean and testable.
- Keep raw Prisma calls near the data boundary; business logic should operate on domain objects, not ORM calls.
- Export helper return types derived from Prisma so callers know the exact payload.

## Handling BigInts and Unsupported Columns
- Postgres `bigint` becomes JS `bigint`. Convert at the edge (e.g., `Number(value)`) or serialize with a custom replacer to avoid runtime errors.
- Prisma marks unsupported PostGIS columns (like `geometry`). Use `prisma.$queryRaw`/`ST_AsGeoJSON` to pull GeoJSON, then wrap those helpers for the rest of the app.

## Error Handling & Logging
- Catch Prisma errors at API boundaries; respond with friendly messages while logging stacks for debugging.
- Enable query logging in dev: `new PrismaClient({ log: ["query", "error"] })` to inspect generated SQL and timings.
- Handle specific error codes (P2002 duplicate, P2025 not found) to give users actionable feedback.

## Performance Tips
- Avoid N+1 queries: either use `include` or batch lookups with `in` filters.
- Reach for raw SQL when Prisma can’t express a complex report, but keep it isolated and typed.
- Close connections in scripts (`await prisma.$disconnect()`) so Node processes exit cleanly.

## Testing Strategy
- Point `DATABASE_URL` to a dedicated test database; Prisma respects environment variables.
- Seed deterministic fixtures before each test run to keep assertions stable.
- Mock Prisma for unit tests as needed, but integration tests against a real DB catch more issues.

## Mental Model Recap
1. Define your schema → Prisma generates a tailored client.
2. Import `prisma` → write expressive, typed queries.
3. Let TypeScript guide you; if it compiles, the query shape matches your schema.
4. Keep queries focused, helpers reusable, and errors explained.

With this roadmap, newer developers can approach databases using TypeScript-first tooling, focusing on business logic instead of SQL string juggling.
