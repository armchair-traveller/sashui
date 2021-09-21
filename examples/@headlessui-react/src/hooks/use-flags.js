import { writable } from 'svelte/store'

export function useFlags(initialFlags = 0) {
  const sFlags = writable(initialFlags)
  const { update } = sFlags
  return {
    ...sFlags,
    addFlag: (flag) => update((flags) => flags | flag),
    hasFlag: (flag) => Boolean(get(sFlags) & flag),
    removeFlag: (flag) => update((flags) => flags & ~flag),
    toggleFlag: (flag) => update((flags) => flags ^ flag),
  }
}
