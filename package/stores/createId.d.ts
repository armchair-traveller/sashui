export function createId(init: any): ((el: any, attr: any) => import("svelte/store").Unsubscriber) & {
    /** resets state if falsey/no value passed in */
    set(el: any, name: any): void;
    update: (this: void, updater: import("svelte/store").Updater<any>) => void;
    subscribe: (this: void, run: import("svelte/store").Subscriber<any>, invalidate?: (value?: any) => void) => import("svelte/store").Unsubscriber;
};
export function generateId(name: any): string;
