# Sequencer dynamic lifecycle benchmark

Generated: 2026-10-10T13:17:13.201Z

Node 24.16.0; V8 13.6.233.17-node.49; win32 x64; Intel(R) Core(TM) i5-10210U CPU @ 1.60GHz.

Runs: 3; lifecycle: 0 → 1,000 → 0 visible Strips; Strip length: 1…100 Frames.

Latencies use the authoritative sample-weighted arithmetic average. All latency columns are µs/op.

## Aggregate operation latency

| Replica | scope | operation | calls | ops/sec | weighted avg | mean run avg | median run avg | std. dev. | minimum run | maximum run |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| A | scaleUp | tailInsert | 1,500 | 335,196 | 2.983 | 2.983 | 3.029 | 0.369 | 2: 2.510 | 0: 3.411 |
| A | scaleUp | headInsert | 1,500 | 267,929 | 3.732 | 3.732 | 4.004 | 0.398 | 2: 3.169 | 1: 4.024 |
| A | scaleUp | headRemove | 0 | — | — | — | — | — | — | — |
| A | scaleUp | tailRemove | 0 | — | — | — | — | — | — | — |
| A | scaleUp | randomFind | 3,000 | 25,747 | 38.840 | 38.840 | 41.591 | 4.024 | 0: 33.151 | 2: 41.779 |
| A | scaleUp | randomRemove | 3,000 | 20,251 | 49.380 | 49.380 | 48.618 | 6.640 | 0: 41.656 | 1: 57.867 |
| A | scaleUp | randomReplace | 3,000 | 19,071 | 52.435 | 52.435 | 50.142 | 3.647 | 0: 49.580 | 1: 57.582 |
| A | scaleUp | randomInsert | 3,000 | 19,329 | 51.736 | 51.736 | 48.315 | 6.899 | 0: 45.534 | 1: 61.359 |
| A | scaleUp | randomIngest | 3,000 | 6,793 | 147.212 | 147.212 | 126.111 | 30.748 | 2: 124.834 | 1: 190.690 |
| A | scaleDown | tailInsert | 0 | — | — | — | — | — | — | — |
| A | scaleDown | headInsert | 0 | — | — | — | — | — | — | — |
| A | scaleDown | headRemove | 1,500 | 120,059 | 8.329 | 8.329 | 8.754 | 1.032 | 2: 6.908 | 1: 9.326 |
| A | scaleDown | tailRemove | 1,500 | 99,879 | 10.012 | 10.012 | 10.522 | 2.709 | 2: 6.469 | 1: 13.045 |
| A | scaleDown | randomFind | 3,000 | 7,135 | 140.157 | 140.157 | 149.277 | 31.096 | 2: 98.340 | 1: 172.854 |
| A | scaleDown | randomRemove | 3,000 | 8,154 | 122.645 | 122.645 | 138.054 | 22.003 | 2: 91.528 | 1: 138.353 |
| A | scaleDown | randomReplace | 3,000 | 7,769 | 128.724 | 128.724 | 146.121 | 25.930 | 2: 92.069 | 0: 147.980 |
| A | scaleDown | randomInsert | 3,000 | 7,725 | 129.443 | 129.443 | 138.322 | 22.869 | 2: 98.071 | 1: 151.935 |
| A | scaleDown | randomIngest | 2,997 | 3,360 | 297.576 | 297.576 | 328.430 | 44.941 | 2: 234.028 | 1: 330.268 |
| A | fullLifecycle | tailInsert | 1,500 | 335,196 | 2.983 | 2.983 | 3.029 | 0.369 | 2: 2.510 | 0: 3.411 |
| A | fullLifecycle | headInsert | 1,500 | 267,929 | 3.732 | 3.732 | 4.004 | 0.398 | 2: 3.169 | 1: 4.024 |
| A | fullLifecycle | headRemove | 1,500 | 120,059 | 8.329 | 8.329 | 8.754 | 1.032 | 2: 6.908 | 1: 9.326 |
| A | fullLifecycle | tailRemove | 1,500 | 99,879 | 10.012 | 10.012 | 10.522 | 2.709 | 2: 6.469 | 1: 13.045 |
| A | fullLifecycle | randomFind | 6,000 | 11,173 | 89.498 | 89.498 | 91.214 | 15.220 | 2: 70.059 | 1: 107.222 |
| A | fullLifecycle | randomRemove | 6,000 | 11,626 | 86.013 | 86.013 | 89.855 | 11.764 | 2: 70.073 | 1: 98.110 |
| A | fullLifecycle | randomReplace | 6,000 | 11,040 | 90.579 | 90.579 | 98.780 | 13.827 | 2: 71.106 | 1: 101.852 |
| A | fullLifecycle | randomInsert | 6,000 | 11,039 | 90.589 | 90.589 | 91.928 | 13.690 | 2: 73.193 | 1: 106.647 |
| A | fullLifecycle | randomIngest | 5,997 | 4,497 | 222.356 | 222.356 | 227.220 | 33.263 | 2: 179.404 | 1: 260.444 |

## Scaling performance

Checkpoint values are cumulative full-lifecycle averages at that point and are never reset.

