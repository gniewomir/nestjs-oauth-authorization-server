# Technical Design Document—Tasks Order

## Problems to solve

* [As discovered](DDD-tasks.md) I need to find a solution allowing to keep `Tasks` globally
  ordered [as decided](DDD-tasks-order.md).
* Order of `tasks` will often be changed, so
    * ideal solution won't require updating more than affected (moved) task
    * ideal solution won't require additional queries to the backed to be rendered by frontend
    * ideal solution won't require additional database tables
    * ideal solution won't create unlikely, but possible edge cases
    * ideal solution is not concerned with what filters are put on the task lists, therefore what is the content of the
      currently queried `task` queue
    * ideal solution does not require additional queries other than already performed by frontend to show content
    * ideal solution does not require maintenance scripts to be run periodically

## Possible solutions

* Spaced integer indexes (extreme spacing—BIGINT as an index), querying for a previous task, starting from MAX_INTEGER
  descending, billions of free indexes between tasks
    * pro: no realistic scenario when handling collisions is required
    * pro: one simple database update, one simple db query
    * pro: low complexity
    * pro: can be immediately reflected by frontend without additional queries
    * pro: easy to understand
    * con: still, we need to query for the previous task to learn its index, before deciding on new one for a moved task
    * q: is there any noticeable performance impact when using eight bytes integer as order by?
* Spaced integer indexes (some spacing), querying for a previous task, reordering service keeping track of possible edge
  cases and re-indexes some tasks on the spot
    * pro: if done right, can avoid collisions completely
    * pro: medium complexity
    * con: still, we need to query for the previous task to learn its index, before deciding on new one for a moved task
    * con: if a collision occurs, handling it would require bigger update for multiple tasks
    * con: as it is unknown, how many other task indexes where updated it would require refetch of all displayed by the
      fronted
* Float indexes
    * pro: one simple database update, one simple db query
    * pro: low complexity
    * con: possibility of collisions?
    * con: probably not pleasant to handle on frontend?
    * not researched enough
* String indexes
    * pro: one simple database update, one simple db query
    * pro: low to medium complexity
    * con: possibility of too long ordinal strings?
    * not researched enough
* BLOB of ordered ids
    * con: any bigger number of tasks will have a big overhead  
    * con: medium complexity
    * con: ordering becomes separate from `Task` itself
    * q: while it is possible to sort by [unnested array with ordinality](https://dba.stackexchange.com/a/300194), what
      kind of performance overhead it brings?
* [red-black tree](https://cs.stackexchange.com/a/127855)
    * con: high complexity; has to be modeled separately in db
    * con: makes reading more complex
    * not researched enough

## Chosen resolution

`Spaced integer indexes (extreme spacing—BIGINT as an index), querying for a previous task, starting from MAX_INTEGER
  descending, billions of free indexes between tasks` - does what I need, low implementation cost, can be replaced if needed 
