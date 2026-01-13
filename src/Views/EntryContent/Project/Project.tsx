/// <reference path="./Project.d.ts" />

import { defineComponent, ref, onMounted, watch } from "vue";
import { motion } from "motion-v";
import Developer from "@/Views/EntryContent/Project/Utils/Developer/Developer.tsx";
import "./Project.scss";
import Operations from "./Utils/Operations/Operations";
import UI from "./Utils/UI/UI";

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
    const projectRole = ref<"M" | "D">("D");
    const globalPermission = ref<string>("");

    const fetchProjectRole = () => {
      if (!props.projectId) return;

      $storage.get("userID").then((userID: string) => {
        $network.request(
          "projectGetRole",
          {
            uid: userID,
            project_id: props.projectId,
          },
          (data: any) => {
            projectRole.value = data.projectRole || "D";
          },
          (error: any) => {
            console.error("获取项目角色失败:", error);
            projectRole.value = "D";
          },
        );
      });
    };

    const fetchGlobalPermission = () => {
      $storage.get("permission").then((permission: string) => {
        globalPermission.value = permission || "";
      });
    };

    onMounted(() => {
      fetchProjectRole();
      fetchGlobalPermission();
    });

    watch(
      () => props.projectId,
      () => {
        if (props.projectId) {
          fetchProjectRole();
        }
      },
    );

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
              projectRole={projectRole.value}
              globalPermission={globalPermission.value}
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
        <motion.div
          key={props.roleTitle.toLowerCase()}
          {...motionProps}
          class="project-content"
        >
          {config.component}
        </motion.div>
      );
    };

    return () => <div class="project">{renderContent()}</div>;
  },
});
