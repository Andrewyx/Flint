Formation:
1) A possible [[Structure Definitions|structure definition]] (week 3)
2) A [[HTDD Type Comments|type comment]] that defines a new type name and describes how to form data 
3) An [[HTDD Interpretation]] that describes the correspondence between information and one or 
4) One or more examples of the data
5) A [[HTDD Template|template]]  for a 1 argument function operating on data of this type

In the first few weeks, include a list of the template rules

### Syntax example
```rkt

;;Cityname is String
;; interp. the name of a city

(define CN1 "Boston")
(define CN2 "Vancouver")

(define (fn-for-city-name cn))
	(...cn))
;;Template rule used:
	;;Atomic Non-Distinct: String

;;Functions:

(@signature Cityname -> Boolean)

;;produces true if the given city is the best in the world

(check-expect (best? "Boston") false)
(check-expect (best? "Hogsmeade") true)

;(define (best? cn) false) ;stub

;took template from Cityname

(@template-origin Cityname)

(@template
(define (best? cn)
	(if (string=? cn "Hogsmeade")
		true
		false))

```






Other Examples:
```rkt
;; Data definitions:

;; TLColor is one of:
;;  - 0
;;  - 1
;;  - 2
;; interp. 0 means red, 1 yellow, 2 green               
#;
(define (fn-for-tlcolor c)
  (cond [(= c 0) (...)]
        [(= c 1) (...)]
        [(= c 2) (...)]))


```

```rkt 
;; Functions

;; TLColor -> TLColor
;; produce next color of traffic light
(check-expect (next-color 0) 2)
(check-expect (next-color 1) 0)
(check-expect (next-color 2) 1)

;(define (next-color c) 0)  ;stub

; Template from TLColor

(define (next-color c)
  (cond [(= c 0) 2]
        [(= c 1) 0]
        [(= c 2) 1]))
        
```