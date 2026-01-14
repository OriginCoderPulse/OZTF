import { defineComponent, Fragment, onMounted } from "vue";
import "./EntryContent.scss";
import Home from "./Home/Home.tsx";
import DashBoard from "./DashBoard/DashBoard";
import Project from "./Project/Project";
import Staff from "./Staff/Staff";
import Finance from "./Finance/Finance";
import Video from "./Video/Video";
import { motion } from "motion-v";
import Meet from "@/Views/EntryContent/Meet/Meet.tsx";
import { EntryContentController } from "./EntryContent.controller.ts";

export default defineComponent({
  name: "EntryContent",
  setup() {
    const controller = new EntryContentController();

    onMounted(() => {
      controller.init();
    });

    return () => (
      <Fragment>
        {controller.tabName.value && (
          <motion.div
            class="entry-content"
            key={controller.tabName.value}
            initial={{ x: 10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -10, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            {controller.tabName.value === "Home" && <Home />}
            {controller.tabName.value === "Staff" && <Staff />}
            {controller.tabName.value === "Finance" && <Finance />}
            {controller.tabName.value === "Video" && <Video />}
            {controller.tabName.value === "DashBoard" && <DashBoard />}
            {controller.tabName.value === "Meet" && <Meet />}
          </motion.div>
        )}

        <motion.div
          class="entry-content"
          key={controller.projectId.value}
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -10, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
        >
          {controller.projectId.value !== null && (
            <Project
              projectId={controller.projectId.value}
              isOverdue={controller.isProjectOverdue.value}
              roleTitle={controller.projectRoleTitle.value}
              projectName={controller.projectName.value}
            />
          )}
        </motion.div>
      </Fragment>
    );
  },
});
