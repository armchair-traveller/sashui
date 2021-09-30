/**
 * @param {HTMLElement} rootEl The parent el acting as root
 * @param {function} filter el filter cb, which gets called w/ element to filter
 * 
 * Usage example:
 * ```js
elWalker(menuEl, (el) => el.getAttribute('role') == 'menuitem' && !el.disabled)
 * ```
 */
export function elWalker(rootEl, filter) {
  return document.createTreeWalker(
    rootEl,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (el) => (filter(el) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
    },
    false
  )
}
