<template>
  <div ref="gemAnim" class="absolute top-[-50px] left-2/3" />
</template>

<script setup>
import * as THREE from 'three'

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useColorMode } from '#imports'

const gemAnim = ref(null)

const colorMode = useColorMode()

// Loaders
const gltfLoader = new GLTFLoader()

// Renderer
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
renderer.outputEncoding = THREE.sRGBEncoding
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.setSize(475, 475)

// Scene
const scene = new THREE.Scene()

// Gem
let gem

const hdrDark = new RGBELoader().load(
  '/assets/home/environment_D.hdr',
  () => {
    hdrDark.mapping = THREE.EquirectangularReflectionMapping
  }
)

const hdrLight = new RGBELoader().load(
  '/assets/home/environment_L.hdr',
  () => {
    hdrLight.mapping = THREE.EquirectangularReflectionMapping
  }
)

const gemMaterial = new THREE.MeshPhysicalMaterial({})

gltfLoader.load('/assets/home/gem.glb', function (gltf) {
  gem = gltf.scene.children[0]
  gem.traverse((o) => {
    if (o.isMesh) { o.material = gemMaterial }
    gem.scale.set(1, 1, 1)
    gem.position.set(0, 0, 0)
    gem.rotation.z = 0.3
    scene.add(gem)
  })
})

onMounted(() => {
  // Camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400)
  camera.aspect = 1
  camera.position.z = 245

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.enableZoom = false
  controls.enablePan = false
  controls.maxPolarAngle = Math.PI * 0.5
  controls.minPolarAngle = Math.PI * 0.5

  controls.update()

  // Renderer
  gemAnim.value.appendChild(renderer.domElement)

  function animate () {
    if (colorMode.value === 'dark') {
      gemMaterial.color = new THREE.Color(0x00DC82)
      gemMaterial.metalness = 0.05
      gemMaterial.roughness = 0.10
      gemMaterial.transmission = 1
      gemMaterial.thickness = 1
      gemMaterial.envMap = hdrDark
      gemMaterial.envMapIntensity = 0.8
      gemMaterial.specularIntensity = 1
      gemMaterial.specularColor = new THREE.Color(0xFFFFFF)
      gemMaterial.sheen = 0
      gemMaterial.clearcoat = 0
      gemMaterial.flatShading = true
    } else {
      gemMaterial.color = new THREE.Color(0x000000)
      gemMaterial.metalness = 0
      gemMaterial.roughness = 0
      gemMaterial.transmission = 0.82
      gemMaterial.thickness = 5.1
      gemMaterial.envMap = hdrLight
      gemMaterial.envMapIntensity = 0.3
      gemMaterial.specularIntensity = 0.61
      gemMaterial.specularColor = 0x000000
      gemMaterial.sheen = 0.78
      gemMaterial.clearcoat = 0.16
      gemMaterial.flatShading = true
    }

    requestAnimationFrame(animate)
    if (gem) {
      gem.rotation.y += 0.01
    }
    controls.update()
    renderer.render(scene, camera)
  };

  animate()
})
</script>

<style>
canvas {
  height: 475px;
  width: 475px;
}
</style>
