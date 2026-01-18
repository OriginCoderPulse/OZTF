import { ref } from "vue";

export class EntryContentController {
  public tabName = ref<string>("Home");
  public projectId = ref<string | null>(null);
  public isProjectOverdue = ref<boolean>(false);
  public projectRoleTitle = ref<string>("");
  public projectName = ref<string>("");

  /**
   * 初始化 - 在组件 onMounted 时调用
   */
  public init() {
    $event.on("changeTab", (tab: string) => {
      this.projectId.value = null;
      this.tabName.value = tab;
    });

    $event.on(
      "changeProject",
      (project: string, isOverdue?: boolean, roleTitle?: string, name?: string) => {
        this.tabName.value = "";
        this.projectId.value = project;
        this.isProjectOverdue.value = isOverdue || false;
        this.projectRoleTitle.value = roleTitle || "";
        this.projectName.value = name || "";
      }
    );
  }
}