| Run | direction | Strips | Frames | Replica | operation | calls | ops/sec | avg | min | max |
| ---: | --- | ---: | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 0 | up | 1 | 8 | A | tailInsert | 1 | 135,135 | 7.400 | 7.400 | 7.400 |
| 0 | up | 1 | 8 | A | headInsert | 0 | — | — | — | — |
| 0 | up | 1 | 8 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 1 | 8 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 1 | 8 | A | randomFind | 1 | 476,190 | 2.100 | 2.100 | 2.100 |
| 0 | up | 1 | 8 | A | randomRemove | 1 | 163,934 | 6.100 | 6.100 | 6.100 |
| 0 | up | 1 | 8 | A | randomReplace | 1 | 64,103 | 15.600 | 15.600 | 15.600 |
| 0 | up | 1 | 8 | A | randomInsert | 1 | 454,545 | 2.200 | 2.200 | 2.200 |
| 0 | up | 1 | 8 | A | randomIngest | 1 | 49,505 | 20.200 | 20.200 | 20.200 |
| 0 | up | 10 | 410 | A | tailInsert | 5 | 198,413 | 5.040 | 4.000 | 7.400 |
| 0 | up | 10 | 410 | A | headInsert | 5 | 76,220 | 13.120 | 4.600 | 41.500 |
| 0 | up | 10 | 410 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 10 | 410 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 10 | 410 | A | randomFind | 10 | 543,478 | 1.840 | 0.600 | 4.600 |
| 0 | up | 10 | 410 | A | randomRemove | 10 | 133,690 | 7.480 | 5.300 | 11.300 |
| 0 | up | 10 | 410 | A | randomReplace | 10 | 55,928 | 17.880 | 10.700 | 40.400 |
| 0 | up | 10 | 410 | A | randomInsert | 10 | 185,185 | 5.400 | 2.200 | 6.900 |
| 0 | up | 10 | 410 | A | randomIngest | 10 | 35,373 | 28.270 | 17.500 | 94.900 |
| 0 | up | 100 | 4,859 | A | tailInsert | 50 | 154,703 | 6.464 | 3.100 | 35.400 |
| 0 | up | 100 | 4,859 | A | headInsert | 50 | 123,732 | 8.082 | 4.200 | 41.500 |
| 0 | up | 100 | 4,859 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 100 | 4,859 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 100 | 4,859 | A | randomFind | 100 | 170,300 | 5.872 | 0.400 | 72.900 |
| 0 | up | 100 | 4,859 | A | randomRemove | 100 | 70,299 | 14.225 | 4.600 | 201.200 |
| 0 | up | 100 | 4,859 | A | randomReplace | 100 | 46,185 | 21.652 | 8.700 | 87.000 |
| 0 | up | 100 | 4,859 | A | randomInsert | 100 | 73,089 | 13.682 | 2.200 | 118.000 |
| 0 | up | 100 | 4,859 | A | randomIngest | 100 | 26,864 | 37.225 | 11.000 | 503.800 |
| 0 | up | 1,000 | 50,842 | A | tailInsert | 500 | 293,186 | 3.411 | 1.400 | 42.400 |
| 0 | up | 1,000 | 50,842 | A | headInsert | 500 | 249,775 | 4.004 | 1.600 | 41.500 |
| 0 | up | 1,000 | 50,842 | A | headRemove | 0 | — | — | — | — |
| 0 | up | 1,000 | 50,842 | A | tailRemove | 0 | — | — | — | — |
| 0 | up | 1,000 | 50,842 | A | randomFind | 1,000 | 30,165 | 33.151 | 0.400 | 558.000 |
| 0 | up | 1,000 | 50,842 | A | randomRemove | 1,000 | 24,006 | 41.656 | 2.300 | 1023.900 |
| 0 | up | 1,000 | 50,842 | A | randomReplace | 1,000 | 20,169 | 49.580 | 4.000 | 843.300 |
| 0 | up | 1,000 | 50,842 | A | randomInsert | 1,000 | 21,962 | 45.534 | 1.900 | 794.300 |
| 0 | up | 1,000 | 50,842 | A | randomIngest | 1,000 | 7,930 | 126.111 | 7.500 | 4136.300 |
| 0 | down | 100 | 4,898 | A | tailInsert | 500 | 293,186 | 3.411 | 1.400 | 42.400 |
| 0 | down | 100 | 4,898 | A | headInsert | 500 | 249,775 | 4.004 | 1.600 | 41.500 |
| 0 | down | 100 | 4,898 | A | headRemove | 450 | 110,008 | 9.090 | 3.000 | 111.500 |
| 0 | down | 100 | 4,898 | A | tailRemove | 450 | 92,535 | 10.807 | 3.100 | 174.600 |
| 0 | down | 100 | 4,898 | A | randomFind | 1,900 | 10,649 | 93.902 | 0.400 | 1965.500 |
| 0 | down | 100 | 4,898 | A | randomRemove | 1,900 | 10,730 | 93.199 | 2.300 | 2384.700 |
| 0 | down | 100 | 4,898 | A | randomReplace | 1,900 | 10,184 | 98.194 | 4.000 | 2180.000 |
| 0 | down | 100 | 4,898 | A | randomInsert | 1,900 | 10,540 | 94.875 | 1.900 | 1977.500 |
| 0 | down | 100 | 4,898 | A | randomIngest | 1,900 | 4,285 | 233.347 | 7.500 | 4136.300 |
| 0 | down | 10 | 397 | A | tailInsert | 500 | 293,186 | 3.411 | 1.400 | 42.400 |
| 0 | down | 10 | 397 | A | headInsert | 500 | 249,775 | 4.004 | 1.600 | 41.500 |
| 0 | down | 10 | 397 | A | headRemove | 495 | 113,945 | 8.776 | 2.500 | 111.500 |
| 0 | down | 10 | 397 | A | tailRemove | 495 | 94,531 | 10.579 | 2.000 | 174.600 |
| 0 | down | 10 | 397 | A | randomFind | 1,990 | 10,913 | 91.633 | 0.400 | 1965.500 |
| 0 | down | 10 | 397 | A | randomRemove | 1,990 | 11,078 | 90.265 | 2.300 | 2384.700 |
| 0 | down | 10 | 397 | A | randomReplace | 1,990 | 10,401 | 96.146 | 3.700 | 2180.000 |
| 0 | down | 10 | 397 | A | randomInsert | 1,990 | 10,827 | 92.361 | 1.700 | 1977.500 |
| 0 | down | 10 | 397 | A | randomIngest | 1,990 | 4,415 | 226.490 | 6.100 | 4136.300 |
| 0 | down | 1 | 75 | A | tailInsert | 500 | 293,186 | 3.411 | 1.400 | 42.400 |
| 0 | down | 1 | 75 | A | headInsert | 500 | 249,775 | 4.004 | 1.600 | 41.500 |
| 0 | down | 1 | 75 | A | headRemove | 500 | 114,239 | 8.754 | 2.500 | 111.500 |
| 0 | down | 1 | 75 | A | tailRemove | 499 | 94,970 | 10.530 | 2.000 | 174.600 |
| 0 | down | 1 | 75 | A | randomFind | 1,999 | 10,958 | 91.257 | 0.400 | 1965.500 |
| 0 | down | 1 | 75 | A | randomRemove | 1,999 | 11,124 | 89.892 | 2.300 | 2384.700 |
| 0 | down | 1 | 75 | A | randomReplace | 1,999 | 10,441 | 95.772 | 3.700 | 2180.000 |
| 0 | down | 1 | 75 | A | randomInsert | 1,999 | 10,873 | 91.971 | 1.700 | 1977.500 |
| 0 | down | 1 | 75 | A | randomIngest | 1,999 | 4,401 | 227.220 | 6.100 | 4136.300 |
| 0 | down | 0 | 0 | A | tailInsert | 500 | 293,186 | 3.411 | 1.400 | 42.400 |
| 0 | down | 0 | 0 | A | headInsert | 500 | 249,775 | 4.004 | 1.600 | 41.500 |
| 0 | down | 0 | 0 | A | headRemove | 500 | 114,239 | 8.754 | 2.500 | 111.500 |
| 0 | down | 0 | 0 | A | tailRemove | 500 | 95,037 | 10.522 | 2.000 | 174.600 |
| 0 | down | 0 | 0 | A | randomFind | 2,000 | 10,963 | 91.214 | 0.400 | 1965.500 |
| 0 | down | 0 | 0 | A | randomRemove | 2,000 | 11,129 | 89.855 | 2.300 | 2384.700 |
| 0 | down | 0 | 0 | A | randomReplace | 2,000 | 10,124 | 98.780 | 3.700 | 6111.200 |
| 0 | down | 0 | 0 | A | randomInsert | 2,000 | 10,878 | 91.928 | 1.700 | 1977.500 |
| 0 | down | 0 | 0 | A | randomIngest | 1,999 | 4,401 | 227.220 | 6.100 | 4136.300 |
| 1 | up | 1 | 38 | A | tailInsert | 1 | 153,846 | 6.500 | 6.500 | 6.500 |
| 1 | up | 1 | 38 | A | headInsert | 0 | — | — | — | — |
| 1 | up | 1 | 38 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 1 | 38 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 1 | 38 | A | randomFind | 1 | 714,286 | 1.400 | 1.400 | 1.400 |
| 1 | up | 1 | 38 | A | randomRemove | 1 | 123,457 | 8.100 | 8.100 | 8.100 |
| 1 | up | 1 | 38 | A | randomReplace | 1 | 38,168 | 26.200 | 26.200 | 26.200 |
| 1 | up | 1 | 38 | A | randomInsert | 1 | 294,118 | 3.400 | 3.400 | 3.400 |
| 1 | up | 1 | 38 | A | randomIngest | 1 | 43,668 | 22.900 | 22.900 | 22.900 |
| 1 | up | 10 | 619 | A | tailInsert | 5 | 210,084 | 4.760 | 2.100 | 10.400 |
| 1 | up | 10 | 619 | A | headInsert | 5 | 56,370 | 17.740 | 2.500 | 74.400 |
| 1 | up | 10 | 619 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 10 | 619 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 10 | 619 | A | randomFind | 10 | 377,358 | 2.650 | 0.700 | 6.300 |
| 1 | up | 10 | 619 | A | randomRemove | 10 | 130,719 | 7.650 | 3.800 | 24.000 |
| 1 | up | 10 | 619 | A | randomReplace | 10 | 51,361 | 19.470 | 8.100 | 59.000 |
| 1 | up | 10 | 619 | A | randomInsert | 10 | 179,533 | 5.570 | 2.400 | 16.800 |
| 1 | up | 10 | 619 | A | randomIngest | 10 | 67,889 | 14.730 | 9.400 | 24.000 |
| 1 | up | 100 | 5,304 | A | tailInsert | 50 | 284,900 | 3.510 | 1.200 | 20.900 |
| 1 | up | 100 | 5,304 | A | headInsert | 50 | 150,240 | 6.656 | 1.700 | 74.400 |
| 1 | up | 100 | 5,304 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 100 | 5,304 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 100 | 5,304 | A | randomFind | 100 | 125,549 | 7.965 | 0.700 | 81.900 |
| 1 | up | 100 | 5,304 | A | randomRemove | 100 | 68,804 | 14.534 | 1.900 | 143.100 |
| 1 | up | 100 | 5,304 | A | randomReplace | 100 | 46,948 | 21.300 | 3.700 | 216.100 |
| 1 | up | 100 | 5,304 | A | randomInsert | 100 | 88,238 | 11.333 | 1.700 | 62.900 |
| 1 | up | 100 | 5,304 | A | randomIngest | 100 | 26,119 | 38.286 | 5.700 | 227.700 |
| 1 | up | 1,000 | 51,188 | A | tailInsert | 500 | 330,120 | 3.029 | 1.200 | 49.900 |
| 1 | up | 1,000 | 51,188 | A | headInsert | 500 | 248,509 | 4.024 | 1.600 | 74.400 |
| 1 | up | 1,000 | 51,188 | A | headRemove | 0 | — | — | — | — |
| 1 | up | 1,000 | 51,188 | A | tailRemove | 0 | — | — | — | — |
| 1 | up | 1,000 | 51,188 | A | randomFind | 1,000 | 24,044 | 41.591 | 0.700 | 1054.200 |
| 1 | up | 1,000 | 51,188 | A | randomRemove | 1,000 | 17,281 | 57.867 | 1.900 | 1591.900 |
| 1 | up | 1,000 | 51,188 | A | randomReplace | 1,000 | 17,367 | 57.582 | 3.700 | 1409.900 |
| 1 | up | 1,000 | 51,188 | A | randomInsert | 1,000 | 16,298 | 61.359 | 1.400 | 5294.600 |
| 1 | up | 1,000 | 51,188 | A | randomIngest | 1,000 | 5,244 | 190.690 | 5.700 | 36358.300 |
| 1 | down | 100 | 4,812 | A | tailInsert | 500 | 330,120 | 3.029 | 1.200 | 49.900 |
| 1 | down | 100 | 4,812 | A | headInsert | 500 | 248,509 | 4.024 | 1.600 | 74.400 |
| 1 | down | 100 | 4,812 | A | headRemove | 450 | 104,969 | 9.527 | 2.600 | 153.500 |
| 1 | down | 100 | 4,812 | A | tailRemove | 450 | 76,066 | 13.146 | 3.200 | 1170.700 |
| 1 | down | 100 | 4,812 | A | randomFind | 1,900 | 9,168 | 109.079 | 0.700 | 13735.900 |
| 1 | down | 100 | 4,812 | A | randomRemove | 1,900 | 9,936 | 100.643 | 1.900 | 1591.900 |
| 1 | down | 100 | 4,812 | A | randomReplace | 1,900 | 9,780 | 102.251 | 3.700 | 9072.000 |
| 1 | down | 100 | 4,812 | A | randomInsert | 1,900 | 9,171 | 109.041 | 1.400 | 5294.600 |
| 1 | down | 100 | 4,812 | A | randomIngest | 1,900 | 3,795 | 263.495 | 5.700 | 36358.300 |
| 1 | down | 10 | 559 | A | tailInsert | 500 | 330,120 | 3.029 | 1.200 | 49.900 |
| 1 | down | 10 | 559 | A | headInsert | 500 | 248,509 | 4.024 | 1.600 | 74.400 |
| 1 | down | 10 | 559 | A | headRemove | 495 | 107,667 | 9.288 | 2.100 | 153.500 |
| 1 | down | 10 | 559 | A | tailRemove | 495 | 79,275 | 12.614 | 2.400 | 1170.700 |
| 1 | down | 10 | 559 | A | randomFind | 1,990 | 9,300 | 107.526 | 0.500 | 13735.900 |
| 1 | down | 10 | 559 | A | randomRemove | 1,990 | 10,157 | 98.458 | 1.900 | 1591.900 |
| 1 | down | 10 | 559 | A | randomReplace | 1,990 | 9,999 | 100.007 | 3.700 | 9072.000 |
| 1 | down | 10 | 559 | A | randomInsert | 1,990 | 9,394 | 106.448 | 1.400 | 5294.600 |
| 1 | down | 10 | 559 | A | randomIngest | 1,990 | 3,845 | 260.059 | 5.700 | 36358.300 |
| 1 | down | 1 | 74 | A | tailInsert | 500 | 330,120 | 3.029 | 1.200 | 49.900 |
| 1 | down | 1 | 74 | A | headInsert | 500 | 248,509 | 4.024 | 1.600 | 74.400 |
| 1 | down | 1 | 74 | A | headRemove | 500 | 107,229 | 9.326 | 2.100 | 153.500 |
| 1 | down | 1 | 74 | A | tailRemove | 499 | 76,565 | 13.061 | 2.400 | 1170.700 |
| 1 | down | 1 | 74 | A | randomFind | 1,999 | 9,322 | 107.273 | 0.500 | 13735.900 |
| 1 | down | 1 | 74 | A | randomRemove | 1,999 | 10,188 | 98.154 | 1.900 | 1591.900 |
| 1 | down | 1 | 74 | A | randomReplace | 1,999 | 9,993 | 100.069 | 3.700 | 9072.000 |
| 1 | down | 1 | 74 | A | randomInsert | 1,999 | 9,372 | 106.698 | 1.400 | 5294.600 |
| 1 | down | 1 | 74 | A | randomIngest | 1,999 | 3,840 | 260.444 | 5.700 | 36358.300 |
| 1 | down | 0 | 0 | A | tailInsert | 500 | 330,120 | 3.029 | 1.200 | 49.900 |
| 1 | down | 0 | 0 | A | headInsert | 500 | 248,509 | 4.024 | 1.600 | 74.400 |
| 1 | down | 0 | 0 | A | headRemove | 500 | 107,229 | 9.326 | 2.100 | 153.500 |
| 1 | down | 0 | 0 | A | tailRemove | 500 | 76,658 | 13.045 | 2.400 | 1170.700 |
| 1 | down | 0 | 0 | A | randomFind | 2,000 | 9,326 | 107.222 | 0.500 | 13735.900 |
| 1 | down | 0 | 0 | A | randomRemove | 2,000 | 10,193 | 98.110 | 1.900 | 1591.900 |
| 1 | down | 0 | 0 | A | randomReplace | 2,000 | 9,818 | 101.852 | 3.700 | 9072.000 |
| 1 | down | 0 | 0 | A | randomInsert | 2,000 | 9,377 | 106.647 | 1.400 | 5294.600 |
| 1 | down | 0 | 0 | A | randomIngest | 1,999 | 3,840 | 260.444 | 5.700 | 36358.300 |
| 2 | up | 1 | 57 | A | tailInsert | 1 | 181,818 | 5.500 | 5.500 | 5.500 |
| 2 | up | 1 | 57 | A | headInsert | 0 | — | — | — | — |
| 2 | up | 1 | 57 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 1 | 57 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 1 | 57 | A | randomFind | 1 | 769,231 | 1.300 | 1.300 | 1.300 |
| 2 | up | 1 | 57 | A | randomRemove | 1 | 256,410 | 3.900 | 3.900 | 3.900 |
| 2 | up | 1 | 57 | A | randomReplace | 1 | 71,429 | 14.000 | 14.000 | 14.000 |
| 2 | up | 1 | 57 | A | randomInsert | 1 | 909,091 | 1.100 | 1.100 | 1.100 |
| 2 | up | 1 | 57 | A | randomIngest | 1 | 185,185 | 5.400 | 5.400 | 5.400 |
| 2 | up | 10 | 593 | A | tailInsert | 5 | 450,450 | 2.220 | 1.100 | 5.500 |
| 2 | up | 10 | 593 | A | headInsert | 5 | 114,155 | 8.760 | 1.500 | 34.800 |
| 2 | up | 10 | 593 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 10 | 593 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 10 | 593 | A | randomFind | 10 | 1,030,928 | 0.970 | 0.500 | 2.100 |
| 2 | up | 10 | 593 | A | randomRemove | 10 | 280,112 | 3.570 | 1.700 | 7.600 |
| 2 | up | 10 | 593 | A | randomReplace | 10 | 112,740 | 8.870 | 3.100 | 18.900 |
| 2 | up | 10 | 593 | A | randomInsert | 10 | 358,423 | 2.790 | 1.100 | 5.500 |
| 2 | up | 10 | 593 | A | randomIngest | 10 | 119,048 | 8.400 | 5.100 | 19.300 |
| 2 | up | 100 | 5,395 | A | tailInsert | 50 | 486,381 | 2.056 | 1.000 | 15.000 |
| 2 | up | 100 | 5,395 | A | headInsert | 50 | 366,838 | 2.726 | 1.300 | 34.800 |
| 2 | up | 100 | 5,395 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 100 | 5,395 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 100 | 5,395 | A | randomFind | 100 | 249,004 | 4.016 | 0.400 | 35.300 |
| 2 | up | 100 | 5,395 | A | randomRemove | 100 | 138,947 | 7.197 | 1.700 | 76.000 |
| 2 | up | 100 | 5,395 | A | randomReplace | 100 | 87,397 | 11.442 | 2.800 | 134.600 |
| 2 | up | 100 | 5,395 | A | randomInsert | 100 | 193,648 | 5.164 | 1.100 | 33.800 |
| 2 | up | 100 | 5,395 | A | randomIngest | 100 | 59,449 | 16.821 | 5.100 | 106.600 |
| 2 | up | 1,000 | 50,583 | A | tailInsert | 500 | 398,406 | 2.510 | 1.000 | 25.500 |
| 2 | up | 1,000 | 50,583 | A | headInsert | 500 | 315,517 | 3.169 | 1.300 | 34.800 |
| 2 | up | 1,000 | 50,583 | A | headRemove | 0 | — | — | — | — |
| 2 | up | 1,000 | 50,583 | A | tailRemove | 0 | — | — | — | — |
| 2 | up | 1,000 | 50,583 | A | randomFind | 1,000 | 23,936 | 41.779 | 0.400 | 971.200 |
| 2 | up | 1,000 | 50,583 | A | randomRemove | 1,000 | 20,568 | 48.618 | 1.700 | 968.400 |
| 2 | up | 1,000 | 50,583 | A | randomReplace | 1,000 | 19,943 | 50.142 | 2.800 | 910.300 |
| 2 | up | 1,000 | 50,583 | A | randomInsert | 1,000 | 20,698 | 48.315 | 1.100 | 1089.100 |
| 2 | up | 1,000 | 50,583 | A | randomIngest | 1,000 | 8,011 | 124.834 | 5.100 | 1809.000 |
| 2 | down | 100 | 4,888 | A | tailInsert | 500 | 398,406 | 2.510 | 1.000 | 25.500 |
| 2 | down | 100 | 4,888 | A | headInsert | 500 | 315,517 | 3.169 | 1.300 | 34.800 |
| 2 | down | 100 | 4,888 | A | headRemove | 450 | 147,740 | 6.769 | 2.400 | 273.700 |
| 2 | down | 100 | 4,888 | A | tailRemove | 450 | 160,474 | 6.232 | 2.700 | 48.700 |
| 2 | down | 100 | 4,888 | A | randomFind | 1,900 | 13,832 | 72.294 | 0.400 | 971.200 |
| 2 | down | 100 | 4,888 | A | randomRemove | 1,900 | 13,788 | 72.527 | 1.700 | 1268.700 |
| 2 | down | 100 | 4,888 | A | randomReplace | 1,900 | 13,902 | 71.933 | 2.800 | 1633.700 |
| 2 | down | 100 | 4,888 | A | randomInsert | 1,900 | 13,233 | 75.567 | 1.100 | 1110.800 |
| 2 | down | 100 | 4,888 | A | randomIngest | 1,900 | 5,469 | 182.855 | 5.100 | 9932.400 |
| 2 | down | 10 | 422 | A | tailInsert | 500 | 398,406 | 2.510 | 1.000 | 25.500 |
| 2 | down | 10 | 422 | A | headInsert | 500 | 315,517 | 3.169 | 1.300 | 34.800 |
| 2 | down | 10 | 422 | A | headRemove | 495 | 144,488 | 6.921 | 2.400 | 273.700 |
| 2 | down | 10 | 422 | A | tailRemove | 495 | 153,674 | 6.507 | 2.200 | 73.500 |
| 2 | down | 10 | 422 | A | randomFind | 1,990 | 14,204 | 70.404 | 0.400 | 971.200 |
| 2 | down | 10 | 422 | A | randomRemove | 1,990 | 14,205 | 70.400 | 1.700 | 1268.700 |
| 2 | down | 10 | 422 | A | randomReplace | 1,990 | 14,244 | 70.204 | 2.800 | 1633.700 |
| 2 | down | 10 | 422 | A | randomInsert | 1,990 | 13,599 | 73.534 | 1.100 | 1110.800 |
| 2 | down | 10 | 422 | A | randomIngest | 1,990 | 5,599 | 178.608 | 5.100 | 9932.400 |
| 2 | down | 1 | 17 | A | tailInsert | 500 | 398,406 | 2.510 | 1.000 | 25.500 |
| 2 | down | 1 | 17 | A | headInsert | 500 | 315,517 | 3.169 | 1.300 | 34.800 |
| 2 | down | 1 | 17 | A | headRemove | 500 | 144,751 | 6.908 | 1.900 | 273.700 |
| 2 | down | 1 | 17 | A | tailRemove | 499 | 154,379 | 6.478 | 1.900 | 73.500 |
| 2 | down | 1 | 17 | A | randomFind | 1,999 | 14,267 | 70.092 | 0.300 | 971.200 |
| 2 | down | 1 | 17 | A | randomRemove | 1,999 | 14,264 | 70.105 | 1.700 | 1268.700 |
| 2 | down | 1 | 17 | A | randomReplace | 1,999 | 14,293 | 69.966 | 2.800 | 1633.700 |
| 2 | down | 1 | 17 | A | randomInsert | 1,999 | 13,656 | 73.228 | 1.100 | 1110.800 |
| 2 | down | 1 | 17 | A | randomIngest | 1,999 | 5,574 | 179.404 | 4.300 | 9932.400 |
| 2 | down | 0 | 0 | A | tailInsert | 500 | 398,406 | 2.510 | 1.000 | 25.500 |
| 2 | down | 0 | 0 | A | headInsert | 500 | 315,517 | 3.169 | 1.300 | 34.800 |
| 2 | down | 0 | 0 | A | headRemove | 500 | 144,751 | 6.908 | 1.900 | 273.700 |
| 2 | down | 0 | 0 | A | tailRemove | 500 | 154,579 | 6.469 | 1.900 | 73.500 |
| 2 | down | 0 | 0 | A | randomFind | 2,000 | 14,274 | 70.059 | 0.300 | 971.200 |
| 2 | down | 0 | 0 | A | randomRemove | 2,000 | 14,271 | 70.073 | 1.700 | 1268.700 |
| 2 | down | 0 | 0 | A | randomReplace | 2,000 | 14,064 | 71.106 | 2.800 | 2350.200 |
| 2 | down | 0 | 0 | A | randomInsert | 2,000 | 13,663 | 73.193 | 1.100 | 1110.800 |
| 2 | down | 0 | 0 | A | randomIngest | 1,999 | 5,574 | 179.404 | 4.300 | 9932.400 |

