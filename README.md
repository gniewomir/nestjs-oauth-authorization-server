# What and why? 

I want to:
- test some of my ideas on how to apply DDD to TS based backends.
- test how well coding LLMs can follow patterns
- have an own OAuth auth server for future projects 

Repo will be intentionally heavily overengineered for what it actually does.

If somebody will find any use for it, great. But as long as it is not deployed I might force updates and squash migrations. You have been warned.  

# Documentation 

The Repository contains documentation organized in the `./docs` directory with two main categories:

## Mostly Hand-Written Documentation (`./docs`)

Decision documentation written by hand during development:
* `ADD-{decisions-subject}.md` - reasoning behind architecture decisions 
* `DDD-{decisions-subject}.md` - reasoning behind domain decisions 
* `TDD-{decisions-subject}.md` - reasoning behind technical decisions

## Generated Documentation (`./docs/overview/`)

Architectural documentation generated using LLM from codebase analysis (might be outdated):
* `ARCHITECTURE-OVERVIEW.md` - high-level introduction to architectural patterns
* `ARCHITECTURE-PATTERNS.md` - detailed explanation of design patterns used
* `ARCHITECTURE-LAYERS.md` - deep dive into layered architecture implementation
* `ARCHITECTURE-TESTING.md` - comprehensive testing strategies and patterns
* `ARCHITECTURE-DOMAIN-MODEL.md` - detailed domain model and business concepts
* `ARCHITECTURE-SUMMARY.md` - overview of all documentation and reading guide

## Cursor docs (`./cursor`)

Attempts at convincing LLM's to adhere to the conventions I want to establish in this code base. Hit or miss. 


# Setup
```shell
$ cp .env.dist .env
$ nvm use 
$ npm install 
$ npm run crypto:keys
$ npm run test
```

# Test
```shell
$ nvm use
# seed database with example oauth client and user (not credentials in console)
$ npm run test:manual:seed
# update env
$ sed -i '/OPENAPI_EXPOSED=false/c\OPENAPI_EXPOSED=true' .env
$ sed -i '/NODE_ENV=production/c\NODE_ENV=development' .env
$ sed -i '/APP_LOG_LEVEL=warn/c\APP_LOG_LEVEL=debug' .env
# build application
$ npm run build
# start application
$ npm run start:dev
# go to http://localhost:3000/open-api
# chose "authorize"
# provide oauth client id
# choose all scopes
# have fun
```

# Env
To generate new default env file based on configuration (will replace .env.dist)
```shell
$ ./bin/default-env.sh
```

To merge current environment with configuration changes (will replace .env preserving values for KNOWN variables)
```shell
$ ./bin/merge-env.sh
```

# Database

Setup or reset test database
```shell
$ ./bin/reset-test-db.sh
```
It will: 
* create or recreate container named `postgres_test` and run it on port 5432
  * data will be removed 
* build project and run migrations against it

## Migrations 
```shell
$ npm run migration:run
$ npm run migration:generate --name=test
$ npm run migration:create --name=test
```