/** @typedef {typeof __propDef.props}  OptionProps */
/** @typedef {typeof __propDef.events}  OptionEvents */
/** @typedef {typeof __propDef.slots}  OptionSlots */
export default class Option extends SvelteComponentTyped<{
    Listbox: any;
}, {
    [evt: string]: CustomEvent<any>;
}, {
    default: {
        active: boolean;
    };
}> {
}
export type OptionProps = typeof __propDef.props;
export type OptionEvents = typeof __propDef.events;
export type OptionSlots = typeof __propDef.slots;
import { SvelteComponentTyped } from "svelte";
declare const __propDef: {
    props: {
        Listbox: any;
    };
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {
        default: {
            active: boolean;
        };
    };
};
export {};
