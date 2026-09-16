# Historical boundary view

Actor 100 creates six insertions. Most target index `0`, while `middle`
targets index `1` after `second` already exists:

```text
root
first  -> root
second -> first -> root
second -> middle -> first -> root
fourth -> second -> middle -> first -> root
fifth  -> fourth -> second -> middle -> first -> root
```

The hostile receiver gets `middle` and `fourth` before `second`. `second` and
`middle` share a stable boundary, so `insertionTime` and `insertionDiff` must
recover the view in which `middle` was authored. Both deliveries must end as:

```text
fifth -> fourth -> second -> middle -> first -> root
```
