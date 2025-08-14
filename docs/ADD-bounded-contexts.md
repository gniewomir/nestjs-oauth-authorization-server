# Architecture Design Document—Bounded Contexts

Each directory under domain is supposed to be a `BoundedContext`

Therefore,

* authentication `User` entity and tasks `Assigne` entity refer to the same database entity
    * but tasks have no business in knowing properties of `User` related to its authentication or PIIs
    * just like in context of tasks knowlege about user having refresh token is irelevant

