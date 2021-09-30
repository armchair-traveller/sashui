/** @typedef {typeof __propDef.props}  SlotElProps */
/** @typedef {typeof __propDef.events}  SlotElEvents */
/** @typedef {typeof __propDef.slots}  SlotElSlots */
/**
 * Takes a slot, gets the first el of the slotted content by using a trick of inserting and removing a hidden div, from
 * the DOM. It checks for updates, so if you're attaching event handlers to the el and swap it with some other, make sure
 * to cleanup your handlers by reacting to the bound el.
 */
export default class SlotEl extends SvelteComponentTyped<{
    el?: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {};
}> {
}
export type SlotElProps = typeof __propDef.props;
export type SlotElEvents = typeof __propDef.events;
export type SlotElSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        el?: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {};
    };
};
export {};
