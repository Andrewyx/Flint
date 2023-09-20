Mixed data type format. Similar to [[Enumeration]] but atomic non-distinct data types can be present. 

[[Cond]] must be used in the templates of Itemization types. 

The last condition in a [[Cond]] MUST be an `else` statement.

Rules:
- If a given subclass is the last of its class, we can reduce the test to just its guard. This is not the case if there is another of this type later in the Cond
- If all remaining cases are of the same type, then guards can be removed