# Technical Design Document—Domain Repositories

## Vocabulary
* `persistence` any way of preserving state of the application, which will typically mean a database, but is not limited to it. It can be other REST API, filesystem, etc.
* `invariant` is an assumption that must always hold true—i.e., if we received a payment, amount must be positive, currency specified, and one that we accept. Invariant violation is a critical error.   
* `Domain Object` object that cannot be created in a state or updated to a state that violates our current understanding of domain rules - or in other words `invariants`.
* `aggregate` is a `Domain Object` that contains other `Domain Objects`, that have to maintain some `invariants` as a whole. You cannot change items on already booked invoice without issuing correction. To maintain this `invariant` only way to modify invoice items is via invoice aggregate. You do not provide any way to do it outside it.     
* `Domain Object interface` interface describing how to retrieve, persist or count etc. `Domain Objects`
* `Domain Repository` is a part of infrastructure, that implements `Domain Object interface` and hides all the complexity of dealing with the `persistence` - it can only return `Domain Objects`.

## Decisions 
* `Domain repositories` are intended as the **only way of writing** to the database or other persistence in the whole application.
* `Domain repositories` persist and retrieve only `Domain Objects`
* `Domain repositories` are concerned with:
  * implementing `Domain Object interfaces`
    * `persisting` and `retriving` `Domain Objects`, other than that, they might query `persistence` only in a **read-only** way
      * maintaining data integrity when persisting `aggregates`
        * by wrapping all required updates in `transaction`.
      * publishing appropriate events aggregated by `Domain object`, after `transaction` was successfully commited
    * mapping `Domain Objects` to database and back.
    * providing `in-memory` implementation of `Domain Object interfaces`, to allow for easy testing of `Domain Layer`
* `Domain repositories` are **not** concerned with:
    * any kind of validation or maintaining `invariants`
      * as this is sole responsibility of `Domain Objects`

## Benefits 
* Break a subconscious assumption created by ORM's, that database entities models represent business-relevant concepts directly (which even if roughly true at some point, always end with the first aggregate)
* Break a subconscious assumption created by ORM's that database entities models should match API responses.
* If our architecture provides more than one way of changing database entity (which is default), what we get is in reality dreaded global state - modifiable from any part of the application and possibly breaking `aggregate` invariants. 
* Because `Domain Objects` are intended to express, preserve and enforce domain knowledge/business invariants, **by constraining ourselves to persist and retrieve only `Domain Objects`**, we can trust that data stored in persistence is valid—which means that it matches our current understanding of the domain. 
  * Because of that, we have a one-source of truth what is valid in our application - `Domain Layer` consisting of `Domain Objects`
    * `Domain Layer` is easily, cheaply and swiftly unit testable, as it depends only on `Domain Interfaces`, 
      * that can be replaced by using deterministic `in-memory` implementation of `Domain repositories`
        * which spares us from a lot of fragile, maintenance heavy mocking
  * We can have separate **read-only** repositories optimized for fast reads and ignoring both `Domain Objects` and how they are represented i.e., by ORM models. 

## Costs

TODO
