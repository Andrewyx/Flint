Examples show what a [[Functions|Function]] must do. Use multiple to show the behavior.

Wrapping in `check-expect` means they will also serve as unit tests for the completed function

```rkt
(check-expect (double 3) 6)
(check-expect (double 4.2) 8.4)
```

**Two** examples are used to show that all numbers (not just integers are accepted)

At least two examples should be used. Vary the test cases and check for boundary cases.

`test validity means arguments have correct type, and result is correct for args`
`test thoroughness means you have enough tests`

`cooldown does not count for validity and thoroughness!`

If code is highlighted, it means that the test coverage is lacking