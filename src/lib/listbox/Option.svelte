<script>
import { onDestroy } from 'svelte'

import SlotEl from '../SlotEl.svelte'
import { addEvts } from '../utils/action'
import { generateId } from '../stores/createId'
export let Listbox
let el,
  active = false,
  cleanup = null

$: if (el) setup()
function setup() {
  cleanup?.()
  const unsub = Listbox.selected.subscribe((selectedEl) => (active = selectedEl == el))

  el.setAttribute('role', 'option')
  el.setAttribute('tabindex', -1)
  el.id = generateId('listbox-option')

  function handleMove() {
    if (el.ariaDisabled != null) return
    if (!active) Listbox.reset(el)
  }
  function handleLeave() {
    if (el.ariaDisabled != null) return
    if (active) Listbox.reset()
  }
  const rmvEvts = addEvts(el, {
    focus() {
      // Honestly not too sure if this can even be focused by Listbox when disabled, but it's in the reference code so here we go.
      if (el.ariaDisabled != null) return Listbox.reset()
      Listbox.reset(el)
    },
    click(e) {
      if (el.ariaDisabled != null) return e.preventDefault()
      Listbox.close()
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
$: if (active && el) {
  el.scrollIntoView({ block: 'nearest' })
  el.ariaSelected = true
} else if (el?.ariaSelected != null) el.ariaSelected = null
onDestroy(() => cleanup?.())
</script>

<SlotEl bind:el>
  <slot {active} />
</SlotEl>
