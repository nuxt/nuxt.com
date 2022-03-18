<template>
  <aside class="sticky hidden p-8 overflow-y-auto bg-white border-l border-gray-200 top-0 w-96 lg:block">
    <div class="pb-16 space-y-6">
      <div>
        <div class="block w-full overflow-hidden rounded-lg aspect-w-10 aspect-h-7">
          <img :src="currentFile.source" alt="" class="object-cover">
        </div>
        <div class="flex items-start justify-between mt-4">
          <div>
            <h2 class="text-lg font-medium text-gray-900">
              <span class="sr-only">Details for </span>{{ currentFile.name }}
            </h2>
            <p class="text-sm font-medium text-gray-500">
              {{ currentFile.size }}
            </p>
          </div>
          <button type="button" class="flex items-center justify-center w-8 h-8 ml-4 text-gray-400 bg-white rounded-full hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <UIcon name="heroicons-outline:heart" class="w-6 h-6" aria-hidden="true" />
            <span class="sr-only">Favorite</span>
          </button>
        </div>
      </div>
      <div>
        <h3 class="font-medium text-gray-900">
          Information
        </h3>
        <dl class="mt-2 border-t border-b border-gray-200 divide-y divide-gray-200">
          <div v-for="key in Object.keys(currentFile.information)" :key="key" class="flex justify-between py-3 text-sm font-medium">
            <dt class="text-gray-500">
              {{ key }}
            </dt>
            <dd class="text-gray-900">
              {{ currentFile.information[key] }}
            </dd>
          </div>
        </dl>
      </div>
      <div>
        <h3 class="font-medium text-gray-900">
          Shared with
        </h3>
        <ul role="list" class="mt-2 border-t border-b border-gray-200 divide-y divide-gray-200">
          <li v-for="person in currentFile.sharedWith" :key="person.id" class="flex items-center justify-between py-3">
            <div class="flex items-center">
              <img :src="person.imageUrl" alt="" class="w-8 h-8 rounded-full">
              <p class="ml-4 text-sm font-medium text-gray-900">
                {{ person.name }}
              </p>
            </div>
            <button type="button" class="ml-6 text-sm font-medium text-indigo-600 bg-white rounded-md hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Remove<span class="sr-only"> {{ person.name }}</span>
            </button>
          </li>
        </ul>
      </div>
      <div class="flex">
        <button type="button" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Download
        </button>
        <button type="button" class="flex-1 px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Delete
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
const currentFile = {
  name: 'IMG_4985.HEIC',
  size: '3.9 MB',
  source:
    'https://images.unsplash.com/photo-1582053433976-25c00369fc93?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=512&q=80',
  information: {
    'Uploaded by': 'Marie Culver',
    Created: 'June 8, 2020',
    'Last modified': 'June 8, 2020',
    Dimensions: '4032 x 3024',
    Resolution: '72 x 72'
  },
  sharedWith: [
    {
      id: 1,
      name: 'Aimee Douglas',
      imageUrl:
        'https://images.unsplash.com/photo-1502685104226-ee32379fefbe?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=3&w=1024&h=1024&q=80'
    },
    {
      id: 2,
      name: 'Andrea McMillan',
      imageUrl:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixqx=oilqXxSqey&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    }
  ]
}
</script>
