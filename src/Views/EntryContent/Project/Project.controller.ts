import { ref, watch } from "vue";

export class ProjectController {
  public projectRole = ref<"M" | "D">("D");
  public globalPermission = ref<string>("");

  constructor(
    private props: {
      projectId: string | number | null;
      projectName: string;
      isOverdue: boolean;
      roleTitle: string;
    }
  ) {
    this.initWatchers();
  }

  /**
   * 初始化监听器
   */
  private initWatchers() {
    watch(
      () => this.props.projectId,
      () => {
        if (this.props.projectId) {
          this.fetchProjectRole();
        }
      }
    );
  }

  /**
   * 获取项目角色
   */
  public fetchProjectRole() {
    if (!this.props.projectId) return;

    $token.getUserId().then((userID: string) => {
      $network.request(
        "projectGetRole",
        {
          uid: userID,
          project_id: this.props.projectId,
        },
        (data: any) => {
          this.projectRole.value = data.projectRole || "D";
        },
        (error: any) => {
          this.projectRole.value = "D";
        }
      );
    });
  }

  /**
   * 获取全局权限
   */
  public fetchGlobalPermission() {
    $token.getPermission().then((permission: string) => {
      this.globalPermission.value = permission || "";
    });
  }

  /**
   * 初始化 - 在组件 onMounted 时调用
   */
  public init() {
    this.fetchProjectRole();
    this.fetchGlobalPermission();
  }
}
