# Technical Design Document—Configuration module

# Intention

Configuration is divided into small per-feature configuration DTOs

* Config DTOs are injectable via NestJS IOC container
* Config DTOs are decorated to provide validation
* Config DTOs are deeply frozen, to prevent
    * accidental modification of configuration at runtime
    * or making them transient (creating new instance for every consumer), which would have pretty heavy performance
      overhead
* So, during testing, you need to mock/substitute only particular config DTO - not configuration service
* **TODO** all of the above will be enforced by tests

The Whole application should be completely blind to implementation details, therefore, if configuration came from
environment variables, environment files, configuration management service, etc.



