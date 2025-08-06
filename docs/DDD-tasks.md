# Domain Decision Documentation—Tasks

## Problems to solve

* I find most task tracking/todo-list solutions tend to be too simplistic or too complicated
    * simplistic put too much before my eyes
    * complicated require too much effort to maintain in good health and put too much before my eyes
* What I need is a solution that puts before my eyes only what I can do at this particular moment
    * I want to trust the system and hide not relevant things, to keep my head clear and free from distractions GTD way

## Current understanding of the problem

* Every `Task` should be means for an end—therefore moving you forward towards some `Goal`
    * `Task` has to be attached to a `Assigne` who can complete it
    * `Task` can be completed
    * `Tasks` have to have order of intended completion
        * `Tasks` order is subject to change
            * Arbitrary changes
            * Postponement—which means moving the task to the end of the queue
                * important bit: in the context of the current filter
* Every `Goal` is archivable by completing enough `Tasks`
    * Goal order is subject to change
        * Arbitrary changes
* `Context`
    * Context order is subject to change
        * Arbitrary changes
* Every `Task` is doable only in particular `Context`, i.e.
    * I cannot dead-lift if I do not have barbell/dumbbells at home, therefore
        * If my `Goal` is getting jacked
            * And part of it is to dead-lift
                * This `Task` is doable only in the `Context` of the gym

## Solution

To limit what I can see, require that every `Task` has to have `Context` which makes it doable, so I can filter by it.
To refine results further, as a second filter lets create `Goals` so I can choose which one I can pursue in current
`Context`.

Result should be, that I can choose `Context` I'm in, see what `Goals` I can pursue in that `Context` and see only
relevant `Tasks` that I can achieve.

To limit the scope `Task`, `Goal`, `Context` for now will be described only by entity description - without attempts to
model time, location, dependencies between tasks, etc. and other constraints that can be easily expressed in writing.

## Vocabulary

* `Task` activity with a clearly defined outcome
* `Goal` a general outcome archivable by finishing `Tasks` i.e.,
    * loose weight
    * sort out your finances
    * finish a project at work
* `Context` combination of time, place and/or availability of something, that makes `Task` doable and desirable - i.e.
    * context for exercise i.e.: at home in the morning before work
    * context for paying taxes: before particular day of the month, when you are not working (evening?) and you have
      access to the internet.
    * context for paying your tab: when you are at your friendly bar
* `Assigne` person that is supposed to complete the `Task`

## Discovered questions

* Technical decision on how to express `Tasks` order. [Which will be explored in separate document](TDD-entity-ordering.md)?
    * Which is dependent on domain question. [Which will be explored in separate document](DDD-tasks-order.md)?
        * if `Tasks` order should be global,
        * or dependent on current view
            * combination of `Goal` and `Context`?
            * chosen `Goal` alone?
    * Which also leads to the same question for `Goals` and `Contexts`