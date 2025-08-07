# What and why? 

I want to test some of my ideas on how to apply DDD to TS based backends.

Possibly have a template/reference for future projects. 

Repo will be intentionally heavily overengineered for what it actually does.

# Documentation 

The Repository contains documentation for decisions made in `./docs` directory
* `ADD-{decisions-subject}.md` reasoning behind architecture decisions 
* `DDD-{decisions-subject}.md` reasoning behind domain decisions 
* `TDD-{decisions-subject}.md` reasoning behind technical decisions

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