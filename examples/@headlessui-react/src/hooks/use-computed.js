import { onMount } from 'svelte'
import { writable } from 'svelte/store'

export function useComputed(cb, dependencies) {
  const value = writable(cb)

  onMount(() => value.set(cb))
  return value
}
