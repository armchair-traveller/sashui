export function useDescriptions() {
  // * because svelte context doesn't specifically wrap, it just uses a key, we don't have a wrapper component
  // * just use this in whatever component you want as provider
  // * from my perspective, each only has one provider, and won't really conflict with each other, so it
  // * should be fine to use Svelte's context
  let sDescriptionIds = writable([])
  return [
    // Store: The actual id's as string or undefined.
    derived(sDescriptionIds, (descriptionIds) =>
      descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined
    ),
    // The provider component
    function setDescriptionContext() {
      let register = (value) => {
        sDescriptionIds.update((existing) => [...existing, value])
        return () =>
          sDescriptionIds.update((existing) => {
            let clone = existing.slice()
            let idx = clone.indexOf(value)
            if (idx !== -1) clone.splice(idx, 1)
            return clone
          })
      }
      // * this provider sets the context value to the register func
      setContext('description', register)
    },
  ]
}

import _Description from './Description.svelte'
export const Description = _Description
