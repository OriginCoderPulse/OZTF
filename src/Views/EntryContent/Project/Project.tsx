/// <reference path="./Project.d.ts" />

import { defineComponent, onMounted } from "vue";
import { motion } from "motion-v";
import Developer from "@/Views/EntryContent/Project/Utils/Developer/Developer.tsx";
import "./Project.scss";
import Operations from "./Utils/Operations/Operations";
import UI from "./Utils/UI/UI";
import { ProjectController } from "./Project.controller.ts";

export default defineComponent({
  name: "Project",
  props: {
    projectId: {
      type: [String, Number, null],
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    roleTitle: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const controller = new ProjectController(props);

    onMounted(() => {
      controller.init();
    });

    const motionProps = {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.4, ease: "easeInOut" },
    };

    const renderContent = () => {
      const roleConfig: Record<string, any> = {
        Manager: {
          component: (
            <Developer
              projectId={props.projectId}
              isOverdue={props.isOverdue}
              projectRole={controller.projectRole.value}
              globalPermission={controller.globalPermission.value}
            />
          ),
        },
        Ops: {
          component: <Operations projectId={props.projectId} />,
        },
        UI: {
          component: (
            <UI
              projectId={props.projectId}
              projectName={props.projectName}
              roleTitle={props.roleTitle}
            />
          ),
        },
      };

      const config = roleConfig[props.roleTitle];
      if (!config) return null;

      return (
        <motion.div key={props.roleTitle.toLowerCase()} {...motionProps} class="project-content">
          {config.component}
        </motion.div>
      );
    };

    return () => <div class="project">{renderContent()}</div>;
  },
});
