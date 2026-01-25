import { ref, computed, watch } from "vue";
import { projectConfig } from "./Developer.config.ts";
import { invoke } from "@tauri-apps/api/core";
import OperationAdd from "@/Views/EntryContent/Project/Utils/Developer/OperationAdd/OperationAdd.tsx";
import BugAdd from "@/Views/EntryContent/Project/Utils/Developer/BugAdd/BugAdd.tsx";

export class DeveloperController {
  public projectDetail = ref<ProjectDetail>({} as ProjectDetail);
  public exportingFeatures = ref(false);

  public featureList = ref<FeatureData[]>([]);
  public bugList = ref<BugData[]>([]);
  public activeTab = ref<"features" | "bugs">("features");

  public featureCurrentPage = ref(1);
  public featureTotal = ref(0);
  public bugCurrentPage = ref(1);
  public bugTotal = ref(0);

  public requestComplete = ref(false);

  constructor(
    private props: {
      projectId: string | number | null;
      isOverdue: boolean;
      projectRole: "M" | "D";
      globalPermission: string;
      projectFeatureRole: "M" | "D";
      projectQARole: "M" | "D";
    }
  ) {
    // 监听页码变化
    watch(this.featureCurrentPage, (newPage, oldPage) => {
      this.fetchFeatureList(newPage, oldPage);
    });

    watch(this.bugCurrentPage, (newPage, oldPage) => {
      this.fetchBugList(newPage, oldPage);
    });

    // 监听 projectId 变化
    watch(
      () => this.props.projectId,
      (newId) => {
        if (newId) {
          this.fetchProjectData();
        } else {
          this.projectDetail.value = {} as ProjectDetail;
        }
      }
    );
  }

  /**
   * 获取项目数据
   */
  public fetchProjectData() {
    if (!this.props.projectId) return;
    this.requestComplete.value = false;
    $token.getUserId().then((userID: string) => {
      const requests = [
        {
          urlKey: "projectDetail",
          params: {
            project_id: this.props.projectId,
            user_id: userID,
          },
          successCallback: (data: any) => {
            this.projectDetail.value = data;
          },
          failCallback: (error: any) => {
            $message.error({ message: error });
          },
        },
        {
          urlKey: "featureList",
          params: {
            project_id: this.props.projectId,
            user_id: userID,
            page: 1,
          },
          successCallback: (data: any) => {
            this.featureList.value = data.features || [];
            this.featureTotal.value = data.total || 0;
          },
          failCallback: (error: any) => {
            $message.error({ message: error });
          },
        },
        {
          urlKey: "bugList",
          params: {
            project_id: this.props.projectId,
            user_id: userID,
            page: 1,
          },
          successCallback: (data: any) => {
            this.bugList.value = data.bugs || [];
            this.bugTotal.value = data.total || 0;
          },
          failCallback: (error: any) => {
            $message.error({ message: error });
          },
        },
      ];

      $network.batchRequest(requests).then((results) => {
        const failedRequests = results.filter((result) => result.status === "rejected");
        if (failedRequests.length > 0) {
          return;
        }
        this.requestComplete.value = true;
      });
    });
  }

  /**
   * 获取功能列表
   */
  public fetchFeatureList(page = 1, old?: number) {
    if (!this.props.projectId) return;

    $token.getUserId().then((userID: string) => {
      $network.request(
        "featureList",
        {
          project_id: this.props.projectId,
          user_id: userID,
          page: page,
        },
        (data: any) => {
          this.featureList.value = data.features || [];
          this.featureTotal.value = data.total || 0;
        },
        (error: any) => {
          $message.error({ message: error });
          if (old) this.featureCurrentPage.value = old;
        }
      );
    });
  }

  /**
   * 获取Bug列表
   */
  public fetchBugList(page = 1, old?: number) {
    if (!this.props.projectId) return;

    $token.getUserId().then((userID: string) => {
      $network.request(
        "bugList",
        {
          project_id: this.props.projectId,
          user_id: userID,
          page: page,
        },
        (data: any) => {
          this.bugList.value = data.bugs || [];
          this.bugTotal.value = data.total || 0;
        },
        (error: any) => {
          $message.error({ message: error });
          if (old) this.bugCurrentPage.value = old;
        }
      );
    });
  }

  /**
   * 获取状态颜色
   */
  public getStatusColor(status: string) {
    return projectConfig.status[status]?.color || "#737373";
  }

  /**
   * 获取优先级颜色
   */
  public getPriorityColor(priority: string) {
    return projectConfig.priority[priority]?.color || "#737373";
  }

