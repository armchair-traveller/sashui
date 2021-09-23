import { onMount } from 'svelte'
import { writable } from 'svelte/store'

/**
 * * I haven't a clue the purpose of this func since it just returns the cb as a reactive variable.
 */
export function useComputed(cb, dependencies) {
  const value = writable(cb)

  onMount(() => value.set(cb))
  return value
}
