# Sash UI

<a href="https://www.npmjs.com/package/sashui" alt="package version">
<img src="https://img.shields.io/npm/v/sashui?color=%23ff3e00&label=version&style=for-the-badge"/>
</a>

Short for **S**velte **A**ction **S**tores & **H**eadless **UI**.

**Installation**: simply run `npm i -D sashui`

[Play with the API in an online IDE](https://stackblitz.com/edit/sashui)

If you're looking a component library closer to headless UI (not action based, a little bit more verbose), see https://github.com/rgossiaux/svelte-headlessui . Any work on sashui is currently done for personal deployments. While it exposes many powerful internal APIs, isn't SSR'd (though it doesn't matter given all accessible interactivity needs JS as they're not using native HTML interactivity). Using actions is a large departure from Headless and therefore uses up more time to decode requirements for components. Expect it to contain few components until adapting components from libraries like Radix. 

## Status

✔ Menu  
✔ Switch (A toggle isn't a switch! These use checked aria attributes instead of pressed.)  
✔ Toggle  
✔ Dialog (Modal)

- Listbox (Select) - Working on it right this moment!

### 🛣 Roadmap

- Popover (seems like a simple `<nav>` link menu?)
- Radio Group (low priority in favor of `<input type="radio">`s)
- Disclosure (low priority in favor of `<summary>`)
- Possibly use inspiration for more components in libs like Radix UI and Chakra UI, just checking behavior & attributes (excluding data prop), ignoring code

## Why?

Headless UI is a spin on the concept of renderless components and if you're not in the know:

> A renderless component is a component that doesn't render any of its own HTML.  
> Instead it **only manages state and behavior**, exposing a single scoped slot that gives the parent/consumer complete control over what should actually be rendered.
> [source](https://adamwathan.me/renderless-components-in-vuejs/)

They're used to inject logic into HTML we're used to working with.

Now this sounds familiar to a feature we're used to in Svelte... an action is defined as:

> A function that is called when an element is created, taking the element and optional parameters as arguments.

And you can do all sorts of things with actions. It's a simple concept that can allow you to do the same thing managing state and behaviors with elements, and in my humble opinion is a better step forward towards the main goals of renderless components. Since it's just a function performed on an element, you can coordinate all sorts of crazy things and create interop with your own state. And speaking of state, we have a simple solution: stores.

So that's what this library is about. A Headless UI port for Svelte, using **actions and stores**. Sometimes it uses components for their slot props, especially when it doesn't make sense to manually manage each piece of state in a list, but most of the time all it is actions and stores (oh and of course a whoooole lotta vanilla JS DOM manipulation).

p.s. While actions are, in my opinion, a better solution for the consumer of the API... people may be wondering if it's even a departure from how Headless UI components work. It's mostly because of the degree of control over the render logic that Headless has in its implementation, which has no easy equivalent in Svelte. With actions and stores, the render logic doesn't really have to be considered as the consumer gets to build with good ol' elements. For the maintainer, it's a lot of verbose vanilla DOM code to write, but hey the consumer gets to keep all the element directives, power, and conveniences Svelte offers.

<details> <summary>Notes</summary>
This is a Svelte project adapting Headless-UI's (React) functionality to Svelte. Its end goal is just to have the functionality and accessibility of Headless-UI as a few components with predefined unstyled elements.

There was goal of a demo form, mostly serving as examples of accessible components for reference, rather than as a library... however it turns out that an actual implementation was a more attractive proposition. I had a repo called IncluSvelte that was aiming to be a demo, but since headless-ui is more clearly defined I opted for this library.

**Current status**: Most abstractions are perfectly working, save for SSR. Well... don't quote me on that as there're no tests in code, only manual tests (however I did iron out some logic that could cause issues). There're a few differences that're made intentionally by design, sometimes for UX reasons, but mainly to fit the usecase of "enhancing" elements with interactivity, rather than straight up giving components. This way, all the power of Svelte element directives are available to the consumer.

On the topic of SSR: The optimal solution is SSR attributes for actions, as detailed in _Relevant Links_. Another possible solution is to provide to consumer attributes to spread or tell the consumer the aria attributes required. It's not a big issue since ALL of the components require JavaScript and will simply not work without. So the main element that triggers the interactivity will be the only one that needs SSR attributes, possibly only introducing an inconvenience of spreading once per component. To some extent, the server-side component API may help but I don't believe it's a valid solution.

Some additional comments... I find it pretty interesting the amount of vanilla DOM needed from a maintainer's perspective. I've even employed a hack in `SlotEl.svelte` to create a utility that gets the element reference to a slotted element without cluttering the DOM... by adding and removing an invisible `div`. That was pretty funny.

</details>

## Docs

Not too fleshed out at the moment, feel free to ask questions so that usecases can be added to the docs. Most actions/components have JSdoc examples and notes for usage. This section will only cover basic code snippets, which should be sufficient to piece together if you have basic knowledge of elements and have seen the Headless-UI React docs/snippets. Please use GitHub's table of contents navigation feature for an overview and to quickly zip to parts you need.

Transition implementation is skipped in favor of Svelte's native transitions / animations.

It's important to understand that the library's implementation is using actions to enhance the raw elements the consumer provides. It utilizes the native interaction benefits of HTML when possible, instead of masquerading or overriding them. This means **less package size and better performance**, and well... elements are the most battle tested and stable APIs a web developer can have when it comes to components. Many elements have their own specific interactions and semantic HTML purposes. This means that you should use the correct markup, usually provided in examples/docs. This is inline with how Svelte elements work -- for example you can only bind to valid attributes on any particular HTML element, and they offer different conveniences depending on the element. This library isn't an excuse to abuse and throw a bunch of divs on your page or disregard any semblance of semantic HTML, merely to provide an easy, quick entrypoint without overloading your brain with the component's implementation details. A simple docs minimal markup copy+paste is the only required work that has to be done. It's like working with normal semantic HTML, so if you're already familiar with that then you will feel at home, perhaps with little use for the docs very quickly.

That said, this library attempts to be flexible where it makes sense, and provide conveniences where/when it is possible. You aren't strictly bound to a certain element for everything, e.g. `<button>`, `<input type="submit">`, `<input type="button">` will often be sufficiently interchangeable depending on context, and sometimes custom events are dispatched on elements for consistency. (Keep in mind that it's certainly easy to JSDoc valid elements for each action/component later on which would be very convenient, if time allows work to be done on that...)

Other general implementation differences:

- Any time you see a `<Description>` component in Headless UI's docs, know that it isn't implemented here as it's simply a `aria-describedby` on the root el set to the `id` of the description element. Literally two attributes. This is left for the consumer to manage in the off chance that they need it, there's simply no need for an extra action/component to manage this. In the case that the ID is dynamically generated by Sashui, the action store will expose the necessary id for `aria-describedby` as a store via a property e.g. `const {menuId} = Menu`.
- In order to keep things simple, there's no nested anything. It's bad UX anyway but if there's a compelling reason I'm unaware of it can be done.

### Menu

**Simple Example**

```svelte
<script>
import { useMenu } from 'sashui'
const Menu = useMenu()
</script>

<button use:Menu.button>open</button>

{#if $Menu}
  <menu use:Menu>
    <Menu.Item let:active>
      <button class="{active ? 'bg-red-400' : ''} text-black">hi</button>
    </Menu.Item>
  </menu>
{/if}
```

**API**

`useMenu(initOpen?: Boolean)` initial open state. Default `false`. Returns `Menu` action store.

`use:Menu={{ autofocus?: Boolean }}` autofocus on menu open. Default `true`.

`$Menu` makes use of Svelte's auto-subscription syntax. Default `false`. You can also use it to open and close the menu programatically (e.g. `$Menu = false`), though closing events are already automatically managed by the menu.

Menu also has some programmatic helpers you can invoke (that're used internally):

- `Menu.selected`: A writable store with the current selected menuitem element. You can also set the selected menuitem programatically, which will enable `active` on it, or set it to `null` for no selection. (Note: This doesn't reset the currently selected tree walker, so it's better to use `Menu.reset()` if setting menuitem. This is more for reading current selections and reacting to them via subscription, you can progrogramatically select and `.click()` items.)
- `Menu.open()`: (async) Opens the menu and focuses it
- While menu is on the DOM (open), you can use these menu helpers (they don't make any checks for open state so you'll have to guard it yourself if needed):
  - `Menu.reset(el?: HTMLElement)` resets the selected el, or if an el is passed in changes currently selected to it.
  - `Menu.gotoItem(idx?: number)` sets current selected item to the item index passed in, accepts negative indexing. By default uses first item. Wraps if null.
  - `Menu.close()` (async) closes the menu and focuses the menu button afterwards, which is the default behavior of most events causing the menu to close.
  - `Menu.nextItem()` Select next item
  - `Menu.prevItem()` Select previous item

Note: It is possible to expose the search method if there's a use case for it! It just involves a little bit of function param/state manipulation because it currently relies on closure scopes. Open a discussion/issue if you have one in mind or have suggestions!

### Dialog (Modal)

To keep the modal accessible, the portal is managed for you. This isn't the case for any other Sash components, as creating your own portal utility (should you require it) is easily doable in Svelte.
Dialog modal state isn't managed for you. `close` events are dispatched on the element with the trigger cause in `event.detail`.

`useDialog(initOpen?: Boolean)` initial open state. Default `false`. Returns `dialog` action store.  
`$dialog` Boolean representing dialog open state. Default `false`. Set it to open/close the modal.  
`use:dialog={{ initialFocus?: HTMLElement }}` if an initial focus is set, must be a valid focusable element within the modal.

```svelte
<script>
import { useDialog } from 'sashui'
const dialog = useDialog(true)
</script>

{#if $dialog}
  <div use:dialog on:close={() => ($dialog = false)} aria-describedby="dialog-desc">
    <div use:dialog.overlay />

    <h2 use:dialog.title>Deactivate account</h2>
    <div id="dialog-desc">This will permanently deactivate your account</div>

    <p>
      Are you sure you want to deactivate your account? All of your data will be permanently removed. This action cannot
      be undone.
    </p>

    <button on:click={() => ($dialog = false)}>Deactivate</button>
    <button on:click={() => ($dialog = false)}>Cancel</button>
  </div>
{/if}
```

Note: Nested modals are not supported as mentioned, to avoid UX antipatterns. See [this article](https://uxplanet.org/removing-nested-modals-from-digital-products-6762351cf6de) for a list of alternatives (e.g. popovers, tabbed modals, etc). If it's absolutely necessary, you can get it working with some difficulty by controlling the state programatically, and it would be easier using multiple roots instead of nesting inside the modal.

### Toggle / Switch

Toggles are distinct from switches in that switches have on/off text indicators. See [MDN `<label>` docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) for label usage. Switches have similar usage, except imported as `Switch` (pascalcase due to `switch` being a reserved keyword).

```svelte
<!-- Basic usage -->
<script>
import { toggle } from 'sashui'
let pressed
</script>
<button on:change={()=>(pressed = !pressed)} use:toggle={pressed} />

<!-- For labels, use it like how you'd normally use a label. -->
<label>
  My toggle
  <button on:change={()=>(pressed = !pressed)} use:toggle={pressed} />
</label>

<!-- Alternatively -->
<label for="sueve-toggle">My toggle</label>
<button id="sueve-toggle" on:change={()=>(pressed = !pressed)} use:toggle={pressed} />
```

## Relevant Links

[Headless-UI React](https://github.com/tailwindlabs/headlessui/tree/main/packages/%40headlessui-react/src/components) - for reference and headlessui.dev for API

[renderless-svelte](https://github.com/stephane-vanraes/renderless-svelte/tree/master/src) - for reference

[`svelte:element`](https://github.com/sveltejs/svelte/pull/5481) - could provide `as`-like API.

[Spread events](https://github.com/sveltejs/svelte/issues/5112) - mentions headless/react-aria. The API for a headless implementation would be much cleaner with spreadable events. Actions have issues due to no SSR. OR...

[on:\*](https://github.com/sveltejs/svelte/issues/2837) - all event forwarding. Without these, implementing in Svelte without actions would mean you explicitly declare all events for the consumer, which will bulk up the library and make it harder to maintain, as well as requiring extra documentation.

[**SSR attributes for actions**](https://github.com/sveltejs/svelte/issues/4375) - This would allow actions to set SSR-specific attributes, making actions a very viable solution... In fact I'd argue it's better suited than components for this library's usecase. As a commenter has said:

> main focus for users of actions[...]abstractions of element logic that can be shared

... Which is basically the focus of renderless component APIs.

**Alt**

[Multiple components per file](https://github.com/sveltejs/svelte/issues/2940) - non-issue. This is just a convenience feature for the maintainer, and it's possible to just include multiple components on a component just by adding object properties w/ imports.

https://mobile.twitter.com/leander__g/status/1363100744350597123

https://mobile.twitter.com/opensas/status/1346236765380759552

Publish notes: Sp far, only entrypoint is from `./index.js`. Only dependency should be `svelte` as a `peerDependency`... Or you know, just copy paste your previous `package.json`. No shame, that's better and faster.
