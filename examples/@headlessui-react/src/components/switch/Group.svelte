<script>
import { setContext } from 'svelte'
import { writable } from 'svelte/store'
import { useDescriptions } from '../description'
import { useLabels, Label } from '../label'

let switchEl = writable(null)
const [labelledby, LabelContext] = useLabels()
const [describedby, DescriptionContext] = useDescriptions()

const context = {
  switchEl,
  labelledby,
  describedby,
}
setContext('group', context)
</script>

<Label
  on:click={() => {
    if (!$switchEl) return
    $switchEl.click()
    $switchEl.focus({ preventScroll: true })
  }}
>
  <slot />
</Label>
