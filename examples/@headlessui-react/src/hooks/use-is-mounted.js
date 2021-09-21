import { writable } from 'svelte/store'
import { onMount } from 'svelte'

export function useIsMounted() {
  let mounted = writable(false)

  onMount(() => {
    mounted.set(true)
    return () => {
      mounted.set(false)
    }
  })

  return mounted
}
