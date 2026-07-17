# Arctic Transform

一个使用同一批实例化冰块完成“冰屋 → 产品 → 月亮 → 极光”连续变形的沉浸式 3D 滚动网页。

## 技术栈

- Three.js：场景、实例化冰块、灯光、粒子与后处理
- GSAP + ScrollTrigger：滚动进度与视觉时间轴同步
- Lenis：平滑滚动
- Vite：开发与构建
- GLSL Shader：极光丝带

## 已实现

- 程序化冰屋、智能音箱、桌面灯、相机与冰晶月亮
- 同一批 `InstancedMesh` 在多个目标形态之间插值
- 确定性散开轨迹，支持向上滚动完整逆向播放
- 动态极光 Shader、雪花、星空、冰原与远山
- 月亮核心光、轮廓辉光与 Bloom 后处理
- 鼠标视差、镜头轨迹、呼吸动画与阶段文案
- 移动端自动降低实例数量与后处理强度
- `prefers-reduced-motion` 降级支持
- 页面失焦暂停渲染

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，通常是 `http://localhost:5173`。

## 生产构建

```bash
npm run build
npm run preview
```

构建结果位于 `dist/`。

## 目录

```text
arctic-transform-web/
├─ index.html
├─ package.json
├─ README.md
└─ src/
   ├─ main.js          # 场景、滚动时间轴、形态插值、镜头与渲染循环
   ├─ shapes.js        # 冰屋、产品、散开状态与月亮坐标生成器
   ├─ environment.js   # 极光、雪花、星空、远山与辉光纹理
   └─ styles.css       # 沉浸式界面、文案与响应式样式
```

## 调整建议

- 修改 `ICE_COUNT` 可控制冰块密度与性能。
- 修改 `keyframes` 中的 `at` 可调整各形态在滚动时间轴中的节奏。
- 修改 `createSpeakerState`、`createLampState`、`createCameraState` 可增加产品细节。
- 如果投入正式制作，可将程序化产品坐标替换为从 GLTF 网格表面采样得到的坐标，但保持实例索引不变。
