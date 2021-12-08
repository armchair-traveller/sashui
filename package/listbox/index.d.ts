/**
 * Creates a new listbox instance. Refer to menu API.
 * Main differences: `aria-orientation` capability and `aria-disabled` instead of `disabled for options.
 * @returns `Listbox` action store, w/ additional actions, components, and helpers. If not destructured, MUST be capitalized
 * for Svelte to recognize the component(s) attached to it.
 */
export function useListbox(initOpen?: boolean): ((node: any, { autofocus }?: {
    autofocus?: boolean;
}) => {
    destroy(): void;
}) & {
    open: () => Promise<void>;
    close: () => Promise<void>;
    /** Button action, expected to be used on a `<button>`-like el. Opens and closes the menu. */
    button(node: any): {
        destroy(): void;
    };
    /** A renderless component for an option. default child: `<li>`. Exposes an active slot prop for whether the current item is active.
     * Set `aria-disabled` attribute to disable an option.
     */
    Option: typeof Option;
    set(this: void, value: boolean): void;
    update(this: void, updater: import("svelte/store").Updater<boolean>): void;
    subscribe(this: void, run: import("svelte/store").Subscriber<boolean>, invalidate?: (value?: boolean) => void): import("svelte/store").Unsubscriber;
    listboxId: ((el: any, attr: any) => import("svelte/store").Unsubscriber) & {
        set(el: any, name: any): void;
        update: (this: void, updater: import("svelte/store").Updater<any>) => void;
        subscribe: (this: void, run: import("svelte/store").Subscriber<any>, invalidate?: (value?: any) => void) => import("svelte/store").Unsubscriber;
    };
    /** store for currently selected element */
    selected: import("svelte/store").Writable<any>;
};
import Option from "./Option.svelte";
