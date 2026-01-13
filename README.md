# 项目快速上手文档

## 一、项目概述

本项目是一个基于 Vue 的前端应用，集成了多种功能模块，如项目管理、人员管理、财务管理、视频播放等。项目使用了 Vite 作为构建工具，同时引入了一些自定义的全局工具和组件，以实现弹窗、网络请求、事件总线、定时器和消息提示等功能。

## 二、项目结构

项目的主要目录结构如下：

```bash
src
├── App.vue
├── .DS_Store
├── global.d.ts
├── vite-env.d.ts
├── main.ts
├── Views
├── Assets
└── Components
```

- `App.vue`：项目的根组件。
- `main.ts`：项目的入口文件，负责初始化 Vue 应用并挂载全局工具。
- `Utils`：存放项目的工具函数和插件，如网络请求、定时器、事件总线等。
- `Views`：存放项目的视图组件，如项目详情页、主页、仪表盘等。
- `Assets`：存放项目的静态资源，如图片、图标等。
- `Components`：存放项目的通用组件，如消息提示框、弹窗等。

## 三、环境准备

在开始项目之前，确保你已经安装了以下环境：

- Node.js（版本建议 14.x 及以上）
- pnpm

## 四、项目启动

1. **克隆项目代码**

```bash
git clone <项目仓库地址>
cd <项目目录>
```

1. **安装依赖**

```bash
pnpm install
```

1. **启动开发服务器**

```bash
pnpm dev
```

启动成功后，打开浏览器访问 `http://localhost:1420` 即可看到项目界面。

## 五、主要功能模块及使用方法

### 1. 网络请求

项目中使用 `$network` 工具进行网络请求，示例代码如下：

```typescript

$network.request("info", "GET", {}, (data) => {
    // 请求成功回调
    console.log(data);
}, (error) => {
    // 请求失败回调
    $message.error({
        message: error,
    });
});
```

- `urlKey`：请求的接口名称，对应 `$config.urls` 的键值，详情见Utils/GlobalConfig.ts。
- `params`：请求参数。
- `successCallBack`：请求成功的回调函数。
- `faildCallBack`：请求失败的回调函数。

### 2. 事件总线

项目中使用 `$event` 工具进行全局事件推送，示例代码如下：

```typescript
$event.emit("event_name", argumnts)

$event.on("event_name", cb)

// 取消监听
$event.off("event_name")
```

- `on`：订阅事件，接受事件名称和回调函数作为参数。
- `emit`：发布事件，接受事件名称和可选的参数作为参数。
- `off`：取消订阅事件，接受事件名称和可选的回调函数作为参数。

### 3. 定时器

项目中使用 `$timer` 工具实现延迟执行和定时执行任务，示例代码如下：

```typescript
// 延迟执行任务
const clear = $timer.delay("eventName", () => {
    console.log("延迟任务执行");
}, 2000);

// 定时执行任务
const clear = $timer.regular("eventName", () => {
    console.log("定时任务执行");
}, 3000);

// 清除任务
clear()
```

- `delay`：延迟执行任务，接受事件名称、回调函数和延迟时间作为参数，返回清理任务方法。
- `regular`：定时执行任务，接受事件名称、回调函数和间隔时间作为参数，返回清理任务方法。
- `clear`：清除任务。

> 注意：非必要情况下不要调用clear方法，定时任务会在组件卸载后自动清理，延迟任务会在任务结束后立即清理

### 4. 消息提示

项目中使用 `$message` 工具显示消息提示框，示例代码如下：

```typescript
// 显示信息提示
$message.info({
    message: "这是一条信息提示",
    duration: 3000 // 可选，提示框显示时间，默认 2000ms
});

// 显示错误提示
$message.error({
    message: "这是一条错误提示",
    duration: 3000
});

// 显示警告提示
$message.warning({
    message: "这是一条警告提示",
    duration: 3000
});

// 显示成功提示
$message.success({
    message: "这是一条成功提示",
    duration: 3000
});
```

### 5. 弹窗

项目中使用 `$popup` 工具打开弹窗，示例代码如下：

```vue
<script lang="ts" setup>
import SomeComponent from './SomeComponent.vue';

const popup_id = $popup.popup(
    { padding: '10px' }, 
    { 
        component: SomeComponent, 
        props: { someProp: 'value' } 
    }
);

$popup.close(props.popup_id)
</script>
```

```vue
// 组件内
...
<script lang="ts" setup>
    const props = defineProps({
        popup_id:string // 默认传递参数
    })

    $popup.close(props.popup_id)
</script>
...
```

```vue
<script lang="ts" setup>
    $popup.alert("这是内容", () => {
        // 确认操作
    }, () => {
        // 取消操作
    },"这是标题")
</script>
```

- `popup`：打开普通弹窗，接受弹窗样式和组件信息作为参数，传递并返回弹窗的唯一标识。
- `alert`：打开提示框弹窗，接受取消/确认回调以及标题[可选参数]和内容作为参数。
- `close`：关闭弹窗，接受弹窗的唯一标识作为参数(仅针对于普通弹窗)。

## 六、常见问题及解决方法

### 1. 请求插件未安装

如果在进行网络请求时出现 `Request Pluggin Is Not Installed !` 错误，可能是 `$network` 插件未正确初始化。检查 `main.ts` 文件中是否正确引入和使用了 `Network` 插件。

### 2. 无权限请求接口

如果在进行网络请求时出现 `No permission to request this interface !` 错误，可能是当前用户的权限不足。检查 `$config.permission` 和 `$config.urls` 中的权限配置。

### 3. 事件重复注册

如果在使用定时器时出现 `The event already exists!` 错误，可能是事件已经被注册。在注册事件之前，确保事件名称唯一。

## 七、总结

通过以上步骤，你可以快速上手本项目，并开始进行开发和调试。如果在使用过程中遇到其他问题，请参考项目代码或联系项目维护人员。
