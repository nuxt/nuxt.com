<template>
  <div class="relative flex flex-col lg:flex-row min-h-[500px] items-center col-span-3 pl-8 lg:pl-0">
    <div class="h-full w-full h-[420px] w-[291px] xl:h-[490px] xl:w-[391px] xl:translate-x-[50px] 2xl:translate-x-[100px] border border-gray-600 bg-gray-900 rounded-md flex flex-col justify-between text-white p-4 xl:p-7">
      <span class="pb-5 text-sm font-semibold xl:text-base">blogArticle</span>
      <div class="flex flex-col pb-4">
        <span class="pb-1.5 text-sm font-semibold">banner</span>
        <div class="flex items-center justify-center bg-gray-800 border border-gray-600 rounded-md w-[128px] px-3 py-1.5">
          <span class="text-sm">assets/aurora.jpg</span>
        </div>
      </div>
      <div class="flex flex-col pb-4">
        <div class="relative flex flex-col w-full px-3 py-1.5 bg-gray-800 border border-gray-600 rounded-md">
          <span class="pb-1 text-sm font-semibold">title</span>
          <span class="text-sm">Introducting Nuxt</span>
          <div class="absolute w-0.5 bg-teal-400 h-4 left-[22%] top-[33px]" />
          <div class="absolute flex items-center justify-center px-4 py-[1px] bg-teal-400 rounded-md left-[21%] top-[4px] z-[1]">
            <span class="text-white">droe</span>
          </div>
        </div>
      </div>
      <div class="relative flex flex-col px-3 py-1.5 mb-4 bg-gray-800 border border-gray-600 rounded-md">
        <div class="absolute flex items-center justify-center px-4 py-[1px] bg-indigoblue-400 rounded-md left-[49%] top-[4px] z-[1]">
          <span class="text-white text">atinux</span>
        </div>
        <div class="absolute w-0.5 bg-indigoblue-400 h-4 left-1/2 top-[34px]" />
        <span class="pb-1 text-sm font-semibold">description</span>
        <span class="text-sm">Id orci tellus laoreet id ac. <span class="hidden xl:block">Dolor, aenean leo, ac etiam consequat in. Convallis arcu ipsum urna nibh. </span>
        </span>
      </div>
      <div>
        <span class="pb-1 text-sm font-semibold">link</span>
        <div class="grid items-center w-full grid-cols-2 py-2 pr-4 xl:pr-12 gap-x-4 gap-y-3">
          <span class="p-2 text-xs bg-gray-800 border border-gray-600 rounded-md xl:text-sm "><span class="font-semibold">text: </span>Read more</span>
          <span class="p-2 text-xs bg-gray-800 border border-gray-600 rounded-md xl:text-sm"><span class="font-semibold">src: </span>/blog/article</span>
          <span class="p-2 text-xs bg-gray-800 border border-gray-600 rounded-md xl:text-sm"><span class="font-semibold">icon: </span>right-arrow</span>
        </div>
      </div>
    </div>
    <div
      class="-translate-y-4 lg:translate-y-0 sm:absolute h-full w-full h-[300px] w-[250px] rounded-md text-gray-900 bg-gray-100/80 backdrop-blur-md
        -bottom-8 flex flex-col justify-between gap-y-3 xl:gap-y-5 p-6 xl:h-[402px] xl:w-[335px]
        sm:-bottom-[100px] sm:-right-24 md:-right-8 lg:-right-48 bottom-8 xl:top-[150px] xl:-right-[280px] 2xl:-right-[320px]"
    >
      <img src="/assets/home/projects-image.png" alt="projects image exemple">
      <h2 class="text-xl font-semibold xl:text-3xl ">
        Introducting Nuxt
      </h2>
      <p class="text-xs xl:text-sm">
        Id orci tellus laoreet id ac. Dolor, aenean leo, ac etiam consequat in. Convallis arcu ipsum urna nibh.Id orci tellus laoreet id ac. <span class="hidden xl:block">Dolor, aenean leo, ac etiam consequat in</span>
      </p>
      <UButton
        label="Read more"
        icon="heroicons-solid:arrow-right"
        variant="transparant"
        trailing
        class="-translate-x-4"
      />
    </div>
  </div>
</template>
