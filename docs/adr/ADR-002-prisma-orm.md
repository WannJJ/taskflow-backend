# ADR-002: Prisma as the ORM

## Status

Accepted

## Context

We needed an ORM that provides:

- Type-safe database queries
- Auto-generated TypeScript types from schema
- Easy migration management
- Good PostgreSQL support
- Intuitive query API

## Decision

We chose **Prisma** over TypeORM, Sequelize, and raw SQL/query builders.

## Consequences

### Positive

- **Type safety**: `prisma.user.findUnique()` returns fully typed results
- **Schema-first**: Single source of truth in `schema.prisma`
- **Migrations**: `prisma migrate dev` handles schema versioning automatically
- **Prisma Studio**: Visual database inspector for debugging
- **Relations**: Declarative `@relation` syntax is cleaner than TypeORM decorators
- **Performance**: Query engine is written in Rust, compiled to native code

### Negative

- **Not pure TypeScript**: Requires running `prisma generate` after schema changes
- **Limited raw SQL**: Complex queries sometimes require `$queryRaw`
- **Migration conflicts**: Team collaboration on schema changes requires discipline
- **Bundle size**: Prisma Client is ~15MB

## Alternatives Considered

- **TypeORM**: Active Record/Data Mapper patterns, but decorator-heavy and has type inference issues
- **Sequelize**: Mature but lacks modern TypeScript support
- **Drizzle**: Lightweight and SQL-like, but newer and less mature ecosystem
- **Raw SQL (pg)**: Maximum control but zero type safety and more boilerplate

## References

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma vs TypeORM](https://www.prisma.io/docs/orm/more/comparisons/prisma-and-typeorm)
