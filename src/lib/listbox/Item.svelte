<script>
import { onDestroy } from 'svelte'

import SlotEl from '../SlotEl.svelte'
import { addEvts } from '../utils/action'
import { generateId } from '../stores/createId'
export let Listbox
// TODO export let disabled = null
let el,
  active = false,
  cleanup = null

$: if (el) setup()
function setup() {
  cleanup?.()
  // TODO obtain selected store
  const unsub = Listbox.selected.subscribe((selectedEl) => (active = selectedEl == el))

  // TODO implement aria-disabled + event guards, also make it an option in menu
  // TODO aria-selected
  el.setAttribute('role', 'option')
  el.setAttribute('tabindex', -1)
  el.id = generateId('listbox-option')

  function handleMove() {
    if (!active) Listbox.reset(el)
  }
  function handleLeave() {
    if (active) Listbox.reset()
  }
  const rmvEvts = addEvts(el, {
    focus() {
      Listbox.reset(el)
    },
    click() {
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
$: active && el?.scrollIntoView?.({ block: 'nearest' })
onDestroy(() => cleanup?.())
</script>

<SlotEl bind:el>
  <slot {active} />
</SlotEl>
