import { derived, writable } from 'svelte/store'

const openCount = writable(0)
/** This derived store keeps track of currently active Sash component as a boolean. By using provided API, Sash
 * components can determine whether they're the active component or not, which is important for nesting.
 * e.g. deciding whether certain events should be triggered if the specific component is not active.
 * On subscribe, adds to count, thus should only be subscribed once per sash component. On unsubscribe, decrements count.
 */
export function activeSash() {
  var curSashNum
  openCount.update((count) => (curSashNum = ++count))
  return {
    subscribe: (cb) =>
      derived(openCount, (count) => count == curSashNum).subscribe(cb, () => openCount.update((count) => --count)),
  }
}
