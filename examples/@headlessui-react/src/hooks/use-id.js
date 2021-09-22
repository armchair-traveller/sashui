import { onMount } from 'svelte'
import { derived, get, writable } from 'svelte/store'
import { useServerHandoffComplete } from './use-server-handoff-complete'

// We used a "simple" approach first which worked for SSR and rehydration on the client. However we
// didn't take care of the Suspense case. To fix this we used the approach the @reach-ui/auto-id
// uses.
//
// Credits: https://github.com/reach/reach-ui/blob/develop/packages/auto-id/src/index.tsx

let id = 0
function generateId() {
  return ++id
}

export function useId() {
  let ready = get(useServerHandoffComplete())
  const sId = writable(ready ? generateId() : null)
  onMount(() => {
    if (get(sId) === null) sId.set(generateId())
  })

  return derived(sId, (id) => (id != null ? '' + id : undefined))
}
