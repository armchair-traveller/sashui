<script>
import { setContext } from 'svelte'
import { writable } from 'svelte/store'
import { useDescriptions } from '../description'
import { useLabels, Label } from '../label'

useDescriptions
let sSwitchEl = writable(null)
const [labelledby, LabelContext] = useLabels()
const [describedby, DescriptionContext] = useDescriptions()

const context = {
  sSwitchEl,
  labelledby,
  describedby,
}
setContext('group', context)
</script>

<Label
  on:click={() => {
    if (!$sSwitchEl) return
    $sSwitchEl.click()
    $sSwitchEl.focus({ preventScroll: true })
  }}
>
  <slot />
</Label>
