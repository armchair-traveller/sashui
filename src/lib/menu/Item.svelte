<script>
import { onDestroy } from 'svelte'

import SlotEl from '../SlotEl.svelte'
import { addEvts } from '../utils/action'
import { generateId } from '../stores/createId'
/** INTERNAL: DO NOT USE. Not intended for consumer. */
export let _Menu = undefined
let el,
  active = false,
  cleanup = null
$: if (el) setup()
function setup() {
  cleanup?.()
  const unsub = _Menu.selected.subscribe((selectedEl) => (active = selectedEl == el))

  el.setAttribute('role', 'menuitem')
  el.setAttribute('tabindex', -1)
  el.id = generateId('menuitem')

  function handleMove() {
    if (!active) _Menu.reset(el)
  }
  function handleLeave() {
    if (active) _Menu.reset()
  }
  const rmvEvts = addEvts(el, {
    focus() {
      _Menu.reset(el)
    },
    click() {
      _Menu.close()
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
