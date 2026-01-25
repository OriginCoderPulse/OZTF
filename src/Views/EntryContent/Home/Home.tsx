import { defineComponent, onMounted } from "vue";
import CEOHome from "./Permission/CEO/CEOHome.tsx";
import RMDHome from "./Permission/RMD/RMDHome.tsx";
import DeveloperHome from "./Permission/Developer/DeveloperHome.tsx";
import "./Home.scss";
import { HomeController } from "./Home.controller.ts";

export default defineComponent({
  name: "Home",
  props: {},
  setup() {
    const controller = new HomeController();

    onMounted(() => {
      controller.init();
    });

    const permissionHome = {
      CEO: <CEOHome />,
      RMD: <RMDHome />,
      Dev: <DeveloperHome />,
    };

    return () => (
      <div className="home">
        {permissionHome[controller.permission.value as keyof typeof permissionHome]}
      </div>
    );
  },
});
