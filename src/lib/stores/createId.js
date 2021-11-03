import { writable } from 'svelte/store'

let id = 0
export const generateId = (name) => `sashui-${name}-${++id}`

export function createId(init) {
  const { set, subscribe, update } = writable(init)

  const idSub = (el, attr) => subscribe((uiId) => (uiId ? el.setAttribute(attr, uiId) : el.removeAttribute(attr)))
  return Object.assign(idSub, {
    /** resets state if falsey/no value passed in */
    set(el, name) {
      const uiId = name ? generateId(name) : name
      if (el) el.id = uiId
      set(uiId)
    },
    update,
    subscribe,
  })
}
