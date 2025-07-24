# Documentation 

The Repository contains documentation for decisions made
* `ADD-{decision-or-subject}.md` reasoning behind architecture decisions 
* `DDD-{decision-or-subject}.md` reasoning behind domain decisions 
* `TDD-{decision-or-subject}.md` reasoning behind technical decisions

# Database
```shell
$ docker run -p 5432:5432 --name postgres -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=test -d postgres
```

## Migrations 
```shell
$ npm run migration:generate --name=test
$ npm run migration:create --name=test
```