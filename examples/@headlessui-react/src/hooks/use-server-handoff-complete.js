import { onMount } from 'svelte'
import { get, writable } from 'svelte/store'

const serverHandoffComplete = writable(false)
export const useServerHandoffComplete = {
  subscribe(subCb) {
    onMount(() => {
      if (get(serverHandoffComplete)) return
      serverHandoffComplete.set(true)
    })
    return serverHandoffComplete.subscribe(subCb)
  },
}
