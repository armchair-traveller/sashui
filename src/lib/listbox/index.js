import Item from '$lib/listbox/Item.svelte'
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
      // ?TODO id
      // ! unnecessary ?TODO aria-labelledby id of label el
      // TODO
      // ;({
      //   'aria-haspopup': true,
      //   'aria-controls': (_a = state.optionsRef.current) === null || _a === void 0 ? void 0 : _a.id,
      //   'aria-expanded': state.disabled ? undefined : state.listboxState === ListboxStates.Open,
      // })
      const rmvEvts = addEvts({
        async keydown(e) {
          switch (e.key) {
            // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13
            case 'Space':
            case 'Enter':
            case 'ArrowDown':
              e.preventDefault()
              open()
              await tick()
              // TODO
              d.nextFrame(() => {
                if (!state.propsRef.current.value) dispatch({ type: ActionTypes.GoToOption, focus: Focus.First })
              })
              break
            case 'ArrowUp':
              e.preventDefault()
              open()
              await tick()
              // TODO
              d.nextFrame(() => {
                if (!state.propsRef.current.value) dispatch({ type: ActionTypes.GoToOption, focus: Focus.Last })
              })
              break
          }
        },
        keyup(e) {
          switch (e.key) {
            case Keys.Space:
              // Required for firefox, e.preventDefault() in handleKeyDown for
              // the Space key doesn't cancel the handleKeyUp, which in turn
              // triggers a *click*.
              e.preventDefault()
              break
          }
        },
        click(e) {
          // we don't attach event handlers to [disabled] anyway, because they're filtered by tree walker if (isDisabledReactIssue7711(event.currentTarget)) return event.preventDefault()
          if (isMounted) {
            close()
            // TODO
            d.nextFrame(() => {
              var _a
              return (_a = state.buttonRef.current) === null || _a === void 0
                ? void 0
                : _a.focus({ preventScroll: true })
            })
          } else {
            e.preventDefault()
            open()
          }
        },
      })
      return {
        destroy() {
          rmvEvts()
        },
      }
    },
    // ! Seems like label is unnecessary.
    // ?TODO skipping this unless it's needed, remove later if not label(){}
    /** A renderless component for a menu item. default child: `<li>`. Exposes an active slot prop for whether the current item is active. */
    Item:
      typeof window == 'undefined'
        ? Item // prevent SSR from tripping
        : class MenuItem extends Item {
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
    // Attach helpers to Menu, which is on menu el as if it's a context, used for programmatic purposes e.g. `Item.svelte` & button handlers, consumer API
    // These helpers are always available once set, but should only be run if the menu element is on the DOM! (They don't do any checks)
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
    /** resets currently selected menuitem, or sets it to the el passed in */
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
