# Sequencer dynamic lifecycle benchmark

Generated: 2026-10-10T13:10:12.056Z

Node 24.16.0; V8 13.6.233.17-node.49; win32 x64; Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz.

Runs: 3; lifecycle: 0 → 1,000 → 0 visible Strips; Strip length: 1…100 Frames.

Latencies use the authoritative sample-weighted arithmetic average. All latency columns are µs/op.

## Aggregate operation latency

| Replica | scope | operation | calls | ops/sec | weighted avg | mean run avg | median run avg | std. dev. | minimum run | maximum run |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| A | scaleUp | tailInsert | 1,500 | 396,217 | 2.524 | 2.524 | 1.970 | 0.963 | 2: 1.724 | 0: 3.878 |
| A | scaleUp | headInsert | 1,500 | 131,870 | 7.583 | 7.583 | 2.412 | 7.484 | 2: 2.172 | 0: 18.166 |
| A | scaleUp | headRemove | 0 | — | — | — | — | — | — | — |
| A | scaleUp | tailRemove | 0 | — | — | — | — | — | — | — |
| A | scaleUp | randomFind | 3,000 | 37,551 | 26.630 | 26.630 | 26.952 | 1.149 | 1: 25.090 | 2: 27.849 |
| A | scaleUp | randomRemove | 3,000 | 27,643 | 36.176 | 36.176 | 34.399 | 3.094 | 1: 33.601 | 2: 40.527 |
| A | scaleUp | randomReplace | 3,000 | 26,842 | 37.255 | 37.255 | 36.232 | 1.611 | 1: 36.004 | 0: 39.529 |
| A | scaleUp | randomInsert | 3,000 | 27,755 | 36.029 | 36.029 | 33.905 | 5.477 | 1: 30.641 | 0: 43.542 |
| A | scaleUp | randomIngest | 3,000 | 10,873 | 91.971 | 91.971 | 90.776 | 4.693 | 2: 86.915 | 0: 98.223 |
| A | scaleDown | tailInsert | 0 | — | — | — | — | — | — | — |
| A | scaleDown | headInsert | 0 | — | — | — | — | — | — | — |
| A | scaleDown | headRemove | 1,500 | 146,860 | 6.809 | 6.809 | 5.950 | 1.297 | 1: 5.836 | 0: 8.642 |
| A | scaleDown | tailRemove | 1,500 | 141,950 | 7.045 | 7.045 | 7.148 | 1.344 | 2: 5.349 | 0: 8.637 |
| A | scaleDown | randomFind | 3,000 | 9,700 | 103.092 | 103.092 | 98.639 | 20.386 | 2: 80.651 | 0: 129.986 |
| A | scaleDown | randomRemove | 3,000 | 11,140 | 89.766 | 89.766 | 85.880 | 18.430 | 2: 69.390 | 0: 114.029 |
| A | scaleDown | randomReplace | 3,000 | 10,249 | 97.568 | 97.568 | 90.481 | 23.600 | 2: 72.867 | 0: 129.356 |
| A | scaleDown | randomInsert | 3,000 | 10,423 | 95.940 | 95.940 | 90.113 | 16.514 | 2: 79.267 | 0: 118.439 |
| A | scaleDown | randomIngest | 2,997 | 4,530 | 220.735 | 220.735 | 204.724 | 45.346 | 2: 174.963 | 0: 282.519 |
| A | fullLifecycle | tailInsert | 1,500 | 396,217 | 2.524 | 2.524 | 1.970 | 0.963 | 2: 1.724 | 0: 3.878 |
| A | fullLifecycle | headInsert | 1,500 | 131,870 | 7.583 | 7.583 | 2.412 | 7.484 | 2: 2.172 | 0: 18.166 |
| A | fullLifecycle | headRemove | 1,500 | 146,860 | 6.809 | 6.809 | 5.950 | 1.297 | 1: 5.836 | 0: 8.642 |
| A | fullLifecycle | tailRemove | 1,500 | 141,950 | 7.045 | 7.045 | 7.148 | 1.344 | 2: 5.349 | 0: 8.637 |
| A | fullLifecycle | randomFind | 6,000 | 15,418 | 64.861 | 64.861 | 61.864 | 10.112 | 2: 54.250 | 0: 78.469 |
| A | fullLifecycle | randomRemove | 6,000 | 15,880 | 62.971 | 62.971 | 59.740 | 8.186 | 2: 54.959 | 0: 74.214 |
| A | fullLifecycle | randomReplace | 6,000 | 14,834 | 67.411 | 67.411 | 63.242 | 12.555 | 2: 54.550 | 0: 84.442 |
| A | fullLifecycle | randomInsert | 6,000 | 15,155 | 65.985 | 65.985 | 60.377 | 10.723 | 2: 56.586 | 0: 80.990 |
| A | fullLifecycle | randomIngest | 5,997 | 6,397 | 156.321 | 156.321 | 147.721 | 25.004 | 2: 130.917 | 0: 190.325 |

## Scaling performance

Checkpoint values are cumulative full-lifecycle averages at that point and are never reset.

