// ? This was created to deal with nested modals, however a nested modal is a UX antipattern.
// ? Current implementation of modals will not include nesting support (though I'm sure it'd still be possible for a consumer to do it, albeit with some difficulty)
import { derived, writable } from 'svelte/store'

const openCount = writable(0)
/** This derived store keeps track of currently active Sash component as a boolean. By using provided API, Sash
 * components can determine whether they're the active (most recent) component or not, which is important for nesting.
 * e.g. guarding certain events if the current component is not in the forefront.
 * On subscribe, adds to count, thus should only be subscribed once per sash component. On unsubscribe, decrements count.
 */
export const frontmost = {
  subscribe(cb) {
    var curN
    openCount.update((count) => (curN = ++count))
    const unsub = derived(openCount, (count) => count == curN).subscribe(cb)
    return function unsubscriber() {
      unsub()
      openCount.update((count) => (curN = --count))
    }
  },
}
