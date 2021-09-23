<script>
import { getContext, onMount } from 'svelte'
import { useId } from '../../hooks/use-id'

let register = useLabelContext()
$: id = `headlessui-label-${$useId}`
onMount(() => register(id))

function useLabelContext() {
  let context = getContext('label')
  if (context === undefined) {
    let err = new Error(
      'You used a <Label /> component, but it is not inside a relevant parent.'
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useLabelContext)
    throw err
  }
  return context
}
</script>

<!-- * Even though we're forwarding props, we're not forwarding any events. Add as needed -->
<label {...$$restProps} {id}>
  <slot />
</label>
