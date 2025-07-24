# Architecture Design Document—Layered architecture

# Problems to solve

* Avoid mixing domain invariants with technical solutions to technical problems
* Knowledge preservation
* Allow unit testing domain invariants without setting up whole application

# Chosen approach

* Layered architecture,
    * `Interface` - which represents how outside world interacts with the application, i.e., HTTP-based API, GraphQL
      API, CLI interface etc.
    * `Application` - glue code bringing `Domain` and `Infrastructure` together
    * `Infrastructure` - which represents how application interacts with the outside world, i.e., databases,
      filesystems, vendor APIs etc.
    * `Domain` - application core concerned only with domain invariants
* Pragmatic Domain Driven Design