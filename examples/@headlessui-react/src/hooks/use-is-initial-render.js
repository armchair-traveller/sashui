import { onMount } from 'svelte'

/**
 * * it's likely whatever is calling this can be replaced with afterUpdate, as that only happens after initial render
 * and onMount only happens for the initial render.
 * if you ever need reactive onMount or lifecycle funcs, use reactive blocks/declaration ($:)
 */
export function useIsInitialRender() {
  let initial = true

  onMount(() => {
    initial = false
  })

  return initial
}
