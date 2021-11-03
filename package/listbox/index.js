import Item from '../menu/Item.svelte'
import { addEvts } from '../utils/action'
import { tick } from 'svelte'
import { writable } from 'svelte/store'

export function useListbox(initOpen = false) {
  let isOpen = initOpen,
    buttonEl,
    listboxEl
  const orientation = writable(),
    selected = writable()

  return Object.assign(Listbox, {
    ...writable(isOpen),
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
          if (isOpen) {
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
    /** default tag: `<li>` */
    option(node) {
      // TODO id 'listbox-option'
      // TODO selected store
      return { destroy() {} }
    },
    /** A renderless component for a menu item. Generally, it should be wrapped around a button. Exposes an active slot prop for whether the current item is active. */
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
    // ?TODO sashuiui-listbox-options-id
    // ? labelledby is either by the label, or if doesn't exist, then the button

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
  }
  /** helpers */
  async function open() {}
  async function close() {}
}
