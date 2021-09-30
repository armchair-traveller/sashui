# Sash UI

![package version](https://img.shields.io/npm/v/sashui?color=%23ff3e00&label=version&style=for-the-badge)

Short for **S**velte **A**ction **S**tores & **H**eadless **UI**.

**Installation**: simply run `npm i -D sashui`

## Status

✔ Menu  
✔ Toggle  
🚧 Listbox (Working on it right now!)

### 🛣 Roadmap

- Dialog (Modal)
- Popover (seems like a simple `<nav>` link menu?)
- Radio Group (low priority in favor of `<input type="radio">`s)
- Disclosure (low priority in favor of `<summary>`)

## Why?

Headless UI is a spin on the concept of renderless components and if you're not in the know:

> A renderless component is a component that doesn't render any of its own HTML.  
> Instead it **only manages state and behavior**, exposing a single scoped slot that gives the parent/consumer complete control over what should actually be rendered.
> [source](https://adamwathan.me/renderless-components-in-vuejs/)

They're used to inject logic into HTML we're used to working with.

Now this sounds familiar to a feature we're used to in Svelte... an action is defined as:

> A function that is called when an element is created, taking the element and optional parameters as arguments.

And you can do all sorts of things with actions. It's a simple concept that can allow you to do the same thing managing state and behaviors with HTML. Since it's just a function performed on an element, you can coordinate all sorts of crazy things and create interop with your own state. And speaking of state, we have a simple solution: stores.

So that's what this library is about. A Headless UI port for Svelte, using **actions and stores**. Sometimes it uses components for their slot props, especially when it doesn't make sense to manually manage each piece of state in a list, but most of the time all it is actions and stores (oh and of course a whoooole lotta vanilla JS DOM manipulation).

p.s. While actions are, in my opinion, a better solution for the consumer of the API... people may be wondering if it's even a departure from how Headless UI components work. It's mostly because of the degree of control over the render logic that Headless has in its implementation, which has no easy equivalent in Svelte. With actions and stores, the render logic doesn't really have to be considered as the consumer gets to build with good ol' elements. For the maintainer, it's a lot of verbose vanilla DOM code to write, but hey the consumer gets to keep all the element directives, power, and conveniences Svelte offers.

<details> <summary>Notes</summary>
This is a Svelte project adapting Headless-UI's (React) functionality to Svelte. Its end goal is just to have the functionality and accessibility of Headless-UI as a few components with predefined unstyled elements.

<strike>It won't provide the same wrapper/abstraction API that Headless gives as the Tailwind Labs team will be spearheading that effort when they make their way to Svelte. (Honestly, this is just a thinly veiled disclaimer to say I can't figure out a clean API for Svelte that replicates the flexibility of Headless without killing SSR... so I'm at least building its expected result first and seeing if I where I can take it from there.)</strike>

There was goal of a demo form, mostly serving as examples of accessible components for reference, rather than as a library... however it turns out that an actual implementation was a more attractive proposition. I had a repo called IncluSvelte that was aiming to be a demo, but since headless-ui is more clearly defined I opted for this library.

**Current status**: Most abstractions are perfectly working, save for SSR. Well... don't quote me on that as there're no tests in code, only manual tests (however I did iron out some logic that could cause issues). There're a few differences that're made intentionally by design, sometimes for UX reasons, but mainly to fit the usecase of "enhancing" elements with interactivity, rather than straight up giving components. This way, all the power of Svelte element directives are available to the consumer.

On the topic of SSR: The optimal solution is SSR attributes for actions, as detailed in _Relevant Links_. Another possible solution is to provide to consumer attributes to spread or tell the consumer the aria attributes required. It's not a big issue since ALL of the components require JavaScript and will simply not work without. So the main element that triggers the interactivity will be the only one that needs SSR attributes, possibly only introducing an inconvenience of spreading once per component.

Some additional comments... I find it pretty interesting the amount of vanilla DOM needed from a maintainer's perspective. I've even employed a hack in `SlotEl.svelte` to create a utility that gets the element reference to a slotted element without cluttering the DOM... by adding and removing an invisible `div`. That was pretty funny.

</details>

## Docs

Not too fleshed out at the moment, feel free to ask questions so that usecases can be added to the docs. Most actions/components have JSdoc examples and notes for usage. This section will only cover basic code snippets, which should be sufficient to piece together if you have basic knowledge of elements and have seen the Headless-UI React docs/snippets. Please use GitHub's table of contents navigation feature for an overview and to quickly zip to parts you need.

### Menu

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

`$Menu` makes use of Svelte's auto-subscription syntax. Defaults to `false`. You can also use it to open and close the menu programatically (e.g. `$Menu = false`), though closing events are already automatically managed by the menu.

If you bind to the menu element, it also has attached to it some of the internal helpers:

- `menuEl.selected`: A writable store with the current selected menuitem element. You can also set the selected menuitem programatically, which will enable `active` on it, or set `null` for no selection.
- `menuEl.items`: An object containing menu helpers `{ reset, gotoItem, closeMenu }`
  - `reset(el)` resets the selected el, or if an el is passed in changes currently selected to it.
  - `gotoItem(idx)` sets current selected item to the item index passed in, accepts negative indexing. By default uses first item. Only responsible for valid indexes.
  - `closeMenu()` closes the menu and focuses the menu button afterwards, which is the default behavior of most events causing the menu to close.

### Toggle

Toggle are distinct from switches in that switches have on/off text indicators. See [MDN `<label>` docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) for label usage.

```svelte
<!-- basic usage -->
<script>
import { toggle } from 'sashui'
let pressed
</script>
<button on:change={()=>(pressed = !pressed)} use:toggle={pressed} />

<!-- For labels, use how you'd normally use it how you'd normally use a label. -->
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
