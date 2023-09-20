```rkt
(cond [<QuestionExpression> <AnswerExpression>]
	...)
```

Multi armed conditional statements!
- Allows for the simultaneous evaluation of predicates
- All questions must be [[Booleans]] except the last `else`

*Notice: ( ) and [ ] balance each other out and are equivalent but by convention, [ ] is used around question and answer pairs in cond to make it easier to read*

```rkt

(define (aspect-ratio img)
	(cond [(> (image-height img) (image-width img)) "tall"]
              [(= (image-height img) (image-width img)) "square"]
              [else "wide"]))

#;
(define (aspect-ratio img)
	(cond [Q A]
		  [Q A]
		  [Q A]))


```

Step rule:
- Evaluates first question
- If it is `true`, it replaces it with the answer
- If it is `false` it drops the first question and continues evaluating