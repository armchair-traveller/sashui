import { onMount } from 'svelte'
import { get, writable } from 'svelte/store'

const serverHandoffComplete = writable(false)

export function useServerHandoffComplete() {
  onMount(() => {
    if (get(serverHandoffComplete)) return
    serverHandoffComplete.set(true)
  })
  return serverHandoffComplete
}
