import { onMount } from 'svelte'
import { writable } from 'svelte/store'

const serverHandoffComplete = writable(false)

export function useServerHandoffComplete() {
  onMount(() => {
    serverHandoffComplete.set(true)
  })
  return serverHandoffComplete
}