## Management performance

| Run | direction | Strips | Replica | operation | calls | ops/sec | avg |
| ---: | --- | ---: | --- | --- | ---: | ---: | ---: |
| 0 | up | 1 | A | values | 1 | 9,434 | 106.000 |
| 0 | up | 1 | A | sequence | 1 | 8,651 | 115.600 |
| 0 | up | 1 | A | create | 1 | 9,320 | 107.300 |
| 0 | up | 10 | A | values | 1 | 5,609 | 178.300 |
| 0 | up | 10 | A | sequence | 1 | 809 | 1235.900 |
| 0 | up | 10 | A | create | 1 | 1,405 | 711.800 |
| 0 | up | 100 | A | values | 1 | 2,374 | 421.300 |
| 0 | up | 100 | A | sequence | 1 | 280 | 3574.100 |
| 0 | up | 100 | A | create | 1 | 1,827 | 547.200 |
| 0 | up | 1,000 | A | values | 1 | 232 | 4318.100 |
| 0 | up | 1,000 | A | sequence | 1 | 20 | 49895.500 |
| 0 | up | 1,000 | A | create | 1 | 98 | 10183.600 |
| 0 | down | 100 | A | values | 1 | 531 | 1884.300 |
| 0 | down | 100 | A | sequence | 1 | 11 | 90058.200 |
| 0 | down | 100 | A | create | 1 | 2,602 | 384.300 |
| 0 | down | 10 | A | values | 1 | 14,472 | 69.100 |
| 0 | down | 10 | A | sequence | 1 | 10 | 96914.300 |
| 0 | down | 10 | A | create | 1 | 2,598 | 384.900 |
| 0 | down | 1 | A | values | 1 | 163,934 | 6.100 |
| 0 | down | 1 | A | sequence | 1 | 12 | 81386.000 |
| 0 | down | 1 | A | create | 1 | 8,681 | 115.200 |
| 0 | down | 0 | A | values | 1 | 181,818 | 5.500 |
| 0 | down | 0 | A | sequence | 1 | 1,354 | 738.800 |
| 0 | down | 0 | A | create | 1 | 6,623 | 151.000 |
| 1 | up | 1 | A | values | 1 | 44,053 | 22.700 |
| 1 | up | 1 | A | sequence | 1 | 6,784 | 147.400 |
| 1 | up | 1 | A | create | 1 | 320 | 3122.800 |
| 1 | up | 10 | A | values | 1 | 2,871 | 348.300 |
| 1 | up | 10 | A | sequence | 1 | 1,008 | 992.400 |
| 1 | up | 10 | A | create | 1 | 5,869 | 170.400 |
| 1 | up | 100 | A | values | 1 | 3,544 | 282.200 |
| 1 | up | 100 | A | sequence | 1 | 196 | 5107.700 |
| 1 | up | 100 | A | create | 1 | 2,165 | 462.000 |
| 1 | up | 1,000 | A | values | 1 | 300 | 3331.100 |
| 1 | up | 1,000 | A | sequence | 1 | 34 | 29013.800 |
| 1 | up | 1,000 | A | create | 1 | 328 | 3049.800 |
| 1 | down | 100 | A | values | 1 | 1,127 | 887.600 |
| 1 | down | 100 | A | sequence | 1 | 16 | 61524.600 |
| 1 | down | 100 | A | create | 1 | 2,690 | 371.800 |
| 1 | down | 10 | A | values | 1 | 10,121 | 98.800 |
| 1 | down | 10 | A | sequence | 1 | 15 | 66759.600 |
| 1 | down | 10 | A | create | 1 | 9,276 | 107.800 |
| 1 | down | 1 | A | values | 1 | 344,828 | 2.900 |
| 1 | down | 1 | A | sequence | 1 | 13 | 77157.500 |
| 1 | down | 1 | A | create | 1 | 14,368 | 69.600 |
| 1 | down | 0 | A | values | 1 | 666,667 | 1.500 |
| 1 | down | 0 | A | sequence | 1 | 19,342 | 51.700 |
| 1 | down | 0 | A | create | 1 | 14,815 | 67.500 |
| 2 | up | 1 | A | values | 1 | 120,482 | 8.300 |
| 2 | up | 1 | A | sequence | 1 | 10,582 | 94.500 |
| 2 | up | 1 | A | create | 1 | 11,547 | 86.600 |
| 2 | up | 10 | A | values | 1 | 68,966 | 14.500 |
| 2 | up | 10 | A | sequence | 1 | 3,465 | 288.600 |
| 2 | up | 10 | A | create | 1 | 6,614 | 151.200 |
| 2 | up | 100 | A | values | 1 | 5,900 | 169.500 |
| 2 | up | 100 | A | sequence | 1 | 330 | 3034.900 |
| 2 | up | 100 | A | create | 1 | 2,313 | 432.400 |
| 2 | up | 1,000 | A | values | 1 | 371 | 2694.500 |
| 2 | up | 1,000 | A | sequence | 1 | 37 | 26911.600 |
| 2 | up | 1,000 | A | create | 1 | 571 | 1751.600 |
| 2 | down | 100 | A | values | 1 | 2,817 | 355.000 |
| 2 | down | 100 | A | sequence | 1 | 19 | 51690.200 |
| 2 | down | 100 | A | create | 1 | 2,235 | 447.500 |
| 2 | down | 10 | A | values | 1 | 39,370 | 25.400 |
| 2 | down | 10 | A | sequence | 1 | 18 | 57079.000 |
| 2 | down | 10 | A | create | 1 | 10,846 | 92.200 |
| 2 | down | 1 | A | values | 1 | 400,000 | 2.500 |
| 2 | down | 1 | A | sequence | 1 | 17 | 58822.900 |
| 2 | down | 1 | A | create | 1 | 15,601 | 64.100 |
| 2 | down | 0 | A | values | 1 | 833,333 | 1.200 |
| 2 | down | 0 | A | sequence | 1 | 24,570 | 40.700 |
| 2 | down | 0 | A | create | 1 | 18,248 | 54.800 |

