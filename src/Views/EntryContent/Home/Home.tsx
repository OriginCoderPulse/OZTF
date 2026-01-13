import { defineComponent, onMounted, ref } from "vue";
import SuperHome from "./Permission/Super/SuperHome.tsx";
import RMDHome from "./Permission/RMD/RMDHome.tsx";
import DeveloperHome from "./Permission/Developer/DeveloperHome.tsx";
import "./Home.scss";

export default defineComponent({
  name: "Home",
  props: {},
  setup() {
    const permissionHome = {
      Super: <SuperHome />,
      RMD: <RMDHome />,
      Dev: <DeveloperHome />,
    };
    const permission = ref("");

    onMounted(() => {
      $storage.get("permission").then((res) => {
        permission.value = res;
      });
    });

    return () => (
      <div className="home">
        {permissionHome[permission.value as keyof typeof permissionHome]}
      </div>
    );
  },
});
