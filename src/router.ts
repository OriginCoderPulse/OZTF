import { createRouter, createWebHistory } from "vue-router";
import MeetRoom from "@/Views/EntryContent/Meet/MeetRoom/MeetRoom.tsx";
import Main from "@/Views/Main.tsx";

const routes = [
  {
    path: "/",
    name: "Main",
    component: Main,
    props: true,
  },
  {
    path: "/meet-room/:roomId",
    name: "MeetRoom",
    component: MeetRoom,
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