| Run | direction | Strips | Frames | Replica | operation | calls | ops/sec | avg | min | max |
| ---: | --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 0 | up | 1 | 8 | A | tailInsert | 1 | 169,492 | 5.900 | 5.900 | 5.900 |
| 0 | up | 1 | 8 | A | headInsert | 0 | — | — | — | — |
| 0 | up | 1 | 8 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 1 | 8 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 1 | 8 | A | randomFind | 1 | 500,000 | 2.000 | 2.000 | 2.000 |
| 0 | up | 1 | 8 | A | randomRemove | 1 | 149,254 | 6.700 | 6.700 | 6.700 |
| 0 | up | 1 | 8 | A | randomReplace | 1 | 78,125 | 12.800 | 12.800 | 12.800 |
| 0 | up | 1 | 8 | A | randomInsert | 1 | 454,545 | 2.200 | 2.200 | 2.200 |
| 0 | up | 1 | 8 | A | randomIngest | 1 | 22,075 | 45.300 | 45.300 | 45.300 |
| 0 | up | 10 | 410 | A | tailInsert | 5 | 213,675 | 4.680 | 3.600 | 5.900 |
| 0 | up | 10 | 410 | A | headInsert | 5 | 103,950 | 9.620 | 5.000 | 22.900 |
| 0 | up | 10 | 410 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 10 | 410 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 10 | 410 | A | randomFind | 10 | 452,489 | 2.210 | 0.900 | 7.900 |
| 0 | up | 10 | 410 | A | randomRemove | 10 | 114,679 | 8.720 | 4.500 | 15.500 |
| 0 | up | 10 | 410 | A | randomReplace | 10 | 48,497 | 20.620 | 9.400 | 60.400 |
| 0 | up | 10 | 410 | A | randomInsert | 10 | 93,545 | 10.690 | 2.200 | 37.600 |
| 0 | up | 10 | 410 | A | randomIngest | 10 | 33,102 | 30.210 | 17.100 | 77.100 |
| 0 | up | 100 | 4,859 | A | tailInsert | 50 | 154,369 | 6.478 | 3.600 | 31.200 |
| 0 | up | 100 | 4,859 | A | headInsert | 50 | 143,225 | 6.982 | 4.300 | 22.900 |
| 0 | up | 100 | 4,859 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 100 | 4,859 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 100 | 4,859 | A | randomFind | 100 | 97,276 | 10.280 | 0.400 | 188.600 |
| 0 | up | 100 | 4,859 | A | randomRemove | 100 | 63,456 | 15.759 | 4.500 | 74.100 |
| 0 | up | 100 | 4,859 | A | randomReplace | 100 | 35,538 | 28.139 | 9.400 | 180.500 |
| 0 | up | 100 | 4,859 | A | randomInsert | 100 | 48,878 | 20.459 | 2.200 | 344.300 |
| 0 | up | 100 | 4,859 | A | randomIngest | 100 | 23,778 | 42.056 | 12.900 | 191.900 |
| 0 | up | 1,000 | 50,842 | A | tailInsert | 500 | 257,878 | 3.878 | 1.100 | 515.300 |
| 0 | up | 1,000 | 50,842 | A | headInsert | 500 | 55,049 | 18.166 | 1.500 | 7272.400 |
| 0 | up | 1,000 | 50,842 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 1,000 | 50,842 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 1,000 | 50,842 | A | randomFind | 1,000 | 37,103 | 26.952 | 0.300 | 430.600 |
| 0 | up | 1,000 | 50,842 | A | randomRemove | 1,000 | 29,070 | 34.399 | 2.100 | 988.000 |
| 0 | up | 1,000 | 50,842 | A | randomReplace | 1,000 | 25,298 | 39.529 | 3.700 | 361.800 |
| 0 | up | 1,000 | 50,842 | A | randomInsert | 1,000 | 22,966 | 43.542 | 1.300 | 6664.900 |
| 0 | up | 1,000 | 50,842 | A | randomIngest | 1,000 | 10,181 | 98.223 | 8.700 | 858.800 |
| 0 | down | 100 | 4,898 | A | tailInsert | 500 | 257,878 | 3.878 | 1.100 | 515.300 |
| 0 | down | 100 | 4,898 | A | headInsert | 500 | 55,049 | 18.166 | 1.500 | 7272.400 |
| 0 | down | 100 | 4,898 | A | headRemove | 450 | 118,290 | 8.454 | 2.700 | 118.900 |
| 0 | down | 100 | 4,898 | A | tailRemove | 450 | 121,753 | 8.213 | 3.100 | 273.000 |
| 0 | down | 100 | 4,898 | A | randomFind | 1,900 | 12,383 | 80.756 | 0.300 | 2084.700 |
| 0 | down | 100 | 4,898 | A | randomRemove | 1,900 | 13,081 | 76.446 | 2.100 | 1275.500 |
| 0 | down | 100 | 4,898 | A | randomReplace | 1,900 | 11,751 | 85.101 | 3.700 | 1902.000 |
| 0 | down | 100 | 4,898 | A | randomInsert | 1,900 | 12,025 | 83.160 | 1.300 | 6664.900 |
| 0 | down | 100 | 4,898 | A | randomIngest | 1,900 | 5,120 | 195.312 | 8.100 | 2733.300 |
| 0 | down | 10 | 397 | A | tailInsert | 500 | 257,878 | 3.878 | 1.100 | 515.300 |
| 0 | down | 10 | 397 | A | headInsert | 500 | 55,049 | 18.166 | 1.500 | 7272.400 |
| 0 | down | 10 | 397 | A | headRemove | 495 | 114,985 | 8.697 | 2.700 | 118.900 |
| 0 | down | 10 | 397 | A | tailRemove | 495 | 115,358 | 8.669 | 2.200 | 273.000 |
| 0 | down | 10 | 397 | A | randomFind | 1,990 | 12,685 | 78.834 | 0.300 | 2084.700 |
| 0 | down | 10 | 397 | A | randomRemove | 1,990 | 13,412 | 74.559 | 2.000 | 1275.500 |
| 0 | down | 10 | 397 | A | randomReplace | 1,990 | 11,969 | 83.550 | 3.700 | 1902.000 |
| 0 | down | 10 | 397 | A | randomInsert | 1,990 | 12,289 | 81.375 | 1.300 | 6664.900 |
| 0 | down | 10 | 397 | A | randomIngest | 1,990 | 5,274 | 189.622 | 7.700 | 2733.300 |
| 0 | down | 1 | 75 | A | tailInsert | 500 | 257,878 | 3.878 | 1.100 | 515.300 |
| 0 | down | 1 | 75 | A | headInsert | 500 | 55,049 | 18.166 | 1.500 | 7272.400 |
| 0 | down | 1 | 75 | A | headRemove | 500 | 115,717 | 8.642 | 2.600 | 118.900 |
| 0 | down | 1 | 75 | A | tailRemove | 499 | 115,619 | 8.649 | 2.200 | 273.000 |
| 0 | down | 1 | 75 | A | randomFind | 1,999 | 12,738 | 78.506 | 0.300 | 2084.700 |
| 0 | down | 1 | 75 | A | randomRemove | 1,999 | 13,468 | 74.249 | 2.000 | 1275.500 |
| 0 | down | 1 | 75 | A | randomReplace | 1,999 | 12,016 | 83.222 | 3.700 | 1902.000 |
| 0 | down | 1 | 75 | A | randomInsert | 1,999 | 12,341 | 81.030 | 1.300 | 6664.900 |
| 0 | down | 1 | 75 | A | randomIngest | 1,999 | 5,254 | 190.325 | 6.200 | 2888.900 |
| 0 | down | 0 | 0 | A | tailInsert | 500 | 257,878 | 3.878 | 1.100 | 515.300 |
| 0 | down | 0 | 0 | A | headInsert | 500 | 55,049 | 18.166 | 1.500 | 7272.400 |
| 0 | down | 0 | 0 | A | headRemove | 500 | 115,717 | 8.642 | 2.600 | 118.900 |
| 0 | down | 0 | 0 | A | tailRemove | 500 | 115,781 | 8.637 | 2.200 | 273.000 |
| 0 | down | 0 | 0 | A | randomFind | 2,000 | 12,744 | 78.469 | 0.300 | 2084.700 |
| 0 | down | 0 | 0 | A | randomRemove | 2,000 | 13,475 | 74.214 | 2.000 | 1275.500 |
| 0 | down | 0 | 0 | A | randomReplace | 2,000 | 11,842 | 84.442 | 3.700 | 2524.200 |
| 0 | down | 0 | 0 | A | randomInsert | 2,000 | 12,347 | 80.990 | 1.300 | 6664.900 |
| 0 | down | 0 | 0 | A | randomIngest | 1,999 | 5,254 | 190.325 | 6.200 | 2888.900 |
| 1 | up | 1 | 38 | A | tailInsert | 1 | 294,118 | 3.400 | 3.400 | 3.400 |
| 1 | up | 1 | 38 | A | headInsert | 0 | — | — | — | — |
| 1 | up | 1 | 38 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 1 | 38 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 1 | 38 | A | randomFind | 1 | 769,231 | 1.300 | 1.300 | 1.300 |
| 1 | up | 1 | 38 | A | randomRemove | 1 | 312,500 | 3.200 | 3.200 | 3.200 |
| 1 | up | 1 | 38 | A | randomReplace | 1 | 73,529 | 13.600 | 13.600 | 13.600 |
| 1 | up | 1 | 38 | A | randomInsert | 1 | 1,111,111 | 0.900 | 0.900 | 0.900 |
| 1 | up | 1 | 38 | A | randomIngest | 1 | 153,846 | 6.500 | 6.500 | 6.500 |
| 1 | up | 10 | 619 | A | tailInsert | 5 | 625,000 | 1.600 | 1.000 | 3.400 |
| 1 | up | 10 | 619 | A | headInsert | 5 | 253,807 | 3.940 | 1.100 | 13.300 |
| 1 | up | 10 | 619 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 10 | 619 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 10 | 619 | A | randomFind | 10 | 847,458 | 1.180 | 0.400 | 2.700 |
| 1 | up | 10 | 619 | A | randomRemove | 10 | 355,872 | 2.810 | 2.000 | 5.700 |
| 1 | up | 10 | 619 | A | randomReplace | 10 | 130,719 | 7.650 | 3.500 | 17.900 |
| 1 | up | 10 | 619 | A | randomInsert | 10 | 709,220 | 1.410 | 0.800 | 2.000 |
| 1 | up | 10 | 619 | A | randomIngest | 10 | 177,305 | 5.640 | 4.500 | 6.900 |
| 1 | up | 100 | 5,304 | A | tailInsert | 50 | 338,295 | 2.956 | 0.900 | 34.900 |
| 1 | up | 100 | 5,304 | A | headInsert | 50 | 379,651 | 2.634 | 1.100 | 13.300 |
| 1 | up | 100 | 5,304 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 100 | 5,304 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 100 | 5,304 | A | randomFind | 100 | 218,341 | 4.580 | 0.300 | 75.700 |
| 1 | up | 100 | 5,304 | A | randomRemove | 100 | 113,302 | 8.826 | 1.800 | 109.200 |
| 1 | up | 100 | 5,304 | A | randomReplace | 100 | 82,706 | 12.091 | 3.000 | 93.100 |
| 1 | up | 100 | 5,304 | A | randomInsert | 100 | 146,951 | 6.805 | 0.800 | 51.500 |
| 1 | up | 100 | 5,304 | A | randomIngest | 100 | 48,802 | 20.491 | 4.400 | 191.100 |
| 1 | up | 1,000 | 51,188 | A | tailInsert | 500 | 507,563 | 1.970 | 0.900 | 34.900 |
| 1 | up | 1,000 | 51,188 | A | headInsert | 500 | 414,628 | 2.412 | 1.100 | 20.900 |
| 1 | up | 1,000 | 51,188 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 1,000 | 51,188 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 1,000 | 51,188 | A | randomFind | 1,000 | 39,857 | 25.090 | 0.300 | 271.000 |
| 1 | up | 1,000 | 51,188 | A | randomRemove | 1,000 | 29,761 | 33.601 | 1.800 | 496.700 |
| 1 | up | 1,000 | 51,188 | A | randomReplace | 1,000 | 27,775 | 36.004 | 3.000 | 761.600 |
| 1 | up | 1,000 | 51,188 | A | randomInsert | 1,000 | 32,636 | 30.641 | 0.800 | 637.300 |
| 1 | up | 1,000 | 51,188 | A | randomIngest | 1,000 | 11,016 | 90.776 | 4.400 | 4283.300 |
| 1 | down | 100 | 4,812 | A | tailInsert | 500 | 507,563 | 1.970 | 0.900 | 34.900 |
| 1 | down | 100 | 4,812 | A | headInsert | 500 | 414,628 | 2.412 | 1.100 | 20.900 |
| 1 | down | 100 | 4,812 | A | headRemove | 450 | 178,628 | 5.598 | 2.700 | 25.200 |
| 1 | down | 100 | 4,812 | A | tailRemove | 450 | 140,872 | 7.099 | 2.800 | 138.900 |
| 1 | down | 100 | 4,812 | A | randomFind | 1,900 | 16,406 | 60.955 | 0.300 | 1951.100 |
| 1 | down | 100 | 4,812 | A | randomRemove | 1,900 | 16,469 | 60.719 | 1.800 | 1509.200 |
| 1 | down | 100 | 4,812 | A | randomReplace | 1,900 | 15,906 | 62.870 | 3.000 | 1535.700 |
| 1 | down | 100 | 4,812 | A | randomInsert | 1,900 | 16,308 | 61.319 | 0.800 | 1211.200 |
| 1 | down | 100 | 4,812 | A | randomIngest | 1,900 | 6,779 | 147.512 | 4.400 | 4283.300 |
| 1 | down | 10 | 559 | A | tailInsert | 500 | 507,563 | 1.970 | 0.900 | 34.900 |
| 1 | down | 10 | 559 | A | headInsert | 500 | 414,628 | 2.412 | 1.100 | 20.900 |
| 1 | down | 10 | 559 | A | headRemove | 495 | 171,340 | 5.836 | 2.100 | 86.600 |
| 1 | down | 10 | 559 | A | tailRemove | 495 | 142,254 | 7.030 | 2.400 | 138.900 |
| 1 | down | 10 | 559 | A | randomFind | 1,990 | 16,114 | 62.058 | 0.300 | 1951.100 |
| 1 | down | 10 | 559 | A | randomRemove | 1,990 | 16,676 | 59.965 | 1.800 | 1509.200 |
| 1 | down | 10 | 559 | A | randomReplace | 1,990 | 16,102 | 62.105 | 3.000 | 1535.700 |
| 1 | down | 10 | 559 | A | randomInsert | 1,990 | 16,491 | 60.637 | 0.800 | 1211.200 |
| 1 | down | 10 | 559 | A | randomIngest | 1,990 | 6,809 | 146.860 | 4.400 | 4283.300 |
| 1 | down | 1 | 74 | A | tailInsert | 500 | 507,563 | 1.970 | 0.900 | 34.900 |
| 1 | down | 1 | 74 | A | headInsert | 500 | 414,628 | 2.412 | 1.100 | 20.900 |
| 1 | down | 1 | 74 | A | headRemove | 500 | 171,350 | 5.836 | 2.100 | 86.600 |
| 1 | down | 1 | 74 | A | tailRemove | 499 | 139,702 | 7.158 | 2.300 | 138.900 |
| 1 | down | 1 | 74 | A | randomFind | 1,999 | 16,157 | 61.892 | 0.200 | 1951.100 |
| 1 | down | 1 | 74 | A | randomRemove | 1,999 | 16,732 | 59.767 | 1.800 | 1509.200 |
| 1 | down | 1 | 74 | A | randomReplace | 1,999 | 16,143 | 61.948 | 3.000 | 1535.700 |
| 1 | down | 1 | 74 | A | randomInsert | 1,999 | 16,555 | 60.406 | 0.800 | 1211.200 |
| 1 | down | 1 | 74 | A | randomIngest | 1,999 | 6,770 | 147.721 | 4.400 | 4283.300 |
| 1 | down | 0 | 0 | A | tailInsert | 500 | 507,563 | 1.970 | 0.900 | 34.900 |
| 1 | down | 0 | 0 | A | headInsert | 500 | 414,628 | 2.412 | 1.100 | 20.900 |
| 1 | down | 0 | 0 | A | headRemove | 500 | 171,350 | 5.836 | 2.100 | 86.600 |
| 1 | down | 0 | 0 | A | tailRemove | 500 | 139,895 | 7.148 | 2.200 | 138.900 |
| 1 | down | 0 | 0 | A | randomFind | 2,000 | 16,164 | 61.864 | 0.200 | 1951.100 |
| 1 | down | 0 | 0 | A | randomRemove | 2,000 | 16,739 | 59.740 | 1.800 | 1509.200 |
| 1 | down | 0 | 0 | A | randomReplace | 2,000 | 15,812 | 63.242 | 3.000 | 2651.200 |
| 1 | down | 0 | 0 | A | randomInsert | 2,000 | 16,563 | 60.377 | 0.800 | 1211.200 |
| 1 | down | 0 | 0 | A | randomIngest | 1,999 | 6,770 | 147.721 | 4.400 | 4283.300 |
| 2 | up | 1 | 57 | A | tailInsert | 1 | 185,185 | 5.400 | 5.400 | 5.400 |
| 2 | up | 1 | 57 | A | headInsert | 0 | — | — | — | — |
| 2 | up | 1 | 57 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 1 | 57 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 1 | 57 | A | randomFind | 1 | 666,667 | 1.500 | 1.500 | 1.500 |
| 2 | up | 1 | 57 | A | randomRemove | 1 | 227,273 | 4.400 | 4.400 | 4.400 |
| 2 | up | 1 | 57 | A | randomReplace | 1 | 58,140 | 17.200 | 17.200 | 17.200 |
| 2 | up | 1 | 57 | A | randomInsert | 1 | 769,231 | 1.300 | 1.300 | 1.300 |
| 2 | up | 1 | 57 | A | randomIngest | 1 | 138,889 | 7.200 | 7.200 | 7.200 |
| 2 | up | 10 | 593 | A | tailInsert | 5 | 505,051 | 1.980 | 1.100 | 5.400 |
| 2 | up | 10 | 593 | A | headInsert | 5 | 267,380 | 3.740 | 1.300 | 13.100 |
| 2 | up | 10 | 593 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 10 | 593 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 10 | 593 | A | randomFind | 10 | 1,204,819 | 0.830 | 0.400 | 1.500 |
| 2 | up | 10 | 593 | A | randomRemove | 10 | 390,625 | 2.560 | 1.800 | 4.700 |
| 2 | up | 10 | 593 | A | randomReplace | 10 | 119,760 | 8.350 | 2.800 | 19.100 |
| 2 | up | 10 | 593 | A | randomInsert | 10 | 602,410 | 1.660 | 1.200 | 2.500 |
| 2 | up | 10 | 593 | A | randomIngest | 10 | 160,514 | 6.230 | 4.400 | 9.100 |
| 2 | up | 100 | 5,395 | A | tailInsert | 50 | 745,156 | 1.342 | 0.800 | 7.100 |
| 2 | up | 100 | 5,395 | A | headInsert | 50 | 638,570 | 1.566 | 1.000 | 13.100 |
| 2 | up | 100 | 5,395 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 100 | 5,395 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 100 | 5,395 | A | randomFind | 100 | 371,195 | 2.694 | 0.300 | 14.300 |
| 2 | up | 100 | 5,395 | A | randomRemove | 100 | 195,963 | 5.103 | 1.700 | 19.900 |
| 2 | up | 100 | 5,395 | A | randomReplace | 100 | 140,865 | 7.099 | 2.800 | 37.400 |
| 2 | up | 100 | 5,395 | A | randomInsert | 100 | 294,898 | 3.391 | 1.000 | 16.100 |
| 2 | up | 100 | 5,395 | A | randomIngest | 100 | 86,760 | 11.526 | 4.400 | 40.500 |
| 2 | up | 1,000 | 50,583 | A | tailInsert | 500 | 580,181 | 1.724 | 0.800 | 9.900 |
| 2 | up | 1,000 | 50,583 | A | headInsert | 500 | 460,363 | 2.172 | 1.000 | 13.100 |
| 2 | up | 1,000 | 50,583 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 1,000 | 50,583 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 1,000 | 50,583 | A | randomFind | 1,000 | 35,908 | 27.849 | 0.300 | 303.900 |
| 2 | up | 1,000 | 50,583 | A | randomRemove | 1,000 | 24,675 | 40.527 | 1.700 | 6268.200 |
| 2 | up | 1,000 | 50,583 | A | randomReplace | 1,000 | 27,600 | 36.232 | 2.800 | 411.800 |
| 2 | up | 1,000 | 50,583 | A | randomInsert | 1,000 | 29,494 | 33.905 | 1.000 | 448.000 |
| 2 | up | 1,000 | 50,583 | A | randomIngest | 1,000 | 11,506 | 86.915 | 4.400 | 673.700 |
| 2 | down | 100 | 4,888 | A | tailInsert | 500 | 580,181 | 1.724 | 0.800 | 9.900 |
| 2 | down | 100 | 4,888 | A | headInsert | 500 | 460,363 | 2.172 | 1.000 | 13.100 |
| 2 | down | 100 | 4,888 | A | headRemove | 450 | 173,097 | 5.777 | 2.700 | 285.800 |
| 2 | down | 100 | 4,888 | A | tailRemove | 450 | 189,938 | 5.265 | 2.500 | 44.100 |
| 2 | down | 100 | 4,888 | A | randomFind | 1,900 | 17,930 | 55.774 | 0.300 | 3242.500 |
| 2 | down | 100 | 4,888 | A | randomRemove | 1,900 | 17,652 | 56.649 | 1.700 | 6268.200 |
| 2 | down | 100 | 4,888 | A | randomReplace | 1,900 | 18,285 | 54.690 | 2.800 | 593.200 |
| 2 | down | 100 | 4,888 | A | randomInsert | 1,900 | 17,157 | 58.286 | 1.000 | 5619.200 |
| 2 | down | 100 | 4,888 | A | randomIngest | 1,900 | 7,507 | 133.210 | 4.400 | 2795.600 |
| 2 | down | 10 | 422 | A | tailInsert | 500 | 580,181 | 1.724 | 0.800 | 9.900 |
| 2 | down | 10 | 422 | A | headInsert | 500 | 460,363 | 2.172 | 1.000 | 13.100 |
| 2 | down | 10 | 422 | A | headRemove | 495 | 168,373 | 5.939 | 2.200 | 285.800 |
| 2 | down | 10 | 422 | A | tailRemove | 495 | 186,645 | 5.358 | 2.200 | 44.100 |
| 2 | down | 10 | 422 | A | randomFind | 1,990 | 18,344 | 54.514 | 0.300 | 3242.500 |
| 2 | down | 10 | 422 | A | randomRemove | 1,990 | 18,117 | 55.196 | 1.700 | 6268.200 |
| 2 | down | 10 | 422 | A | randomReplace | 1,990 | 18,685 | 53.520 | 2.800 | 593.200 |
| 2 | down | 10 | 422 | A | randomInsert | 1,990 | 17,594 | 56.837 | 1.000 | 5619.200 |
| 2 | down | 10 | 422 | A | randomIngest | 1,990 | 7,673 | 130.325 | 4.400 | 2795.600 |
| 2 | down | 1 | 17 | A | tailInsert | 500 | 580,181 | 1.724 | 0.800 | 9.900 |
| 2 | down | 1 | 17 | A | headInsert | 500 | 460,363 | 2.172 | 1.000 | 13.100 |
| 2 | down | 1 | 17 | A | headRemove | 500 | 168,073 | 5.950 | 2.000 | 285.800 |
| 2 | down | 1 | 17 | A | tailRemove | 499 | 186,745 | 5.355 | 2.200 | 44.100 |
| 2 | down | 1 | 17 | A | randomFind | 1,999 | 18,425 | 54.276 | 0.300 | 3242.500 |
| 2 | down | 1 | 17 | A | randomRemove | 1,999 | 18,187 | 54.984 | 1.700 | 6268.200 |
| 2 | down | 1 | 17 | A | randomReplace | 1,999 | 18,736 | 53.373 | 2.800 | 593.200 |
| 2 | down | 1 | 17 | A | randomInsert | 1,999 | 17,664 | 56.613 | 1.000 | 5619.200 |
| 2 | down | 1 | 17 | A | randomIngest | 1,999 | 7,638 | 130.917 | 4.400 | 2795.600 |
| 2 | down | 0 | 0 | A | tailInsert | 500 | 580,181 | 1.724 | 0.800 | 9.900 |
| 2 | down | 0 | 0 | A | headInsert | 500 | 460,363 | 2.172 | 1.000 | 13.100 |
| 2 | down | 0 | 0 | A | headRemove | 500 | 168,073 | 5.950 | 2.000 | 285.800 |
| 2 | down | 0 | 0 | A | tailRemove | 500 | 186,951 | 5.349 | 2.200 | 44.100 |
| 2 | down | 0 | 0 | A | randomFind | 2,000 | 18,433 | 54.250 | 0.300 | 3242.500 |
| 2 | down | 0 | 0 | A | randomRemove | 2,000 | 18,196 | 54.959 | 1.700 | 6268.200 |
| 2 | down | 0 | 0 | A | randomReplace | 2,000 | 18,332 | 54.550 | 2.800 | 2405.400 |
| 2 | down | 0 | 0 | A | randomInsert | 2,000 | 17,672 | 56.586 | 1.000 | 5619.200 |
| 2 | down | 0 | 0 | A | randomIngest | 1,999 | 7,638 | 130.917 | 4.400 | 2795.600 |

