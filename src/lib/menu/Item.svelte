<script>
import { onDestroy } from 'svelte'

import SlotEl from '../SlotEl.svelte'
import { addEvts } from '../utils/action'
import { generateId } from '../utils/generateId'
let el,
  active = false,
  cleanup = null,
  id = generateId()
$: if (el) setup()
function setup() {
  cleanup?.()
  // get element "context" (we just attach props to the menu el)
  const menuEl = el.closest('[role=menu]')
  if (!menuEl) throw new Error('Missing parent menu element.')

  const unsub = menuEl?.selected.subscribe((selectedEl) => (active = selectedEl == el))

  el.setAttribute('role', 'menuitem')
  el.setAttribute('tabindex', -1)
  el.id = `sashui-menuitem-${id}`

  function handleMove() {
    if (!active) menuEl.items.reset(el)
  }
  function handleLeave() {
    if (active) menuEl.items.reset()
  }
  const rmvEvts = addEvts(el, {
    focus() {
      menuEl.items.reset(el)
    },
    click() {
      menuEl.items.closeMenu()
    },
    pointermove: handleMove,
    mousemove: handleMove,
    pointerleave: handleLeave,
    mouseleave: handleLeave,
  })

  cleanup = () => {
    unsub?.()
    rmvEvts()
  }
}
$: active && el?.scrollIntoView?.({ block: 'nearest' })
onDestroy(() => cleanup?.())
</script>

<SlotEl bind:el>
  <slot {active} />
</SlotEl>
