<script>
  export let id,
    disabled = false,
    active = false;
</script>

<div {id} role="menuitem" aria-disabled={disabled} tabindex="-1" />

<slot
  attr={{ id, role: "menuitem", "aria-disabled": disabled, tabindex: "-1" }}
/>
