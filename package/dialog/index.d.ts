/** `aria-describedby` not implemented. To the consumer it's literally one attribute, and thus' not worth an action for. */
export function useDialog(initOpen?: boolean): ((el: any, initialFocus: HTMLElement | null) => {
    destroy(): void;
}) & {
    overlay(el: any): {
        destroy: Function;
    };
    title(el: any): {
        destroy(): void;
    };
    set(this: void, value: boolean): void;
    update(this: void, updater: import("svelte/store").Updater<boolean>): void;
    subscribe(this: void, run: import("svelte/store").Subscriber<boolean>, invalidate?: (value?: boolean) => void): import("svelte/store").Unsubscriber;
};
