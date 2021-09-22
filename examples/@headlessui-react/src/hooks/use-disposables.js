import { onMount } from 'svelte'
import { writable } from 'svelte/store'

import { disposables } from '../utils/disposables'

export function useDisposables() {
  // Using useState instead of useRef so that we can use the initializer function.
  // ? this was using useState before
  // ? my only concern is that it's just functions on RAF so I don't think it should need reactivity...
  /** this is actually something common in this repo, needless use of useState.
   * TODO: Anytime you see use- in the file name, it is likely making wasteful use of useState. Keep this in mind if
   * there's unintended behavior you can check these files later in the backup.
   */
  const d = writable(disposables())
  onMount(() => () => get(d).dispose())
  return d
}
