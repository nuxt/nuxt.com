<template>
  <div>
    <div ref="gemAnim" />
  </div>
</template>

<script setup>
// import { useEventListener } from '@vueuse/core'
// import { useColorMode } from '#imports'

// const ready = ref()
// const gemWrapper = ref(null)
// const gemAnim = ref(null)

// const colorMode = useColorMode()

// if (process.client) {
//   async function loadGem () {
//     const THREE = await import('three').then(m => m.default || m)
//     const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js' /* webpackChunkName: "gem" */).then(m => m.default || m)
//     const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js' /* webpackChunkName: "gem" */).then(m => m.default || m)
//     const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js' /* webpackChunkName: "gem" */).then(m => m.default || m)

//     // Loaders
//     const gltfLoader = new GLTFLoader()

//     // Renderer
//     const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
//     renderer.outputEncoding = THREE.sRGBEncoding
//     renderer.toneMapping = THREE.ACESFilmicToneMapping
//     renderer.toneMappingExposure = 1
//     if (window.matchMedia('(min-width: 640px)').matches) {
//       renderer.setSize(475, 475)
//     } else if (window.matchMedia('(min-width: 400px)').matches) {
//       renderer.setSize(240, 240)
//     } else {
//       renderer.setSize(180, 180)
//     }

//     // Scene
//     const scene = new THREE.Scene()

//     // Gem
//     let gem

//     const hdrDark = new RGBELoader().load(
//       '/assets/home/environment_D.hdr',
//       () => {
//         hdrDark.mapping = THREE.EquirectangularReflectionMapping
//       }
//     )

//     const hdrLight = new RGBELoader().load(
//       '/assets/home/environment_L.hdr',
//       () => {
//         hdrLight.mapping = THREE.EquirectangularReflectionMapping
//       }
//     )

//     const gemMaterial = new THREE.MeshPhysicalMaterial({})

//     gltfLoader.load('/assets/home/gem.glb', function (gltf) {
//       gem = gltf.scene.children[0]
//       gem.traverse((o) => {
//         if (o.isMesh) { o.material = gemMaterial }
//         gem.scale.set(1, 1, 1)
//         gem.position.set(0, 0, 0)
//         gem.rotation.z = 0.3
//         scene.add(gem)

//         ready.value = true
//       })
//     })

//     // Renderer
//     gemAnim.value.appendChild(renderer.domElement)
//     renderer.setPixelRatio(window.devicePixelRatio)
//     function onWindowResize () {
//       if (window.matchMedia('(min-width: 640px)').matches) {
//         renderer.setSize(475, 475)
//       } else if (window.matchMedia('(min-width: 400px)').matches) {
//         renderer.setSize(240, 240)
//       } else {
//         renderer.setSize(180, 180)
//       }
//     }

//     useEventListener(window, 'resize', () => {
//       onWindowResize()
//     })

//     // Transition on load
//     gemWrapper.value.style.opacity = 0
//     setTimeout(() => {
//       gemWrapper.value.style.opacity = 1
//     }, 1000)

//     // Camera
//     const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400)
//     camera.aspect = 1
//     camera.position.z = 245

//     // Controls
//     const controls = new OrbitControls(camera, renderer.domElement)
//     controls.enableDamping = true
//     controls.dampingFactor = 0.05
//     controls.enableZoom = false
//     controls.enablePan = false
//     controls.maxPolarAngle = Math.PI * 0.5
//     controls.minPolarAngle = Math.PI * 0.5

//     controls.update()

//     function animate () {
//       if (colorMode.value === 'dark') {
//         gemMaterial.color = new THREE.Color(0x00DC82)
//         gemMaterial.metalness = 0.05
//         gemMaterial.roughness = 0.10
//         gemMaterial.transmission = 1
//         gemMaterial.thickness = 1
//         gemMaterial.envMap = hdrDark
//         gemMaterial.envMapIntensity = 0.8
//         gemMaterial.specularIntensity = 1
//         gemMaterial.specularColor = new THREE.Color(0xFFFFFF)
//         gemMaterial.sheen = 0
//         gemMaterial.clearcoat = 0
//         gemMaterial.flatShading = true
//       } else {
//         gemMaterial.color = new THREE.Color(0x000000)
//         gemMaterial.metalness = 0
//         gemMaterial.roughness = 0
//         gemMaterial.transmission = 0.82
//         gemMaterial.thickness = 5.1
//         gemMaterial.envMap = hdrLight
//         gemMaterial.envMapIntensity = 0.3
//         gemMaterial.specularIntensity = 0.61
//         gemMaterial.specularColor = 0x000000
//         gemMaterial.sheen = 0.78
//         gemMaterial.clearcoat = 0.16
//         gemMaterial.flatShading = true
//       }

//       requestAnimationFrame(animate)
//       if (gem) {
//         gem.rotation.y += 0.01
//       }
//       controls.update()
//       renderer.render(scene, camera)
//     }

//     animate()
//   }

//   onMounted(() => requestIdleCallback(() => {
//     const observer = new IntersectionObserver((entries) => {
//       entries.forEach((entry) => {
//         if (entry.isIntersecting) {
//           loadGem()
//           observer.unobserve(entry.target)
//         }
//       })
//     }, { threshold: 0.5 })
//     observer.observe(gemAnim.value)
//   }))
// }
</script>

<style>
#gemWrapper canvas {
  height: 180px;
  width: 180px;
  @media (min-width: 400px ) {
    height: 240px;
    width: 240px;
  }
  @media (min-width: 640px ) {
    height: 475px;
    width: 475px;
  }
}
</style>
