# Sequencer benchmarks

- [Lifecycle](lifecycle/README.md) measures scaling through continuous growth,
  mutation, immediate gossip and shrinkage.
- [Throughput](throughput/README.md) measures repeated API calls in independent
  bursts at starting sizes of 100, 1,000 and 10,000 Strips.

```powershell
npm run bench:lifecycle
npm run bench:throughput
```

Both default to three runs and produce JSON and Markdown reports under
`benchmark/results`. `npm run bench` retains the lifecycle default.
Both report calls per second and average latency, with separate memory usage
and disk usage tables. Run `npm run bench -- --help` for shared options.
