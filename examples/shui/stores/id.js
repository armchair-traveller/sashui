import { writable } from "svelte/store";

let count = 0;
export const id = writable(() => ++count + "");
