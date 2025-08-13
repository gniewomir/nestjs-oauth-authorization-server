# Technical Design Document—Database Upsert

## Problem 
* DDD-like patterns in this project go well with UPSERT.
  * But ATM TypeOrm has important limitation,
    * TypeOrm repositories, cannot handle upsert, if there is more than one conflict path specified 

## Solution
* Workaround: 
  * If this gets into the way of data consistency or domain invariants, the specification pattern to the resque.   
  * Documented problem with a test & this doc