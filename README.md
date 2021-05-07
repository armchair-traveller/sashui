# shui-demo

**S**velte **H**eadless **UI Demo**

⚠ Experimental. Nothing works as of yet.

This is just a little Svelte project attempting to adapt Headless-UI's (React) functionality to Svelte. Its end goal is just to have the functionality and accessibility of Headless-UI as a few components with predefined unstyled elements. It won't provide the same wrapper/abstraction API that Headless gives as the Tailwind Labs team will be spearheading that effort when they make their way to Svelte.

Current status: Just creating the base level components: elements, event handlers, and props. No higher-level abstractions like what Headless offers until the base works.

## Relevant Links

[`svelte:element`](https://github.com/sveltejs/svelte/pull/5481) - could provide `as`-like props.  
[Spread events](https://github.com/sveltejs/svelte/issues/5112) - mentions headless/react-aria. The API for a headless implementation would be much cleaner with spreadable events. Actions have issues due to no SSR.