  /**
   * 获取功能状态颜色
   */
  public getFeatureStatusColor(status: string) {
    return projectConfig.featureStatus[status]?.color || "#737373";
  }

  /**
   * 获取Bug状态颜色
   */
  public getBugStatusColor(status: string) {
    return projectConfig.bugStatus[status]?.color || "#737373";
  }

  /**
   * 获取严重程度颜色
   */
  public getSeverityColor(severity: string) {
    return projectConfig.severity[severity]?.color || "#737373";
  }

  /**
   * 切换标签页
   */
  public switchTab(tab: "features" | "bugs") {
    this.activeTab.value = tab;
  }

  /**
   * 处理Bug详情
   */
  public handleBugDetail() {}

  /**
   * 处理功能详情
   */
  public handleFeatureDetail() {}

  /**
   * 从 projectDetail 或 props 中获取角色
   */
  public projectFeatureRole = computed(() => {
    return (
      (this.projectDetail.value as any)?.project_feature_role ||
      this.props.projectFeatureRole ||
      "D"
    );
  });

  public projectQARole = computed(() => {
    return (this.projectDetail.value as any)?.project_qa_role || this.props.projectQARole || "D";
  });

  public canShowFeatOperator = computed(() => {
    // projectFeatureRole 为 M 或者全局权限为 CEO 则为 true，否则为 false
    return this.projectFeatureRole.value === "M" || this.props.globalPermission === "CEO";
  });

  public canShowBugOperator = computed(() => {
    return this.projectQARole.value === "M" || this.props.globalPermission === "CEO";
  });

  public canManageMembers = computed(() => {
    if (!this.projectDetail.value?.user_role) return false;
    const userRole = this.projectDetail.value.user_role;
    return userRole === "Super" || userRole === "Manager";
  });

  /**
   * 添加功能
   */
  public handleAddFeature() {
    $popup.popup({}, { component: OperationAdd, props: {} });
  }

  /**
   * 导出功能列表
   */
  public async handleExportFeatures() {
    if (!this.props.projectId) {
      return;
    }

    if (this.exportingFeatures.value) {
      return;
    }

    this.exportingFeatures.value = true;

    const timeoutId = setTimeout(
      () => {
        if (this.exportingFeatures.value) {
          $message.warning({ message: "导出操作超时，请重试" });
          this.exportingFeatures.value = false;
        }
      },
      5 * 60 * 1000
    );

    try {
      const baseUrl = "http://localhost:1024/oztf/api/v1";
      const response = await fetch(`${baseUrl}/project/feature/export`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: this.props.projectId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 获取文件名（从响应头或默认名称）
      const contentDisposition = response.headers.get("Content-Disposition");
      let fileName = `Project_${this.projectDetail.value?.name || "unknown"}_功能列表.xlsx`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ""));
        }
      }

      // 将响应转换为 ArrayBuffer
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = Array.from(new Uint8Array(arrayBuffer));

      // 使用 Tauri 命令保存文件到下载目录
      const filePath = await invoke<string>("save_file_to_downloads", {
        fileData: uint8Array,
        fileName: fileName,
      });

      clearTimeout(timeoutId);
      $message.success({
        message: `已保存到: ${filePath}`,
      });
      this.exportingFeatures.value = false;
    } catch (error: any) {
      clearTimeout(timeoutId);
      $message.error({ message: error.message || "导出失败,请再次尝试..." });
      this.exportingFeatures.value = false;
    }
  }

  /**
   * 添加Bug
   */
  public handleAddBug() {
    $popup.popup({}, { component: BugAdd, props: {} });
  }

  /**
   * 移除成员
   */
  public handleRemoveMember(staffId: string) {
    $message.info({ message: `已移除成员 ${staffId}` });
  }

  /**
   * 准备成员列表数据
   */
  public membersTableData = computed(() => {
    return (this.projectDetail.value?.members || []).map((member: ProjectMember) => ({
      name: member.name,
      occupation: member.occupation,
      role: member.role,
      _raw: member,
    }));
  });

  /**
   * 检查项目是否延期
   */
  public isProjectOverdue = computed(() => {
    if (!this.projectDetail.value?.end_date) return false;

    const endDate = new Date(this.projectDetail.value.end_date);
    const currentDate = new Date();

    // 如果项目状态是已完成，则不显示延期
    if (this.projectDetail.value.status === "Completed") return false;

    return endDate < currentDate;
  });

  /**
   * 初始化
   */
  public init() {
    if (this.props.projectId) {
      this.fetchProjectData();
    }
  }
}
