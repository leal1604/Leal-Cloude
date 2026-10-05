---
name: web-3d
description: Guia para criar sites e experiências 3D na web com Three.js, React Three Fiber (R3F), Drei, GSAP e shaders GLSL. Use SEMPRE que o usuário pedir site 3D, landing page 3D, hero 3D, cena WebGL, modelo .glb/.gltf no site, animação 3D com scroll, portfolio 3D, configurador de produto 3D, partículas, shaders, Three.js, R3F, react-three-fiber, Spline ou Blender para web — mesmo que não diga "3D" explicitamente (ex: "efeito imersivo", "objeto girando", "fundo animado em WebGL"). Use junto com a skill frontend-design: ela cuida da direção visual, esta cuida do 3D, performance e arquitetura.
---

# Web 3D (Three.js / React Three Fiber)

Esta skill define como construir experiências 3D na web que sejam bonitas, rápidas e funcionem no celular. Combine com a skill `frontend-design` para tipografia, paleta e layout.

## 1. Escolha da stack

Antes de escrever código, identifique o projeto:

- **Projeto já usa React / Next.js** → React Three Fiber + `@react-three/drei` (+ `@react-three/postprocessing` se precisar de efeitos).
- **HTML/JS puro, Vite vanilla, Astro sem React** → Three.js puro.
- **Animação ligada ao scroll** → GSAP + ScrollTrigger (vanilla) ou `ScrollControls` do Drei (R3F). Para scroll suave, Lenis.
- **Física** → `@react-three/rapier` (R3F) ou Rapier/cannon-es (vanilla).

Se não houver projeto, sugira **Vite** (`npm create vite@latest`). Instale sempre as versões estáveis mais recentes e confira compatibilidade entre `three`, `@react-three/fiber` e `@react-three/drei` (versões major do R3F acompanham versões major do React).

Importe addons de `three/addons/...` (ex: `three/addons/loaders/GLTFLoader.js`), não de caminhos antigos `examples/jsm`.

## 2. Estrutura de arquivos

### Vanilla
```
src/
  main.js          # bootstrap: cria Experience
  Experience.js    # renderer, cena, câmera, loop, resize
  world/           # objetos da cena (um arquivo por elemento)
  utils/           # Sizes, Time, ResourceLoader, Debug
  shaders/         # .glsl (vertex/fragment)
public/models/     # .glb comprimidos
public/textures/
```

### R3F
```
src/
  App.jsx          # layout HTML + <Canvas>
  canvas/Scene.jsx # luzes, ambiente, câmera
  canvas/models/   # componentes gerados com gltfjsx
  canvas/effects/  # pós-processamento
  sections/        # seções HTML sobrepostas
```

Mantenha o conteúdo HTML (texto, botões, links) **fora** do canvas, sobreposto com CSS. Texto importante nunca deve existir só dentro do WebGL.

## 3. Setup base (vanilla)

```js
import * as THREE from 'three';

const canvas = document.querySelector('canvas.webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 6);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = clock.getDelta();
  // atualizar objetos usando delta (nunca valores fixos por frame)
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
```

## 4. Setup base (R3F)

```jsx
import { Canvas } from '@react-three/fiber';
import { Environment, PerformanceMonitor, AdaptiveDpr, Preload } from '@react-three/drei';
import { Suspense, useState } from 'react';

export default function App() {
  const [dpr, setDpr] = useState(1.5);
  return (
    <>
      <Canvas
        className="webgl"
        dpr={dpr}
        camera={{ position: [0, 0, 6], fov: 35 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <PerformanceMonitor onIncline={() => setDpr(2)} onDecline={() => setDpr(1)} />
        <AdaptiveDpr pixelated />
        <Suspense fallback={null}>
          <Scene />
          <Environment preset="city" />
          <Preload all />
        </Suspense>
      </Canvas>
      {/* HTML sobreposto aqui */}
    </>
  );
}
```

Regras de R3F:
- Animações em `useFrame((state, delta) => ...)`, mutando refs. **Nunca** chame `setState` dentro de `useFrame`.
- Não crie geometrias/materiais novos a cada render; use `useMemo` ou declare em JSX.
- Para muitos objetos iguais use `<Instances>` / `InstancedMesh`.
- Gere componentes de modelo com `npx gltfjsx modelo.glb --transform` (já comprime e cria o componente).
- Use `useGLTF.preload('/models/x.glb')` para modelos principais.

## 5. Modelos e assets

