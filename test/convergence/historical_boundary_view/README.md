# Historical boundary view

Actor 100 creates six insertions. Most target index `0`, while `middle`
targets index `1` after `second` already exists:

```text
root
first  -> root
second -> first -> root
middle -> second -> first -> root
fourth -> second -> middle -> first -> root
fifth  -> fourth -> second -> middle -> first -> root
```

The hostile receiver gets `middle` and `fourth` before `second`. `second` and
`middle` share a stable boundary, so the greater `insertionStart` must place
`middle` closer to that anchor. The descendants of `second` remain its complete
subtree. Both deliveries must end as:

```text
middle -> fifth -> fourth -> second -> first -> root
```
