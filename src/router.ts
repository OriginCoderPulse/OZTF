import { createRouter, createWebHistory } from "vue-router";
import MeetRoom from "@/Views/EntryContent/Meet/MeetRoom/MeetRoom.tsx";
import Main from "@/Views/Main.tsx";
import Login from "@/Views/Login.tsx";


const routes = [
  {
    path: "/",
    name: "Login",
    component: Login,
    props: true,
    meta: { requiresAuth: false },
  },
  {
    path: "/main",
    name: "Main",
    component: Main,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/meet-room/:roomId",
    name: "MeetRoom",
    component: MeetRoom,
    props: true,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：检查登录状态
router.beforeEach(async (to, _from, next) => {
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    try {
      // 使用authorization token（永久有效）作为登录凭证
      const authorization = await $storage.get("authorization");
      if (!authorization || authorization.trim() === "") {
        // 没有authorization token，跳转到登录页
        next({ name: "Login" });
      } else {
        // 有authorization token，允许访问
        next();
      }
    } catch (error) {
      // 获取存储失败，跳转到登录页
      next({ name: "Login" });
    }
  } else {
    // 不需要认证的页面，直接放行
    next();
  }
});

export default router;
