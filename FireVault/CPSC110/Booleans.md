`true` and `false` values!

Predicates are [[Primitives]] or [[Functions]] that produce a Boolean value

See [[If Statements]] and [[Cond]]

```rkt
(define WIDTH 100)
(define HEIGHT 100)

(> WIDTH HEIGHT)
;returns false

(>= WIDTH HEIGHT)
;return true

```

String comparisons also exist 

```rkt
(string=? "foo" "bar")
;returns false

```
Image comparisons exist too

```rkt
(require 2htdp/images)

(define I1 (rectangle 10 20 "solid" "red"))
(define I2 (rectangle 20 10 "solid" "blue"))

(< (image-width I1)
	(image-width I2))
	
;returns true
```