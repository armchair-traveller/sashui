import { onMount } from 'svelte'
import { writable } from 'svelte/store'

/**
 * * it's likely whatever is calling this can be replaced with afterUpdate, as that only happens after initial render
 * and onMount only happens for the initial render.
 * if you ever need reactive onMount or lifecycle funcs, use reactive blocks/declaration ($:)
 */
export function useIsInitialRender() {
  const initial = writable(true)

  onMount(() => {
    initial.set(false)
  })

  return initial
}
