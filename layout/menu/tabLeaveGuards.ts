export function createTabLeaveGuards() {
  const guards = new Map<string, Set<() => Promise<boolean>>>();
  let pending = false;
  return {
    keys: () => [...guards.keys()],
    register(key: string, guard: () => Promise<boolean>) {
      const entries = guards.get(key) ?? new Set();
      entries.add(guard);
      guards.set(key, entries);
      return () => {
        entries.delete(guard);
        if (!entries.size) guards.delete(key);
      };
    },
    async run(keys: string[], action: () => void) {
      if (pending) return false;
      pending = true;
      try {
        for (const key of new Set(keys)) {
          for (const guard of guards.get(key) ?? []) {
            if (!await guard()) return false;
          }
        }
        action();
        return true;
      } finally {
        pending = false;
      }
    },
  };
}
