import { onMount } from 'svelte'

export function useIsInitialRender() {
  let initial = true

  onMount(() => {
    initial = false
  })

  return initial
}
