<script>
import DeleteActiveIcon from './_DeleteActiveIcon.svelte'
import DeleteInactiveIcon from './_DeleteInactiveIcon.svelte'
import MoveActiveIcon from './_MoveActiveIcon.svelte'
import MoveInactiveIcon from './_MoveInactiveIcon.svelte'
import ArchiveActiveIcon from './_ArchiveActiveIcon.svelte'
import ArchiveInactiveIcon from './_ArchiveInactiveIcon.svelte'
import DuplicateActiveIcon from './_DuplicateActiveIcon.svelte'
import DuplicateInactiveIcon from './_DuplicateInactiveIcon.svelte'
import EditActiveIcon from './_EditActiveIcon.svelte'
import EditInactiveIcon from './_EditInactiveIcon.svelte'

import { useMenu } from '$lib'
const Menu = useMenu()
</script>

<div class="flex flex-col items-center justify-center w-full">
  <div class="w-56 text-right fixed top-16">
    <div class="relative inline-block text-left">
      <div>
        <button
          class="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-md bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
          use:Menu.button
        >
          Options
          <!-- prettier-ignore -->
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-2 -mr-1 text-purple-200 hover:text-purple-100" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        </button>
      </div>

      {#if $Menu}
        <menu
          class="pl-0 absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          use:Menu
        >
          <div class="px-1 py-1 ">
            <Menu.Item let:active>
              <button
                class={`${
                  active ? 'bg-purple-500 text-white' : 'text-gray-900'
                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
              >
                {#if active}
                  <EditActiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {:else}
                  <EditInactiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {/if}
                Edit
              </button>
            </Menu.Item>
            <Menu.Item let:active>
              <button
                class={`${
                  active ? 'bg-purple-500 text-white' : 'text-gray-900'
                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
              >
                {#if active}
                  <DuplicateActiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {:else}
                  <DuplicateInactiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {/if}
                Duplicate
              </button>
            </Menu.Item>
          </div>
          <div class="px-1 py-1">
            <Menu.Item let:active>
              <button
                class={`${
                  active ? 'bg-purple-500 text-white' : 'text-gray-900'
                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
              >
                {#if active}
                  <ArchiveActiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {:else}
                  <ArchiveInactiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {/if}
                Archive
              </button>
            </Menu.Item>
            <Menu.Item let:active>
              <button
                class={`${
                  active ? 'bg-purple-500 text-white' : 'text-gray-900'
                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
              >
                {#if active}
                  <MoveActiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {:else}
                  <MoveInactiveIcon class="w-5 h-5 mr-2" aria-hidden="true" />
                {/if}
                Move
              </button>
            </Menu.Item>
          </div>
          <div class="px-1 py-1">
            <Menu.Item let:active>
              <button
                class={`${
                  active ? 'bg-purple-500 text-white' : 'text-gray-900'
                } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
              >
                {#if active}
                  <DeleteActiveIcon class="w-5 h-5 mr-2 text-purple-400" aria-hidden="true" />
                {:else}
                  <DeleteInactiveIcon class="w-5 h-5 mr-2 text-purple-400" aria-hidden="true" />
                {/if}
                Delete
              </button>
            </Menu.Item>
          </div>
        </menu>
      {/if}
    </div>
  </div>
</div>
