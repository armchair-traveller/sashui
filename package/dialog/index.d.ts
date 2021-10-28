/** `aria-describedby` not implemented. To the consumer it's literally one attribute, and thus' not worth an action for. */
export function useDialog(initOpen?: boolean): {
    (el: any, initialFocus: HTMLElement | null): {
        destroy(): void;
    };
    overlay(el: any): {
        destroy: Function;
    };
    title(el: any): {
        destroy(): void;
    };
} & import("svelte/store").Writable<boolean>;