## Management performance

| Run | direction | Strips | Replica | operation | calls | ops/sec | avg |
| ---: | --- | ---: | --- | --- | ---: | ---: | ---: |
| 0 | up | 1 | A | values | 1 | 9,921 | 100.800 |
| 0 | up | 1 | A | sequence | 1 | 8,217 | 121.700 |
| 0 | up | 1 | A | create | 1 | 9,091 | 110.000 |
| 0 | up | 10 | A | values | 1 | 11,919 | 83.900 |
| 0 | up | 10 | A | sequence | 1 | 1,513 | 661.100 |
| 0 | up | 10 | A | create | 1 | 4,655 | 214.800 |
| 0 | up | 100 | A | values | 1 | 1,098 | 910.500 |
| 0 | up | 100 | A | sequence | 1 | 125 | 7968.800 |
| 0 | up | 100 | A | create | 1 | 987 | 1013.000 |
| 0 | up | 1,000 | A | values | 1 | 274 | 3656.000 |
| 0 | up | 1,000 | A | sequence | 1 | 30 | 33481.300 |
| 0 | up | 1,000 | A | create | 1 | 172 | 5801.800 |
| 0 | down | 100 | A | values | 1 | 1,904 | 525.200 |
| 0 | down | 100 | A | sequence | 1 | 16 | 61485.500 |
| 0 | down | 100 | A | create | 1 | 2,361 | 423.600 |
| 0 | down | 10 | A | values | 1 | 40,161 | 24.900 |
| 0 | down | 10 | A | sequence | 1 | 19 | 53524.000 |
| 0 | down | 10 | A | create | 1 | 3,419 | 292.500 |
| 0 | down | 1 | A | values | 1 | 250,000 | 4.000 |
| 0 | down | 1 | A | sequence | 1 | 14 | 70355.300 |
| 0 | down | 1 | A | create | 1 | 11,547 | 86.600 |
| 0 | down | 0 | A | values | 1 | 434,783 | 2.300 |
| 0 | down | 0 | A | sequence | 1 | 7,734 | 129.300 |
| 0 | down | 0 | A | create | 1 | 20,833 | 48.000 |
| 1 | up | 1 | A | values | 1 | 285,714 | 3.500 |
| 1 | up | 1 | A | sequence | 1 | 36,232 | 27.600 |
| 1 | up | 1 | A | create | 1 | 38,760 | 25.800 |
| 1 | up | 10 | A | values | 1 | 58,140 | 17.200 |
| 1 | up | 10 | A | sequence | 1 | 4,500 | 222.200 |
| 1 | up | 10 | A | create | 1 | 12,315 | 81.200 |
| 1 | up | 100 | A | values | 1 | 5,152 | 194.100 |
| 1 | up | 100 | A | sequence | 1 | 461 | 2170.700 |
| 1 | up | 100 | A | create | 1 | 3,759 | 266.000 |
| 1 | up | 1,000 | A | values | 1 | 200 | 5000.300 |
| 1 | up | 1,000 | A | sequence | 1 | 38 | 26015.700 |
| 1 | up | 1,000 | A | create | 1 | 285 | 3509.000 |
| 1 | down | 100 | A | values | 1 | 1,626 | 615.100 |
| 1 | down | 100 | A | sequence | 1 | 16 | 61343.800 |
| 1 | down | 100 | A | create | 1 | 3,995 | 250.300 |
| 1 | down | 10 | A | values | 1 | 11,806 | 84.700 |
| 1 | down | 10 | A | sequence | 1 | 17 | 57799.900 |
| 1 | down | 10 | A | create | 1 | 5,063 | 197.500 |
| 1 | down | 1 | A | values | 1 | 434,783 | 2.300 |
| 1 | down | 1 | A | sequence | 1 | 14 | 69337.800 |
| 1 | down | 1 | A | create | 1 | 13,680 | 73.100 |
| 1 | down | 0 | A | values | 1 | 833,333 | 1.200 |
| 1 | down | 0 | A | sequence | 1 | 32,468 | 30.800 |
| 1 | down | 0 | A | create | 1 | 21,692 | 46.100 |
| 2 | up | 1 | A | values | 1 | 204,082 | 4.900 |
| 2 | up | 1 | A | sequence | 1 | 24,752 | 40.400 |
| 2 | up | 1 | A | create | 1 | 28,653 | 34.900 |
| 2 | up | 10 | A | values | 1 | 121,951 | 8.200 |
| 2 | up | 10 | A | sequence | 1 | 4,531 | 220.700 |
| 2 | up | 10 | A | create | 1 | 13,699 | 73.000 |
| 2 | up | 100 | A | values | 1 | 9,124 | 109.600 |
| 2 | up | 100 | A | sequence | 1 | 400 | 2501.800 |
| 2 | up | 100 | A | create | 1 | 2,982 | 335.400 |
| 2 | up | 1,000 | A | values | 1 | 341 | 2929.400 |
| 2 | up | 1,000 | A | sequence | 1 | 42 | 23938.000 |
| 2 | up | 1,000 | A | create | 1 | 470 | 2125.400 |
| 2 | down | 100 | A | values | 1 | 1,999 | 500.300 |
| 2 | down | 100 | A | sequence | 1 | 21 | 46787.900 |
| 2 | down | 100 | A | create | 1 | 3,230 | 309.600 |
| 2 | down | 10 | A | values | 1 | 20,000 | 50.000 |
| 2 | down | 10 | A | sequence | 1 | 18 | 54294.900 |
| 2 | down | 10 | A | create | 1 | 9,251 | 108.100 |
| 2 | down | 1 | A | values | 1 | 384,615 | 2.600 |
| 2 | down | 1 | A | sequence | 1 | 17 | 58695.300 |
| 2 | down | 1 | A | create | 1 | 15,060 | 66.400 |
| 2 | down | 0 | A | values | 1 | 1,000,000 | 1.000 |
| 2 | down | 0 | A | sequence | 1 | 31,546 | 31.700 |
| 2 | down | 0 | A | create | 1 | 24,450 | 40.900 |