- Formato padrão: **.glb**. Comprima com `gltf-transform` (Draco ou Meshopt) e texturas em **WebP/KTX2**.
- Meta de peso: cena inicial idealmente < 3–5 MB no total; modelo hero < 2 MB.
- Texturas em potência de 2 (1024, 2048); evite 4K sem necessidade.
- Faça "bake" de iluminação/sombra no Blender quando a cena for estática — fica mais bonito e muito mais leve que luzes em tempo real.
- Mostre um loader real (progresso do `LoadingManager` ou `useProgress` do Drei) e faça uma transição de entrada suave.

## 6. Iluminação e visual

- Prefira **HDRI / Environment** para iluminação base + 1 luz direcional para sombra.
- Sombras: ative só nos objetos necessários; limite `shadow.mapSize` (1024 costuma bastar). `ContactShadows` (Drei) é barato e bonito para objetos sobre chão.
- Materiais: `MeshStandardMaterial`/`MeshPhysicalMaterial` para realismo; `MeshMatcapMaterial` para visual estilizado e barato.
- Pós-processamento com moderação (bloom, vignette, noise leve). Cada pass custa performance.
- Cores: defina a paleta junto com a frontend-design e lembre que texturas de cor usam `SRGBColorSpace`.

## 7. Performance (obrigatório)

- `pixelRatio` máximo 2; reduza no mobile.
- Mire em < 100 draw calls; confira com `renderer.info` ou `r3f-perf` / `stats.js` em desenvolvimento.
- Junte geometrias estáticas, use instancing, evite muitos materiais diferentes.
- Pause a renderização quando o canvas estiver fora da tela (IntersectionObserver) ou a aba estiver oculta (`frameloop="demand"` no R3F quando a cena é estática).
- Ao remover objetos, chame `geometry.dispose()`, `material.dispose()` e `texture.dispose()`.
- Carregue o 3D de forma lazy (import dinâmico) para não travar o primeiro carregamento da página.

## 8. Mobile e fallback

- Detecte dispositivos fracos (`PerformanceMonitor`, `navigator.hardwareConcurrency`, largura da tela) e entregue versão simplificada: menos partículas, sem pós-processamento, sem sombras dinâmicas.
- Controles por toque: evite capturar o scroll da página com OrbitControls; desative zoom e use `touch-action` adequado.
- Se WebGL não estiver disponível, mostre uma imagem estática (render do modelo) no lugar.

## 9. Acessibilidade

- Respeite `prefers-reduced-motion`: reduza ou pare animações automáticas e efeitos de scroll.
- Todo conteúdo e navegação existem em HTML real, legível sem o canvas.
- Canvas decorativo: `aria-hidden="true"`. Canvas interativo: forneça descrição e alternativa.
- Mantenha contraste do texto sobre a cena (overlay ou gradiente quando necessário).

## 10. Animação com scroll (padrão)

Vanilla + GSAP:
```js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

gsap.timeline({ scrollTrigger: { trigger: '.sections', start: 'top top', end: 'bottom bottom', scrub: 1 } })
  .to(model.rotation, { y: Math.PI * 2 })
  .to(camera.position, { z: 3 }, 0);
```

R3F: use `<ScrollControls pages={n}>` + `useScroll()` dentro de `useFrame`, interpolando com `THREE.MathUtils.damp` para suavidade.

Sempre suavize movimentos (damp/lerp com delta) — movimento brusco é o que mais deixa site 3D com cara amadora.

## 11. Shaders

- Use `ShaderMaterial` (vanilla) ou `shaderMaterial` do Drei (R3F) com uniforms `uTime`, `uMouse`, `uResolution`.
- Guarde GLSL em arquivos `.glsl` (plugin `vite-plugin-glsl`) para organização.
- Para partículas, use `Points` + shader com tamanho atenuado e cor via atributo; milhares de partículas em shader são baratas, em objetos separados não.

## 12. Checklist antes de entregar

- [ ] Roda a 60 fps em desktop médio e aceitável em celular intermediário
- [ ] Peso total dos assets 3D razoável, modelos comprimidos
- [ ] Loader com progresso e transição de entrada
- [ ] Resize funciona, sem distorção
- [ ] Fallback sem WebGL e versão leve no mobile
- [ ] `prefers-reduced-motion` respeitado
- [ ] Texto e CTAs em HTML, com bom contraste
- [ ] Sem vazamento de memória ao trocar de página/rota (dispose)
- [ ] Sem erros/avisos no console
