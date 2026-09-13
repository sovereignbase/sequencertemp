export function merge(data: unknown) {
  if (Array.isArray(snapshot))
    for (const chunk of snapshot) {
      const [header, body] = chunk
      const [
        type,
        depencyPrefix,
        initialLength,
        offsetLength,
        actorX,
        timeX,
        actorY,
        timeY,
      ] = header

      const actorXTable: Map<number, Strip<T>> = this.containmentTable.get(
        actorX
      ) ?? new Map()
      if (actorXTable.size === 0)
        void this.containmentTable.set(actorX, actorXTable)

      const actorYTable: Map<number, Strip<T>> = this.containmentTable.get(
        actorY
      ) ?? new Map()
      if (actorYTable.size === 0)
        void this.containmentTable.set(actorX, actorYTable)

      const containingStrip: Strip<T> | undefined = actorXTable.get(timeX)
    }
}
