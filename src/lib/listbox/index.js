import Option from '$lib/listbox/Option.svelte'
import { createId } from '$lib/stores/createId'
import { addEvts } from '$lib/utils/action'
import { tick } from 'svelte'
import { writable } from 'svelte/store'

export function useListbox(initOpen = false) {
  let isMounted = initOpen,
    buttonEl,
    listboxEl
  const orientation = writable(),
    selected = writable(),
    buttonId = createId(),
    listboxId = createId()

  return Object.assign(Listbox, {
    ...writable(isMounted),
    selected,
    /** default tag: `<button>`
     * other viable tags: input,a
     */
    button(node) {
      buttonEl = node
      buttonEl.ariaHasPopup = true
      buttonId.set(buttonEl, 'listboxbutton')
      // ! unnecessary ?TODO aria-labelledby id of label el
      const ListboxUnsub = Listbox.subscribe((isOpen) => (buttonEl.ariaExpanded = isOpen)),
        listboxIdUnsub = listboxId(buttonEl, 'aria-controls')
      const cleanup = addEvts(buttonEl, {
        click(e) {
          if (isMounted) close()
          else {
            e.preventDefault()
            e.stopPropagation()
            open()
          }
        },
        async keydown(e) {
          switch (e.key) {
            // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13
            case ' ':
            case 'Enter':
            case 'ArrowDown':
              await openTick()
              Listbox.gotoItem?.()
              break
            case 'ArrowUp':
              await openTick()
              Listbox.gotoItem?.(-1)
              break
          }
          function openTick() {
            e.preventDefault()
            e.stopPropagation()
            return open()
          }
        },
        keyup(e) {
          // Required for firefox, event.preventDefault() in handleKeyDown for the Space key doesn't cancel the handleKeyUp,
          // which in turn triggers a *click*.
          e.key == ' ' && e.preventDefault()
        },
      })

      return {
        destroy() {
          cleanup()
          listboxIdUnsub()
          ListboxUnsub()
          buttonId.set(null)
        },
      }
    },
    // ! Seems like label is unnecessary.
    // ?TODO skipping this unless it's needed, remove later if not label(){}
    /** A renderless component for an option. default child: `<li>`. Exposes an active slot prop for whether the current item is active. */
    Option:
      typeof window == 'undefined'
        ? Option // prevent SSR from tripping
        : class ListboxOption extends Option {
            constructor(options) {
              options.props = options.props || {}
              options.props.Listbox = Listbox // pass in Listbox action store to component
              super(options)
            }
          },
  })
  /** default tag: `<ul>` */
  function Listbox(node, { autofocus = true } = {}) {
    listboxEl = node // AKA container
    isMounted = true
    // Attach helpers to Listbox, which is on listbox el as if it's a context, used for programmatic purposes e.g. `Item.svelte` & button handlers, consumer API
    // These helpers are always available once set, but should only be run if the listbox element is on the DOM! (They don't do any checks)
    listboxEl.Listbox = Object.assign(Listbox, { reset, gotoItem, nextItem, prevItem, search })
    // ?TODO sashuiui-listbox-options-id
    // ? labelledby is either by the label, or if doesn't exist, then the button

    const itemsWalker = elWalker(listboxEl, (el) => el.getAttribute('role') == 'option' && !el.ariaDisabled)

    // aria-activedescendant = selected.id
    // aria-orientation =
    listboxEl.setAttribute('role', 'listbox')
    listboxEl.setAttribute('tabindex', 0)
    autofocus && listboxEl.focus()
    addEvts({
      // TODO search, extract from menu and maybe refactor to make reusable
      keydown(e) {
        // escape: if buttonEl available, try to focus after tick w/ preventScroll
      },
    })
    return {
      destroy() {},
    }

    /** Search by str, clears timeout but doesn't set it on invoke.
     * @param {number} timeout - if not set, won't clear timeout. Resets timeout if invoked again before clear
     */
    function search(char = '', timeout = null) {
      clearTimeout(cancelClearSearch)
      searchQuery += char.toLowerCase()
      const matchedEl = Array.prototype.find.call(listboxEl.querySelectorAll('[role=option]:not([disabled])'), (el) =>
        el.textContent.trim().toLowerCase().startsWith(searchQuery)
      )
      if (matchedEl) reset(matchedEl)
      if (typeof timeout == 'number') cancelClearSearch = setTimeout(() => (searchQuery = ''), timeout)
    }

    function nextItem() {
      return reset(itemsWalker.next())
    }
    function prevItem() {
      return reset(itemsWalker.prev())
    }

    // ==== Helpers attached to the listboxEl
    /** resets currently selected option, or sets it to the el passed in */
    function reset(curEl = null) {
      selected.set(curEl)
      return (itemsWalker.currentNode = curEl || listboxEl)
    }
    /** @param idx default first item, accepts negative indexing. */
    function gotoItem(idx = 0) {
      if (idx < 0) {
        // negative idx, start from last item
        itemsWalker.last()
        while (idx < -1) {
          idx++
          itemsWalker.prev()
        }
      } else {
        itemsWalker.first()
        while (idx > 0) {
          idx--
          itemsWalker.next()
        }
      }
      return reset(itemsWalker.currentNode)
    }
  }
  /** helpers */
  async function open() {
    Listbox.set(true)
    await tick()
    listboxEl?.focus({ preventScroll: true })
  }
  async function close() {
    Listbox.set(false)
    await tick()
    buttonEl?.focus({ preventScroll: true })
  }
}
