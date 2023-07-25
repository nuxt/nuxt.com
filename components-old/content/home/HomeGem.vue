<template>
  <div id="gemWrapper" ref="gemWrapper" :style="{ opacity: ready ? 1 : 0 }" class="transition duration-1000">
    <div ref="gemAnim" />
  </div>
</template>

<script setup>
import { useEventListener } from '@vueuse/core'
import { useColorMode } from '#imports'
import fragmentGem from '~/assets/shaders/fragmentGem.glsl'
import vertexGem from '~/assets/shaders/vertexGem.glsl'

const ready = ref()
const gemWrapper = ref(null)
const gemAnim = ref(null)

const colorMode = useColorMode()

if (process.client) {
  async function loadGem () {
    const THREE = await import('three').then(m => m.default || m)
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js' /* webpackChunkName: "gem" */).then(m => m.default || m)
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js' /* webpackChunkName: "gem" */).then(m => m.default || m)
    const { RGBELoader } = await import('three/examples/jsm/loaders/RGBELoader.js' /* webpackChunkName: "gem" */).then(m => m.default || m)

    // Loaders
    const gltfLoader = new GLTFLoader()

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    })

    if (window.matchMedia('(min-width: 640px)').matches) {
      renderer.setSize(475, 475)
    } else if (window.matchMedia('(min-width: 400px)').matches) {
      renderer.setSize(240, 240)
    } else {
      renderer.setSize(180, 180)
    }

    // Scene
    const scene = new THREE.Scene()
    // Gem
    let gem
    const params = { time: 0 }

    // Camera for reflexion calculation
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(200, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipMapLinearFilter,
      colorSpace: THREE.SRGBColorSpace
    })

    const hdrDark = new RGBELoader().load(
      '/assets/home/environment_D.hdr',
      () => {
        scene.environment = hdrDark
      }
    )

    const cubeCamera = new THREE.CubeCamera(0.5, 1000, cubeRenderTarget)
    const gem3DMaterial = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        tCube: { value: 0 },
        mRefractionRatio: { value: 1.05 },
        mFresnelBias: { value: 0.5 },
        mFresnelScale: { value: 0.2 },
        mFresnelPower: { value: 3 },
        resolution: { value: new THREE.Vector4() }
      },
      vertexShader: vertexGem,
      fragmentShader: fragmentGem
    })

    gltfLoader.load('/assets/home/gem.glb', function (gltf) {
      gem = gltf.scene.children[0]
      gem.traverse((o) => {
        if (o.isMesh) { o.material = gem3DMaterial }
        gem.scale.set(1, 1, 1)
        gem.position.set(0, 0, 0)
        gem.rotation.z = 0.3
        scene.add(gem)
        ready.value = true
      })
    })

    const envGeo = new THREE.SphereGeometry(250, 250, 8)
    const envMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })
    envMat.map = hdrDark
    envMat.transparent = true
    envMat.opacity = 0.95
    const envSphere = new THREE.Mesh(envGeo, envMat)
    scene.add(envSphere)

    // Renderer
    gemAnim.value.appendChild(renderer.domElement)
    renderer.setPixelRatio(window.devicePixelRatio)
    function onWindowResize () {
      if (window.matchMedia('(min-width: 640px)').matches) {
        renderer.setSize(475, 475)
      } else if (window.matchMedia('(min-width: 400px)').matches) {
        renderer.setSize(240, 240)
      } else {
        renderer.setSize(180, 180)
      }
    }

    useEventListener(window, 'resize', () => {
      onWindowResize()
    })

    // Transition on load
    gemWrapper.value.style.opacity = 0
    setTimeout(() => {
      gemWrapper.value.style.opacity = 1
    }, 1000)

    // Camera
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 250)
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

    function animate () {
      requestAnimationFrame(animate)
      params.time += 0.01
      if (gem) {
        gem.visible = false
        cubeCamera.update(renderer, scene)
        gem.visible = true
        gem3DMaterial.uniforms.tCube.value = cubeRenderTarget.texture
        gem.rotation.y += 0.01
      }
      controls.update()
      renderer.render(scene, camera)
    }

    animate()
  }

  onMounted(() => requestIdleCallback(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadGem()
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.5 })
    observer.observe(gemAnim.value)
  }))
}
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
