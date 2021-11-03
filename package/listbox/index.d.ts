export function useListbox(initOpen?: boolean): ((node: any, { autofocus }?: {
    autofocus?: boolean;
}) => {
    destroy(): void;
}) & {
    /** default tag: `<button>`
     * other viable tags: input,a
     */
    button(node: any): {
        destroy(): void;
    };
    /** default tag: `<li>` */
    option(node: any): {
        destroy(): void;
    };
    /** A renderless component for a menu item. Generally, it should be wrapped around a button. Exposes an active slot prop for whether the current item is active. */
    Item: typeof Item;
    set(this: void, value: boolean): void;
    update(this: void, updater: import("svelte/store").Updater<boolean>): void;
    subscribe(this: void, run: import("svelte/store").Subscriber<boolean>, invalidate?: (value?: boolean) => void): import("svelte/store").Unsubscriber;
};
import Item from "../menu/Item.svelte";
