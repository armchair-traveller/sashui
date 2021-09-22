/**
 * Util for adding / removing multiple evts at once to an element
 * @param {HTMLElement} el
 * @param {object} evts - kv pairs of `evtType: handler`
 * @returns {function} cleanup function - removes all event listeners when called
 */
function addEvts(el, evts) {
  evts = Object.entries(evts)
  for (const [type, handler] of evts) el.addEventListener(type, handler)

  return function rmEvts() {
    for (const [type, handler] of evts) el.removeEventListener(type, handler)
  }
}
