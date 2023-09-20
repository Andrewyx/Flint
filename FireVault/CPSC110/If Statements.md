
[[Booleans]] are the basis of these statements

**To form and if expression:**

```rkt
(if <expression> ;boolean
	<expression> ;if true
	<expression>) ;if false
```

**To Evaluate an if expression:**
1) If the expression is not a value, evaluate/replace the if expression with [[Value]]
	1) If expression is true, replace the entire expression with `true` answer expression
	2) If expression is false, replace the entire expression with the `false` answer expression
	3) If the value is not `true` or `false`, produce an error
# MAKE SURE TO STEP BY STEP EVALUATE EXPRESSIONS AND REPLACE OPERANDS INTO VALUES
#### Example:

```rkt
(require 2htdp/images)

(define I1 (rectangle 10 20 "solid" "red"))
(define I2 (rectangle 20 10 "solid" "blue"))

(if (< (image-width I1)
	(image-width I2))
	"tall"
	"wide")
	
;returns "tall"
```

## Logical AND (OR & NOT)

Of form: `(and <expr1> <expr2...)` and all  `<expr>` must produce a Boolean.

Evaluation:
1) Evaluate each `expr`
	1) a `false` immediately sets everything to false
	2) only `true` when all true

```rkt
(require 2htdp/images)

(define I1 (rectangle 10 20 "solid" "red"))
(define I2 (rectangle 20 10 "solid" "blue"))

(and (> (image-height I1) (image-height I2))
	(< (image-width I1) (image-width I2)))

;returns false
```

Logic for OR and AND short circuit -> They return immediately upon the first `true` for OR and the first `false` for AND.