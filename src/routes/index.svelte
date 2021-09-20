<script>
  let Menu,
    items = [],
    open
</script>

<!-- Alternative API
You can also just select the first child el using el.firstChild, but it does entail an extra div per item...
This current API already offers total control over all elements, by explicitly entering the actual element.  -->

<!-- Example Menu API 
  The goal is to streamline it as much as possible, making a short, concise syntax.
* While actions have no ability to SSR, it doesn't really matter for the user, more for SEO. If there's enough demand
  an approach of having something like {...ssrProps()} which returns props during compile/server side, empty on the
  client.
  Note: This is a bit tedious, but it's a limitation. Also, in terms of SSR, event handlers are irrelevant.
-->

<!-- Menu gives list, isActive funcs. Contains the store sharing state to funcs:
  * item: action to setup list item props/handlers
  * btn: action to setup button props/handlers
  * isActive: check id if currently active, returns boolean
-->
<Menu let:shui={{ item, isActive, btn }} bind:open>
  <button use:btn />
  <!-- JS allows the isActive id default assignment to accept anything used on the same line, which in this case
  can be i, href, name. The con of this destructuring trick is sharing the namespace of the array's objs. However since
  it's just a func, the trick can be altered based on what the consumer wants, and they can even simply use isActive
  on the children itself.
  Note: destructuring slot props only allow objs, no arrs. -->
  {#each items as { href, name, active = isActive(i) }, i}
    <a class="text-blue-200 {active && 'bg-blue-500'}" use:item={i} {href}
      >{name}</a
    >
  {/each}
</Menu>
