import { derived, writable } from 'svelte/store'

const openCount = writable(0)
/** This derived store keeps count of currently opened sash components. By using provided API, sash components can determine whether
 * they're the active component or not, which is important for deciding whether certain events should be triggered if
 * the specific component is not active.
 * On subscribe, adds to count, thus should only be subscribed once per sash component. On unsubscribe, decrements count.
 */
export function openSash() {
  var activeNum
  openCount.update((count) => (activeNum = ++count))
  return {
    subscribe: (cb) =>
      derived(openCount, (count) => count == activeNum).subscribe(cb, () => openCount.update((count) => --count)),
  }
}
