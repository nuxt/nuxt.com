<template>
  <div class="w-[750px] h-[500px] shadow-xl rounded-lg flex flex-col gap-y-12 transition-colors duration-500 ease" :class="currentSection === 6 ? 'bg-green-400' : 'bg-white dark:bg-gray-500'">
    <!-- header -->
    <div
      class="flex items-center justify-between h-16 p-8 transition-all duration-500 rounded-t-lg ease"
      :class="currentSection === 4 ? 'translate-x-20 bg-green-400 shadow-xl' : currentSection === 6 ? 'bg-green-400' : 'translate-x-0 bg-gray-100 dark:bg-gray-600'"
    >
      <svg width="27" height="22" viewBox="0 0 27 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14.7605 20.306L24.7071 21.1976C25.0358 21.1977 25.3587 21.1123 25.6434 20.9503C25.9281 20.7882 26.1644 20.5551 26.3287 20.2743C26.493 19.9936 26.5794 19.6751 26.5793 19.351C26.5791 19.0269 26.4924 18.7085 26.3279 18.4279L19.5211 5.2671C19.3568 4.98643 19.1205 4.75335 18.8359 4.5913C18.5513 4.42925 18.2284 4.34393 17.8998 4.34393C17.5712 4.34393 17.2483 4.42925 16.9637 4.5913C16.6791 4.75335 16.4428 4.98643 16.2785 5.2671L15.1679 8.17202L11.3441 1.30977C11.1797 1.02912 10.9433 0.796076 10.6586 0.634054C10.3739 0.472032 10.051 0.386737 9.72231 0.386737C9.39362 0.386737 9.07071 0.472032 8.78604 0.634054C8.50136 0.796076 8.26494 1.02912 8.10053 1.30977L0.536526 16.485C0.371996 16.7656 0.285299 17.0839 0.285156 17.4081C0.285013 17.7322 0.371429 18.0506 0.535712 18.3314C0.699994 18.6121 0.936351 18.8452 1.22101 19.0073C1.50567 19.1694 1.82859 19.2547 2.1573 19.2547L7.91829 19.7748C10.4922 19.7748 12.3903 18.66 13.6964 16.485L16.4599 11.1546L17.8993 8.30429L22.8534 18.2996L16.4599 17.4081L14.7605 20.306ZM7.81239 16.8739L3.27887 16.8729L9.72534 4.34397L13.4654 11.07L11.1951 14.9485C10.3278 16.3597 9.34239 16.8739 7.81239 16.8739Z" fill="#070A13" />
      </svg>
      <div class="flex gap-x-4">
        <div class="w-12 h-2 bg-white rounded-xl" />
        <div class="w-12 h-2 bg-white rounded-xl" />
        <div class="w-12 h-2 bg-white rounded-xl" />
        <div class="w-12 h-2 bg-white rounded-xl" />
        <div class="w-12 h-2 bg-white rounded-xl" />
      </div>
      <div class="w-16 h-8 bg-white rounded-lg" />
    </div>
    <!-- body -->
    <div class="p-4">
      <div class="flex flex-col p-8 -mt-12 transition-all duration-500 rounded-lg gap-y-8 ease" :class="currentSection === 2 ? 'translate-x-20 bg-green-400 shadow-xl' : 'translate-x-0'">
        <div class="flex flex-col gap-y-8">
          <div class="flex justify-between">
            <div class="flex flex-col pt-8 gap-y-2">
              <div class="w-32 h-8 mb-4 bg-gray-100 rounded-[4px]" />
              <div class="w-64 h-4 pb-1 bg-gray-100 rounded-[4px]" />
              <div class="w-48 h-4 rounded-[4px] bg-gray-100" />
            </div>
            <div class="h-[180px] w-[350px] rounded-md transition-all duration-500 ease" :class="currentSection === 0 ? 'translate-x-20 bg-green-400 shadow-xl' : 'bg-gray-100 translate-x-0'" />
          </div>
        </div>
        <div class="flex items-center justify-between gap-x-4">
          <div class="w-[250px] h-32 bg-gray-100 rounded-md" />
          <div class="w-[250px] h-32 bg-gray-100 rounded-md" />
          <div class="w-[250px] h-32 bg-gray-100 rounded-md" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  currentSection: {
    type: Number,
    default: 0
  }
})
</script>
