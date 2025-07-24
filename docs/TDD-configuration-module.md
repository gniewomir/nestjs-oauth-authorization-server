# Technical Design Document—Configuration module

# Problems to solve

* While testing, I want to mock/substitute configuration. Not a way configuration is provided to a consumer—which would
  be the case if I used NestJS ConfigService to access configuration
* Potential future changes in how and from where configuration is provided should be invisible for the rest of the
  application

# Chosen approach

Configuration is divided into small per-feature configuration DTOs

* Config DTOs must be injectable via NestJS IOC container
* Config DTOs must be validated
* Config DTOs must be deeply frozen, to prevent, accidental modification of configuration at runtime
    * Rejected alternative: making them transient (creating new instance for every consumer), which would have pretty
      heavy performance
      overhead considering other requirements
* The above assumptions have to be confirmed by tests



