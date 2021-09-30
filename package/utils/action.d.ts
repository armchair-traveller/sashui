/**
 * Util for adding / removing multiple evts at once to an element
 * @param {HTMLElement} el
 * @param {object} evts - kv pairs of `evtType: handler`
 * @returns {function} cleanup function - removes all event listeners when called
 */
export function addEvts(el: HTMLElement, evts: object): Function;
