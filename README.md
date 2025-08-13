# What and why? 

I want to test some of my ideas on how to apply DDD to TS based backends.

Possibly have a template/reference for future projects. 

Repo will be intentionally heavily overengineered for what it actually does.

# Documentation 

The Repository contains documentation organized in the `./docs` directory with two main categories:

## Hand-Written Documentation (`./docs/human/`)

Decision documentation written by hand during development:
* `ADD-{decisions-subject}.md` - reasoning behind architecture decisions 
* `DDD-{decisions-subject}.md` - reasoning behind domain decisions 
* `TDD-{decisions-subject}.md` - reasoning behind technical decisions

## Generated Documentation (`./docs/generated/`)

Comprehensive architectural documentation generated using LLM from codebase analysis:
* `ARCHITECTURE-OVERVIEW.md` - high-level introduction to architectural patterns
* `ARCHITECTURE-PATTERNS.md` - detailed explanation of design patterns used
* `ARCHITECTURE-LAYERS.md` - deep dive into layered architecture implementation
* `ARCHITECTURE-TESTING.md` - comprehensive testing strategies and patterns
* `ARCHITECTURE-DOMAIN-MODEL.md` - detailed domain model and business concepts
* `ARCHITECTURE-SUMMARY.md` - overview of all documentation and reading guide

# Setup
```shell
$ cp .env.dist .env
$ nvm use 
$ npm install 
$ npm run test
```

# Database
```shell
$ docker run -p 5432:5432 --name postgres -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=test -d postgres
```

## Migrations 
```shell
$ npm run migration:generate --name=test
$ npm run migration:create --name=test
```