# Documentation 

The Repository contains documents in different places, describing my line of thinking
* `ADD.md` reasoning behind architecture decisions 
* `DDD.md` reasoning behind domain decisions 
* `TDD.md` reasoning behind technical decisions

# Database
```shell
$ docker run -p 5432:5432 --name postgres -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=test -d postgres
```

## Migrations 
```shell
$ npm run migration:generate --name=test
$ npm run migration:create --name=test
```