# Technical Design Document—Tasks Order

# Questions 
* Lazy or eager relations in TypeOrm? 
  * Relations are convenient—but we do not want to fetch more data than we actually need
    * So, keep it optional as it will be useful in domain infra 
  * For read, we will use raw SQL anyway