import { defineComponent, Fragment, onMounted, ref } from "vue";
import "./EntryContent.scss";
import Home from "./Home/Home.tsx";
import DashBoard from "./DashBoard/DashBoard";
import Project from "./Project/Project";
import Staff from "./Staff/Staff";
import Finance from "./Finance/Finance";
import Video from "./Video/Video";
import { motion } from "motion-v";
import Meet from "@/Views/EntryContent/Meet/Meet.tsx";

export default defineComponent({
  name: "EntryContent",
  setup() {
    const tabName = ref<string>("Home");
    const projectId = ref<string | null>(null);
    const isProjectOverdue = ref<boolean>(false);
    const projectRoleTitle = ref<string>("");
    const projectName = ref<string>("");

    onMounted(() => {
      $event.on("changeTab", (tab: string) => {
        projectId.value = null;
        tabName.value = tab;
      });

      $event.on(
        "changeProject",
        (
          project: string,
          isOverdue?: boolean,
          roleTitle?: string,
          name?: string,
        ) => {
          tabName.value = "";
          projectId.value = project;
          isProjectOverdue.value = isOverdue || false;
          projectRoleTitle.value = roleTitle || "";
          projectName.value = name || "";
        },
      );
    });

    return () => (
      <Fragment>
        {tabName.value && (
          <motion.div
            class="entry-content"
            key={tabName.value}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            {tabName.value === "Home" && <Home />}
            {tabName.value === "Staff" && <Staff />}
            {tabName.value === "Finance" && <Finance />}
            {tabName.value === "Video" && <Video />}
            {tabName.value === "DashBoard" && <DashBoard />}
            {tabName.value === "Meet" && <Meet />}
          </motion.div>
        )}

        <motion.div
          class="entry-content"
          key={projectId.value}
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -10, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {projectId.value !== null && (
            <Project
              projectId={projectId.value}
              isOverdue={isProjectOverdue.value}
              roleTitle={projectRoleTitle.value}
              projectName={projectName.value}
            />
          )}
        </motion.div>
      </Fragment>
    );
  },
});