## Memory usage

Estimated bytes describe the exported Sequence representation. Process memory is shared by both peers, benchmark fixtures and temporary results.

| Run | direction | Replica | visible Strips | retained insertions | Frames | estimated memory bytes | memory B/Strip | memory B/Frame | process RSS | process heap used |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | up | A | 1 | 1 | 8 | 96 | 96.000 | 12.000 | 80,392,192 | 12,330,440 |
| 0 | up | A | 10 | 10 | 410 | 3,528 | 352.800 | 8.605 | 78,368,768 | 12,093,248 |
| 0 | up | A | 100 | 100 | 4,859 | 41,280 | 412.800 | 8.496 | 85,282,816 | 14,317,688 |
| 0 | up | A | 1,000 | 1,000 | 50,842 | 430,744 | 430.744 | 8.472 | 119,758,848 | 21,647,552 |
| 0 | down | A | 100 | 100 | 4,898 | 41,592 | 415.920 | 8.492 | 131,928,064 | 42,131,360 |
| 0 | down | A | 10 | 10 | 397 | 3,424 | 342.400 | 8.625 | 134,348,800 | 45,530,208 |
| 0 | down | A | 1 | 1 | 75 | 632 | 632.000 | 8.427 | 151,547,904 | 27,496,400 |
| 0 | down | A | 0 | 0 | 0 | 8 | — | — | 147,406,848 | 27,870,072 |
| 1 | up | A | 1 | 1 | 38 | 336 | 336.000 | 8.842 | 147,763,200 | 28,136,584 |
| 1 | up | A | 10 | 10 | 619 | 5,200 | 520.000 | 8.401 | 148,160,512 | 28,762,872 |
| 1 | up | A | 100 | 100 | 5,304 | 44,840 | 448.400 | 8.454 | 148,168,704 | 33,833,208 |
| 1 | up | A | 1,000 | 1,014 | 51,188 | 433,848 | 433.848 | 8.476 | 171,077,632 | 54,778,848 |
| 1 | down | A | 100 | 100 | 4,812 | 40,904 | 409.040 | 8.500 | 180,535,296 | 63,196,184 |
| 1 | down | A | 10 | 10 | 559 | 4,720 | 472.000 | 8.444 | 181,129,216 | 65,240,096 |
| 1 | down | A | 1 | 1 | 74 | 624 | 624.000 | 8.432 | 186,146,816 | 54,517,968 |
| 1 | down | A | 0 | 0 | 0 | 8 | — | — | 186,261,504 | 54,888,600 |
| 2 | up | A | 1 | 1 | 57 | 488 | 488.000 | 8.561 | 186,273,792 | 55,115,480 |
| 2 | up | A | 10 | 10 | 593 | 4,992 | 499.200 | 8.418 | 186,273,792 | 55,690,544 |
| 2 | up | A | 100 | 100 | 5,395 | 45,568 | 455.680 | 8.446 | 186,286,080 | 60,507,560 |
| 2 | up | A | 1,000 | 1,001 | 50,583 | 428,696 | 428.696 | 8.475 | 243,904,512 | 104,763,056 |
| 2 | down | A | 100 | 100 | 4,888 | 41,512 | 415.120 | 8.493 | 271,319,040 | 100,936,416 |
| 2 | down | A | 10 | 10 | 422 | 3,624 | 362.400 | 8.588 | 274,362,368 | 66,287,256 |
| 2 | down | A | 1 | 1 | 17 | 168 | 168.000 | 9.882 | 273,911,808 | 84,075,968 |
| 2 | down | A | 0 | 0 | 0 | 8 | — | — | 273,911,808 | 84,429,512 |