## Memory usage

Estimated bytes describe the exported Sequence representation. Process memory is shared by both peers, benchmark fixtures and temporary results.

| Run | direction | Replica | visible Strips | retained insertions | Frames | estimated memory bytes | memory B/Strip | memory B/Frame | process RSS | process heap used |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | up | A | 1 | 1 | 8 | 96 | 96.000 | 12.000 | 80,220,160 | 12,465,528 |
| 0 | up | A | 10 | 10 | 410 | 3,528 | 352.800 | 8.605 | 78,405,632 | 11,978,936 |
| 0 | up | A | 100 | 100 | 4,859 | 41,280 | 412.800 | 8.496 | 84,316,160 | 14,073,320 |
| 0 | up | A | 1,000 | 1,039 | 50,842 | 431,680 | 431.680 | 8.491 | 122,068,992 | 33,561,032 |
| 0 | down | A | 100 | 100 | 4,898 | 41,592 | 415.920 | 8.492 | 149,442,560 | 42,875,136 |
| 0 | down | A | 10 | 10 | 397 | 3,424 | 342.400 | 8.625 | 151,957,504 | 43,786,040 |
| 0 | down | A | 1 | 1 | 75 | 632 | 632.000 | 8.427 | 170,856,448 | 62,186,480 |
| 0 | down | A | 0 | 0 | 0 | 8 | — | — | 171,630,592 | 62,559,984 |
| 1 | up | A | 1 | 1 | 38 | 336 | 336.000 | 8.842 | 166,187,008 | 25,676,072 |
| 1 | up | A | 10 | 10 | 619 | 5,200 | 520.000 | 8.401 | 161,218,560 | 26,321,936 |
| 1 | up | A | 100 | 100 | 5,304 | 44,840 | 448.400 | 8.454 | 161,251,328 | 31,383,720 |
| 1 | up | A | 1,000 | 1,014 | 51,188 | 433,848 | 433.848 | 8.476 | 170,672,128 | 50,760,024 |
| 1 | down | A | 100 | 100 | 4,812 | 40,904 | 409.040 | 8.500 | 212,353,024 | 41,707,408 |
| 1 | down | A | 10 | 10 | 559 | 4,720 | 472.000 | 8.444 | 216,735,744 | 72,193,448 |
| 1 | down | A | 1 | 1 | 74 | 624 | 624.000 | 8.432 | 221,323,264 | 90,582,816 |
| 1 | down | A | 0 | 0 | 0 | 8 | — | — | 221,982,720 | 90,939,496 |
| 2 | up | A | 1 | 1 | 57 | 488 | 488.000 | 8.561 | 216,150,016 | 25,920,720 |
| 2 | up | A | 10 | 10 | 593 | 4,992 | 499.200 | 8.418 | 210,296,832 | 26,501,688 |
| 2 | up | A | 100 | 100 | 5,395 | 45,568 | 455.680 | 8.446 | 209,698,816 | 31,294,080 |
| 2 | up | A | 1,000 | 1,001 | 50,583 | 428,696 | 428.696 | 8.475 | 247,885,824 | 70,766,400 |
| 2 | down | A | 100 | 100 | 4,888 | 41,512 | 415.120 | 8.493 | 249,753,600 | 67,041,072 |
| 2 | down | A | 10 | 10 | 422 | 3,624 | 362.400 | 8.588 | 253,706,240 | 92,022,192 |
| 2 | down | A | 1 | 1 | 17 | 168 | 168.000 | 9.882 | 255,574,016 | 51,226,744 |
| 2 | down | A | 0 | 0 | 0 | 8 | — | — | 251,555,840 | 51,581,552 |

