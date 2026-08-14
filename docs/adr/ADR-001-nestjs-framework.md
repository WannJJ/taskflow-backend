# ADR-001: NestJS as the Backend Framework

## Status

Accepted

## Context

We needed a robust backend framework for TaskFlow that supports:

- Modular architecture for scalability
- Built-in dependency injection
- Strong TypeScript support
- Enterprise-grade patterns (Controllers, Services, Guards, Pipes)
- Good documentation and hiring market appeal

## Decision

We chose **NestJS** over Express.js, Fastify (standalone), and AdonisJS.

## Consequences

### Positive

- **Structured architecture**: Module/Controller/Service pattern enforces clean code separation
- **Dependency Injection**: Built-in IoC container makes testing and mocking trivial
- **Decorators & Metadata**: `@Controller()`, `@Get()`, `@UseGuards()` reduce boilerplate
- **Ecosystem**: Excellent integration with TypeORM, Prisma, Passport, Swagger
- **Hiring appeal**: Many companies use NestJS; demonstrates enterprise-level thinking
- **Testing**: Built-in testing utilities (`Test.createTestingModule`)

### Negative

- **Learning curve**: Steeper than Express for beginners
- **Opinionated**: Less flexible if we want to deviate from Nest patterns
- **Bundle size**: Slightly heavier than raw Fastify/Express
- **Magic**: Heavy use of decorators can obscure control flow for newcomers

## Alternatives Considered

- **Express.js**: Too minimal; we'd have to build DI, routing structure, and validation from scratch
- **Fastify (standalone)**: Excellent performance, but lacks the architectural opinions we wanted for a portfolio project
- **AdonisJS**: Good framework, but smaller community and less hiring recognition in our target market

## References

- [NestJS Docs](https://docs.nestjs.com/)
- [NestJS vs Express comparison](https://docs.nestjs.com/faq)
