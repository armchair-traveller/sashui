import { setContext } from 'svelte'
import { derived, writable } from 'svelte/store'
export function useLabels() {
  // * because svelte context doesn't specifically wrap, it just uses a key, we don't have a wrapper component
  // * just use this in whatever component you want as label provider
  // * from my perspective, each label only has one provider, and won't really conflict with each other, so it
  // * should be fine to use Svelte's context
  let sLabelIds = writable([])
  return [
    // Store; The actual id's as string or undefined.
    derived(sLabelIds, (labelIds) =>
      labelIds.length > 0 ? labelIds.join(' ') : undefined
    ),
    // The provider component
    function setLabelContext() {
      let register = (value) => {
        sLabelIds.update((existing) => [...existing, value])
        return () =>
          sLabelIds.update((existing) => {
            let clone = existing.slice()
            let idx = clone.indexOf(value)
            if (idx !== -1) clone.splice(idx, 1)
            return clone
          })
      }
      // * this provider sets the context value to the register func
      setContext('label', register)
    },
  ]
}

import _Label from './Label.svelte'
export const Label = _Label
