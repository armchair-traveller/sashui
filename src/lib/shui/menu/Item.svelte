<script>
  export let id,
    disabled = false,
    active = false;
</script>

<!-- NOTE: a single element can have multiple event handlers, so you can forward event handlers while attaching component
specific that don't expose the details to a consumer -->
<div on:click {id} role="menuitem" aria-disabled={disabled} tabindex="-1" />

<slot
  attr={{ id, role: "menuitem", "aria-disabled": disabled, tabindex: "-1" }}
/>