## Disk usage

Disk bytes are the size of node:v8.serialize(sequence), excluding filesystem metadata; no disk I/O is timed.

| Run | direction | Replica | visible Strips | Frames | sequence bytes | disk B/Strip | disk B/Frame |
| ---: | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 0 | up | A | 1 | 8 | 111 | 111.000 | 13.875 |
| 0 | up | A | 10 | 410 | 1491 | 149.100 | 3.637 |
| 0 | up | A | 100 | 4859 | 21015 | 210.150 | 4.325 |
| 0 | up | A | 1000 | 50842 | 211476 | 211.476 | 4.159 |
| 0 | down | A | 100 | 4898 | 20433 | 204.330 | 4.172 |
| 0 | down | A | 10 | 397 | 1792 | 179.200 | 4.514 |
| 0 | down | A | 1 | 75 | 317 | 317.000 | 4.227 |
| 0 | down | A | 0 | 0 | 35 | — | — |
| 1 | up | A | 1 | 38 | 168 | 168.000 | 4.421 |
| 1 | up | A | 10 | 619 | 1843 | 184.300 | 2.977 |
| 1 | up | A | 100 | 5304 | 21665 | 216.650 | 4.085 |
| 1 | up | A | 1000 | 51188 | 211269 | 211.269 | 4.127 |
| 1 | down | A | 100 | 4812 | 20179 | 201.790 | 4.193 |
| 1 | down | A | 10 | 559 | 2282 | 228.200 | 4.082 |
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
| 0 | A | scaleUp | 428.968 | 8.492 | 210.705 | 4.171 |
| 0 | A | scaleDown | 411.243 | 8.501 | 203.081 | 4.198 |
| 0 | A | fullLifecycle | 427.358 | 8.493 | 210.012 | 4.174 |
| 1 | A | scaleUp | 435.845 | 8.473 | 211.472 | 4.111 |
| 1 | A | scaleDown | 416.649 | 8.494 | 205.180 | 4.183 |
| 1 | A | fullLifecycle | 434.101 | 8.475 | 210.900 | 4.117 |
| 2 | A | scaleUp | 431.813 | 8.472 | 209.654 | 4.113 |
| 2 | A | scaleDown | 408.144 | 8.505 | 201.955 | 4.208 |
| 2 | A | fullLifecycle | 429.663 | 8.475 | 208.955 | 4.121 |

## Measurement notes

- Scale is the number of visible logical Strips maintained by the benchmark model. Every mutation targets a complete Strip boundary; retained Mask structures are reported separately.
- The workload has two peers editing the same document. Every local Gossip is applied by the receiver and every acknowledgement returned by apply is gossiped back to the sender. randomIngest times only the measured peer applying the remote replacement Gossip.
- Per-Replica retained bytes after restart are estimated as four bytes per Sequence metadata word plus eight bytes per JavaScript Footage array slot. Process RSS is shared and reported at checkpoint scope.
- Persistent representation size is the byte length of node:v8.serialize over the automatically collected public Sequence.
- Every checkpoint measures temporary Projection creation without replacing the two active gossip peers.
