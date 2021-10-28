let interactables = new Set()
let originals = new Map()
function inert(element) {
  element.setAttribute('aria-hidden', 'true')
  // @ts-expect-error `inert` does not exist on HTMLElement (yet!)
  element.inert = true
}
function restore(element) {
  let original = originals.get(element)
  if (!original) return
  if (original['aria-hidden'] === null) element.removeAttribute('aria-hidden')
  else element.setAttribute('aria-hidden', original['aria-hidden'])
  // @ts-expect-error `inert` does not exist on HTMLElement (yet!)
  element.inert = original.inert
}
/** Sets all direct body children to `aria-hidden=true` besides the one passed in, which is necessary for modals. */
export function inertOthers(element) {
  // Mark myself as an interactable element
  interactables.add(element)
  // Restore elements that now contain an interactable child
  for (let original of originals.keys()) {
    if (original.contains(element)) {
      restore(original)
      originals.delete(original)
    }
  }
  // Collect direct children of the body
  document.querySelectorAll('body > *').forEach((child) => {
    if (!(child instanceof HTMLElement)) return // Skip non-HTMLElements
    // Skip the interactables, and the parents of the interactables
    for (let interactable of interactables) {
      if (child.contains(interactable)) return
    }
    // Keep track of the elements
    if (interactables.size === 1) {
      originals.set(child, {
        'aria-hidden': child.getAttribute('aria-hidden'),
        // @ts-expect-error `inert` does not exist on HTMLElement (yet!)
        inert: child.inert,
      })
      // Mutate the element
      inert(child)
    }
  })

  /** cleanup. Should be run in action destroy */
  return () => {
    // Inert is disabled on the current element
    interactables.delete(element)
    // We still have interactable elements, therefore this one and its parent
    // will become inert as well.
    if (interactables.size > 0) {
      // Collect direct children of the body
      document.querySelectorAll('body > *').forEach((child) => {
        if (!(child instanceof HTMLElement)) return // Skip non-HTMLElements
        // Skip already inert parents
        if (originals.has(child)) return
        // Skip the interactables, and the parents of the interactables
        for (let interactable of interactables) {
          if (child.contains(interactable)) return
        }
        originals.set(child, {
          'aria-hidden': child.getAttribute('aria-hidden'),
          // @ts-expect-error `inert` does not exist on HTMLElement (yet!)
          inert: child.inert,
        })
        // Mutate the element
        inert(child)
      })
    } else {
      for (let element of originals.keys()) {
        // Restore
        restore(element)
        // Cleanup
        originals.delete(element)
      }
    }
  }
}
