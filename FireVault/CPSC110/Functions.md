To form a function:

```rkt
(define (<functionName> <parameterNames)...)
	<bodyExpressions>)
```


#### Example

```rkt
(define (bulb color)
  (circle 40 "solid" color)) 
```

Arguments are passed into function [[Parameters]], Operands are turned into values.

`colour` is the parameter `(circle 40 "solid" color)` is the body

### Function Calls

```rkt
(<name-of-defined-function> <expression>...)
```
The Function only takes one parameter and this is called an [[Operand]], these are **ALWAYS** first reduced into values before being passed into the function.
#### Example

```rkt
(bulb (string-append "re" "d"))
```

To evaluate a primitive call:
1) reduce operands to values (called [[Arguments]])
2) apply primitives to the values

For Function Definitions:
- simply record the definition

To evaluative function call:
1) reduce operands to values (called [[Arguments]])
2) replace function call by:
	1) Body of function and replace all [[Parameters]] with the corresponding [[Arguments]]