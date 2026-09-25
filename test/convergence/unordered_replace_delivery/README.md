# Unordered replace delivery

Two actors edit the same retained four-frame sequence independently. The
resulting insert, remove, and replace deltas are then delivered to fresh live
peers chronologically, in reverse, and in a deterministic mixed order.

Delivery order must not affect the projection. Every peer must expose the same
`projectionFrameCount` and return the same footage from every projection position.
