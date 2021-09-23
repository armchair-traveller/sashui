<script>
import { getContext, onMount } from 'svelte'
import { useId } from '../../hooks/use-id'

let register = useDescriptionContext()
$: id = `headlessui-description-${$useId}`
onMount(() => register(id))

function useDescriptionContext() {
  let context = getContext('description')
  if (context === null) {
    let err = new Error(
      'You used a <Description /> component, but it is not inside a relevant parent.'
    )
    if (Error.captureStackTrace)
      Error.captureStackTrace(err, useDescriptionContext)
    throw err
  }
  return context
}
</script>

<!-- * Even though we're forwarding props, we're not forwarding any events. Add as needed -->
<p {...$$restProps} {id}>
  <slot />
</p>
