# Database
```shell
$ docker run -p 5432:5432 --name postgres -e POSTGRES_PASSWORD=test -e POSTGRES_USER=test -e POSTGRES_DB=test -d postgres
$ npm run start:dev
$ npm run migration:generate --name=test
$ npm run migration:create --name=test
```