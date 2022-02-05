<script>
import { useListbox } from '$lib/listbox'

const Listbox = useListbox()
</script>

<button use:Listbox.button> open </button>

{#if $Listbox}
  <!-- can enable horizontal mode by adding attribute `aria-orientation="horizontal"` -->
  <ul use:Listbox>
    <Listbox.Option let:active>
      <li class:text-blue-400={active} aria-disabled>Durward Reynolds</li>
    </Listbox.Option>
    <Listbox.Option let:active>
      <li class:text-blue-400={active}>Moo Cow</li>
    </Listbox.Option>
  </ul>
{/if}
