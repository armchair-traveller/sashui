import type { Writable } from 'svelte/types/runtime/store'
import type Item from './Item.svelte'

export interface Menu extends Writable<?boolean> {
  (
    node: HTMLElement,
    params: {
      autofocus?: boolean
    }
  ): { destroy(): void }
  button(node: HTMLButtonElement): { destroy(): void }
  Item: Item
  selected: Writable<?HTMLElement>
  menuId: Writable<?string>
  open(): Promise<void>
  close(): Promise<void>
  reset?(curEl?: HTMLElement): HTMLElement
  gotoItem?(idx?: number): HTMLElement
  nextItem?(): HTMLElement
  prevItem?(): HTMLElement
  search?(char?: string, timeout?: number): void
}
