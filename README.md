# OZTF 企业管理系统

基于 Vue 3 + TypeScript + Tauri 的跨平台桌面应用，提供项目管理、人员管理、财务管理、视频会议等企业级功能。

## 📋 目录

- [项目概述](#项目概述)
- [功能模块](#功能模块)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [全局工具使用](#全局工具使用)
- [常见问题](#常见问题)

## 项目概述

OZTF 是一个企业级管理系统桌面应用，采用 Tauri 框架构建，支持 Windows、macOS、Linux 多平台。系统集成了项目管理、人员管理、财务管理、视频会议、视频播放等核心业务模块，为企业提供全方位的管理解决方案。

## 功能模块

### 1. 仪表盘 (Dashboard)
- 数据概览
- 统计图表
- 快速入口

### 2. 项目管理 (Project)
- 项目列表查看
- 项目详情管理
- 项目创建和编辑
- 项目成员管理
- 功能管理（Feature）
- Bug 管理
- 开发人员管理
- 项目进度跟踪

### 3. 人员管理 (Staff)
- 员工信息管理
- 员工详情查看
- 部门管理
- 员工状态管理
- 部门统计
- 薪资统计

### 4. 财务管理 (Finance)
- 财务数据查看
- 财务报表
- 财务统计

### 5. 视频会议 (Meet)
- 会议创建
- 会议加入
- 实时音视频通话
- 屏幕共享
- 参会人管理
- 会议状态管理

### 6. 视频播放 (Video)
- 视频列表
- 视频播放
- 历史记录
- 大屏播放

### 7. 其他功能
- Excalidraw 绘图集成
- PDF 预览
- 图表展示（ECharts）
- 表格组件
- 表单构建器

## 技术栈

### 前端框架
- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript 5.6** - 类型安全的 JavaScript 超集
- **TSX** - JSX 的 TypeScript 版本
- **Vue Router 4.5** - 官方路由管理器

### 桌面框架
- **Tauri 2.x** - 轻量级桌面应用框架
- **Rust** - 后端运行时（Tauri 使用）

### 构建工具
- **Vite 6.0** - 下一代前端构建工具
- **vue-tsc** - Vue 3 TypeScript 类型检查

### UI 组件库
- **自定义组件** - 基于 Vue 3 的自定义组件库

### 音视频
- **TRTC SDK v5.15** - 腾讯云实时音视频 SDK

### 工具库
- **axios** - HTTP 客户端
- **echarts** - 数据可视化
- **hls.js** - HLS 视频播放
- **vue-pdf-embed** - PDF 预览
- **@excalidraw/excalidraw** - 绘图工具
- **crypto-js** - 加密工具
- **pako** - 数据压缩
- **motion-v** - Vue 动画库

### 样式处理
- **Sass** - CSS 预处理器

## 快速开始

### 环境要求

- **Node.js** >= 14.x
- **pnpm** >= 7.x（推荐）或 npm >= 6.x
- **Rust** >= 1.70（Tauri 需要）
- **系统依赖**：
  - Windows: Microsoft Visual C++ Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: 系统开发工具链

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 开发模式

```bash
# 启动开发服务器（包含 Tauri 应用）
pnpm app

# 或仅启动 Web 开发服务器
pnpm dev
```

- Web 开发服务器：`http://localhost:1420`
- Tauri 应用会自动启动

### 构建应用

```bash
# 构建生产版本
pnpm build

# 构建 Tauri 应用
pnpm tauri build
```

构建产物：
- Web 版本：`dist/` 目录
- Tauri 应用：`src-tauri/target/release/` 目录

### 预览构建

```bash
pnpm preview
```

## 项目结构

```
OZTF/
├── src/                      # 源代码目录
│   ├── Components/          # 通用组件
│   │   ├── Alert/          # 警告提示
│   │   ├── AnimationNumberText/  # 数字动画
│   │   ├── Drawer/         # 抽屉组件
│   │   ├── Echarts/        # 图表组件
│   │   ├── Excalidraw/     # 绘图组件
│   │   ├── FormBuilder/    # 表单构建器
│   │   │   ├── Date/       # 日期选择器
│   │   │   ├── Input/      # 输入框
│   │   │   ├── Radio/      # 单选框
│   │   │   ├── Selector/   # 选择器
│   │   │   └── TextArea/   # 文本域
│   │   ├── Message/        # 消息提示
│   │   ├── Paginition/     # 分页组件
│   │   ├── Popup/          # 弹窗组件
│   │   ├── PreviewPDF/     # PDF 预览
│   │   ├── Svg/            # SVG 图标
│   │   ├── Table/          # 表格组件
│   │   └── VideoPlayer/    # 视频播放器
│   ├── Views/              # 页面视图
│   │   ├── Main.tsx       # 主布局
│   │   ├── Tab/           # 标签页组件
│   │   └── EntryContent/   # 内容页面
│   │       ├── DashBoard/  # 仪表盘
│   │       ├── Project/    # 项目管理
│   │       ├── Staff/      # 人员管理
│   │       ├── Finance/    # 财务管理
│   │       ├── Meet/       # 视频会议
│   │       └── Video/      # 视频播放
│   ├── Utils/              # 工具函数
│   │   ├── Network.ts     # 网络请求
│   │   ├── MessageHook.ts # 消息钩子
│   │   ├── PopupHook.ts   # 弹窗钩子
│   │   ├── EventBus.ts    # 事件总线
│   │   ├── Timer.ts       # 定时器
│   │   ├── Storage.ts     # 存储工具
│   │   ├── GlobalConfig.ts # 全局配置
│   │   ├── IconPath.ts    # 图标路径
│   │   ├── Date.ts        # 日期工具
│   │   ├── HighFrequencyControl.ts # 高频控制
│   │   └── Meet/          # 会议工具
│   │       ├── TRTC.ts    # TRTC SDK 封装
│   │       ├── LibGenerateTestUserSig.ts # UserSig 生成
│   │       └── RoomFormat.ts # 房间格式化
│   ├── App.tsx             # 根组件
│   ├── App.scss            # 全局样式
│   ├── main.ts             # 应用入口
│   ├── router.ts           # 路由配置
│   ├── global.d.ts         # 全局类型定义
│   └── vite-env.d.ts       # Vite 类型定义
├── src-tauri/              # Tauri 后端
│   ├── src/               # Rust 源代码
│   │   ├── main.rs       # 主入口
│   │   └── lib.rs        # 库文件
│   ├── Cargo.toml        # Rust 依赖配置
│   ├── tauri.conf.json   # Tauri 配置
│   └── icons/            # 应用图标
├── public/                # 静态资源
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── README.md             # 项目文档
```

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 Vue 3 Composition API 最佳实践
- 组件使用 TSX 语法
- 样式使用 SCSS 预处理器
- 遵循 ESLint 规则

### 路由配置

路由定义在 `src/router.ts`：

```typescript
{
  path: '/project',
  name: 'Project',
  component: () => import('./Views/EntryContent/Project/Project.tsx')
}
```

### 组件开发

#### 创建新组件

```tsx
import { defineComponent } from "vue";
import "./Component.scss";

export default defineComponent({
  name: "ComponentName",
  setup() {
    return () => (
      <div class="component">
        {/* 组件内容 */}
      </div>
    );
  },
});
```

#### 使用 Controller 模式

```typescript
// Component.controller.ts
export class ComponentController {
  public state = ref(false);
  
  public toggle() {
    this.state.value = !this.state.value;
  }
}

// Component.tsx
const controller = new ComponentController();
```

## 全局工具使用

### 1. 网络请求 ($network)

```typescript
$network.request(
  "apiKey",           // 接口键名（对应 GlobalConfig.ts 中的配置）
  { param: "value" }, // 请求参数
  (data) => {         // 成功回调
    console.log(data);
  },
  (error) => {        // 失败回调
    $message.error({ message: error });
  }
);
```

**配置位置**：`src/Utils/GlobalConfig.ts`

### 2. 消息提示 ($message)

```typescript
// 成功提示
$message.success({
  message: "操作成功",
  duration: 3000  // 可选，默认 2000ms
});

// 错误提示
$message.error({
  message: "操作失败"
});

// 警告提示
$message.warning({
  message: "请注意"
});

// 信息提示
$message.info({
  message: "提示信息"
});
```

### 3. 弹窗 ($popup)

#### 普通弹窗

```tsx
const popupId = $popup.popup(
  { padding: '20px' },  // 样式配置
  {
    component: YourComponent,
    props: { someProp: 'value' }
  }
);

// 关闭弹窗
$popup.close(popupId);
```

#### 确认弹窗

```typescript
$popup.alert(
  "确认要执行此操作吗？",
  {
    buttonCount: 2,
    onBtnRight: () => {
      // 确认操作
    },
    onBtnLeft: () => {
      // 取消操作
    }
  }
);
```

### 4. 事件总线 ($event)

```typescript
// 订阅事件
$event.on("eventName", (data) => {
  console.log(data);
});

// 发布事件
$event.emit("eventName", { data: "value" });

// 取消订阅
$event.off("eventName");
```

### 5. 定时器 ($timer)

```typescript
// 延迟执行
const clearDelay = $timer.delay("taskName", () => {
  console.log("延迟执行");
}, 2000);

// 定时执行
const clearRegular = $timer.regular("taskName", () => {
  console.log("定时执行");
}, 3000);

// 清除任务（通常不需要手动清除，组件卸载时自动清理）
// clearDelay();
// clearRegular();
```

### 6. 存储工具 ($storage)

```typescript
// 设置存储
await $storage.set("key", "value");

// 获取存储
const value = await $storage.get("key");

// 删除存储
await $storage.remove("key");
```

## Tauri API 使用

### 文件操作

```typescript
import { open } from '@tauri-apps/plugin-opener';

// 打开文件
await open('path/to/file.pdf');
```

### 窗口操作

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const window = getCurrentWindow();
await window.minimize();
await window.maximize();
await window.close();
```

## 常见问题

### 1. Tauri 构建失败

**问题**：Rust 编译错误或依赖问题

**解决**：
- 确保 Rust 版本 >= 1.70
- 运行 `cargo clean` 清理构建缓存
- 检查 `src-tauri/Cargo.toml` 依赖配置

### 2. 网络请求失败

**问题**：`Request Plugin Is Not Installed !`

**解决**：
- 检查 `main.ts` 中是否正确引入 Network 插件
- 确认 `GlobalConfig.ts` 中配置了正确的 API 地址

### 3. 权限错误

**问题**：`No permission to request this interface !`

**解决**：
- 检查 `GlobalConfig.ts` 中的权限配置
- 确认用户角色有相应权限

### 4. 事件重复注册

**问题**：`The event already exists!`

**解决**：
- 确保事件名称唯一
- 在组件卸载时取消事件订阅

### 5. TRTC 连接失败

**问题**：WebSocket 连接失败

**解决**：
- 检查 TRTC 配置是否正确
- 确认网络连接正常
- 检查防火墙设置

## 构建和发布

### 开发构建

```bash
pnpm build
```

### Tauri 应用构建

```bash
pnpm tauri build
```

构建产物位置：
- Windows: `src-tauri/target/release/oztf.exe`
- macOS: `src-tauri/target/release/bundle/macos/`
- Linux: `src-tauri/target/release/bundle/linux/`

### 环境变量

创建 `.env` 文件（如需要）：

```env
# API 基础地址
VITE_API_BASE_URL=http://localhost:1024

# TRTC 配置
VITE_TRTC_APP_ID=你的TRTC_APP_ID
VITE_TRTC_SECRET_KEY=你的TRTC_SECRET_KEY
```

## 许可证

ISC
