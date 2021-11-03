// This file is for utils specific to actions, like reducing commonly used DOM code.

/**
 * Util for adding / removing multiple evts at once to an element
 * @param {HTMLElement} el
 * @param {object} evts - kv pairs of `evtType: handler`
 * @returns {function} cleanup function - removes all event listeners when called
 */
export function addEvts(el, evts) {
  evts = Object.entries(evts) // ? should we comply to a mutable evts obj? If so, get entries on every for loop.
  for (const [type, handler] of evts) el.addEventListener(type, handler)

  return function rmEvts() {
    for (const [type, handler] of evts) el.removeEventListener(type, handler)
  }
}