## Disk usage

Disk bytes are the size of node:v8.serialize(sequence), excluding filesystem metadata; no disk I/O is timed.

| Run | direction | Replica | visible Strips | Frames | sequence bytes | disk B/Strip | disk B/Frame |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 0 | up | A | 1 | 8 | 111 | 111.000 | 13.875 |
| 0 | up | A | 10 | 410 | 1407 | 140.700 | 3.432 |
| 0 | up | A | 100 | 4859 | 21015 | 210.150 | 4.325 |
| 0 | up | A | 1000 | 50842 | 209701 | 209.701 | 4.125 |
| 0 | down | A | 100 | 4898 | 20716 | 207.160 | 4.229 |
| 0 | down | A | 10 | 397 | 1796 | 179.600 | 4.524 |
| 0 | down | A | 1 | 75 | 317 | 317.000 | 4.227 |
| 0 | down | A | 0 | 0 | 35 | — | — |
| 1 | up | A | 1 | 38 | 168 | 168.000 | 4.421 |
| 1 | up | A | 10 | 619 | 1843 | 184.300 | 2.977 |
| 1 | up | A | 100 | 5304 | 21665 | 216.650 | 4.085 |
| 1 | up | A | 1000 | 51188 | 211479 | 211.479 | 4.131 |
| 1 | down | A | 100 | 4812 | 20179 | 201.790 | 4.193 |
| 1 | down | A | 10 | 559 | 2278 | 227.800 | 4.075 |
| 1 | down | A | 1 | 74 | 314 | 314.000 | 4.243 |
| 1 | down | A | 0 | 0 | 35 | — | — |
| 2 | up | A | 1 | 57 | 206 | 206.000 | 3.614 |
| 2 | up | A | 10 | 593 | 1793 | 179.300 | 3.024 |
| 2 | up | A | 100 | 5395 | 21935 | 219.350 | 4.066 |
| 2 | up | A | 1000 | 50583 | 208992 | 208.992 | 4.132 |
| 2 | down | A | 100 | 4888 | 20403 | 204.030 | 4.174 |
| 2 | down | A | 10 | 422 | 1871 | 187.100 | 4.434 |
| 2 | down | A | 1 | 17 | 143 | 143.000 | 8.412 |
| 2 | down | A | 0 | 0 | 35 | — | — |

