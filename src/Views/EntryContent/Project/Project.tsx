/// <reference path="./Project.d.ts" />

import { defineComponent } from "vue";
import { motion } from "motion-v";
import Developer from "@/Views/EntryContent/Project/Permission/Developer/Developer.tsx";
import "./Project.scss";
import Operations from "./Permission/Operations/Operations";
import UI from "./Permission/UI/UI";

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
    return () => (
      <div class="project">
        {props.roleTitle === "Manager" && (
          <motion.div
            key="manager"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            class="project-content"
          >
            <Developer
              projectId={props.projectId}
              isOverdue={props.isOverdue}
            />
          </motion.div>
        )}
        {props.roleTitle === "Ops" && (
          <motion.div
            key="ops"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            class="project-content"
          >
            <Operations projectId={props.projectId} />
          </motion.div>
        )}
        {props.roleTitle === "UI" && (
          <motion.div
            key="ui"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            class="project-content"
          >
            <UI
              projectId={props.projectId}
              projectName={props.projectName}
              roleTitle={props.roleTitle}
            />
          </motion.div>
        )}
      </div>
    );
  },
});
