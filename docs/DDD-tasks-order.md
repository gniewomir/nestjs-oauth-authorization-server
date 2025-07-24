# Domain Decision Documentation—Tasks Order

## Problems to solve

* [As discovered](DDD-tasks.md) I need to decide if tasks order will be stored globally or per chosen view

## Current understanding

* There should be a view presenting `Tasks` list without `Goal` and `Context` filters applied
    * Therefore, there will be a view that might contain thousands of tasks
        * Therefore, such a view would need to be "paginated"
            * Assuming drag&drop on fronted & cursor-based pagination seems reasonable
                * Therefore, we will know before or after which task we want to move the dragged task
                * But we won't be able to know (on the frontend) the whole content of the list displayed
        * It seems reasonable that moving the task B above task A as more important on that global list will affect also
          order on the filtered view for i.e. shared `Goal`
            * Therefore, global order per `Assigne` seems most sensible
        * Maintaining separate `Task` orders for unfiltered view, `Goal` view, `Context` view and `Goal` & `Context`
          view seems nightmare both from DX and UX standpoints.
        * Possibility of collaboration between `Users` is currently out of scope

## Resolution

All `Assigne` `Tasks` should be having one ordering sequence reflected on all-views regardless of current `Goal` and `Context` filter

