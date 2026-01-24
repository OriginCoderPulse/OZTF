import { createRouter, createWebHistory } from "vue-router";
import MeetRoom from "@/Views/EntryContent/Meet/MeetRoom/MeetRoom.tsx";
import Main from "@/Views/Main.tsx";
import Login from "@/Views/Login.tsx";
import Middle from "@/middle.tsx";


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
  {
    path: "/middle",
    name: "Middle",
    component: Middle,
    props: true,
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：检查登录状态
router.beforeEach(async (to, from, next) => {
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
    // 如果从main页面返回到login页面
    if (from.name === "Main" && to.name === "Login") {
      // 检查是否有authorization token
      try {
        const authorization = await $storage.get("authorization");
        // 如果没有token，说明已经主动退出登录，允许跳转
        if (!authorization || authorization.trim() === "") {
          next();
          return;
        }
        // 如果有token，可能是浏览器后退操作，阻止返回并重定向到main
        // 但考虑到主动退出登录时可能存在时序问题（token还未完全移除），
        // 我们允许跳转，Login页面会检查token并显示相应的界面
        next();
        return;
      } catch (error) {
        // 获取存储失败，允许访问登录页
      }
    }
    // 不需要认证的页面，直接放行
    next();
  }
});

export default router;