## Lifecycle space averages

| Run | Replica | scope | memory B/Strip | memory B/Frame | storage B/Strip | storage B/Frame |
| ---: | --- | --- | ---: | ---: | ---: | ---: |
| 0 | A | scaleUp | 428.126 | 8.476 | 209.032 | 4.138 |
| 0 | A | scaleDown | 411.243 | 8.501 | 205.667 | 4.251 |
| 0 | A | fullLifecycle | 426.592 | 8.478 | 208.726 | 4.148 |
| 1 | A | scaleUp | 435.845 | 8.473 | 211.661 | 4.115 |
| 1 | A | scaleDown | 416.649 | 8.494 | 205.144 | 4.182 |
| 1 | A | fullLifecycle | 434.101 | 8.475 | 211.069 | 4.121 |
| 2 | A | scaleUp | 431.813 | 8.472 | 209.654 | 4.113 |
| 2 | A | scaleDown | 408.144 | 8.505 | 201.955 | 4.208 |
| 2 | A | fullLifecycle | 429.663 | 8.475 | 208.955 | 4.121 |

## Measurement notes

- Scale is the number of visible logical Strips maintained by the benchmark model. Every mutation targets a complete Strip boundary; retained Mask structures are reported separately.
- The workload has two peers editing the same document. Every local Gossip is applied by the receiver and every acknowledgement returned by apply is gossiped back to the sender. randomIngest times only the measured peer applying the remote replacement Gossip.
- Per-Replica retained bytes after restart are estimated as four bytes per Sequence metadata word plus eight bytes per JavaScript Footage array slot. Process RSS is shared and reported at checkpoint scope.
- Persistent representation size is the byte length of node:v8.serialize over the automatically collected public Sequence.
- Every checkpoint measures temporary Projection creation without replacing the two active gossip peers.
