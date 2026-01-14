import { ref, computed, onMounted } from "vue";
import { projectAddConfig } from "./ProjectAdd.config";

export class ProjectAddController {
  // 项目基本信息
  public nameModel = ref("");
  public priorityModel = ref("");
  public managerModel = ref("");

  // 日期范围
  public startDate = ref<string>("");
  public endDate = ref<string>("");
  public dateRange = ref<string[]>(["", ""]);

  // PM选项（用于项目负责人）
  public pmOptions = ref<any[]>([]);
  // 开发人员选项（用于项目参与人）
  public developerOptions = ref<any[]>([]);
  public selectedDevelopers = ref<string[]>([]);
  public participantRoles = ref<{ [key: string]: string }>({});

  // UI状态
  public submitting = ref(false);

  // 计算属性：处理开发人员显示逻辑（超过两个显示+n）
  public selectedDevelopersDisplay = computed(() => {
    if (!this.selectedDevelopers.value || this.selectedDevelopers.value.length === 0) {
      return "选择项目参与人";
    }

    // 获取选中的开发人员名称（从原始列表查找，确保能找到名字）
    const selectedNames = this.selectedDevelopers.value.map((id) => {
      const dev = this.developerOptions.value.find((d: any) => d.id === id);
      return dev ? dev.name : `用户${id}`;
    });

    // 如果超过两个，显示前两个 + 剩余数量
    if (selectedNames.length > 2) {
      const firstTwo = selectedNames.slice(0, 2);
      const remaining = selectedNames.length - 2;
      return `${firstTwo.join(", ")} +${remaining}`;
    }

    return selectedNames.join(", ");
  });

  // 计算属性：参与人表格数据
  public participantTableData = computed(() => {
    return this.selectedDevelopers.value.map((id) => {
      const developer = this.developerOptions.value.find((dev) => dev.id === id);
      return {
        id,
        name: developer?.name || `用户${id}`,
        occupation: developer?.occupation,
        role: this.participantRoles.value[id],
        _raw: {
          id,
          name: developer?.name || `用户${id}`,
          occupation: developer?.occupation,
          role: this.participantRoles.value[id],
        },
      };
    });
  });

  /**
   * 加载开发人员列表
   */
  public loadDevelopers() {
    $network.request(
      "staffDevelopers",
      {},
      (data: any) => {
        this.pmOptions.value = data.pmList || [];
        this.developerOptions.value = data.developers || [];
      },
      (_error: any) => {
        $message.error({ message: "获取开发人员列表失败" });
      },
    );
  }

  /**
   * 开发人员选择变化处理
   */
  public handleDevelopersChange(value: string[]) {
    // 过滤掉项目负责人，防止重复选择
    const filteredValue = value.filter((id) => id !== this.managerModel.value);
    this.selectedDevelopers.value = filteredValue;

    // 为新添加的参与人设置默认角色
    filteredValue.forEach((id) => {
      if (!this.participantRoles.value[id]) {
        this.participantRoles.value[id] = "FD"; // 默认前端开发角色
      }
    });

    // 清理已移除参与人的角色数据
    Object.keys(this.participantRoles.value).forEach((id) => {
      if (!filteredValue.includes(id)) {
        delete this.participantRoles.value[id];
      }
    });
  }

  /**
   * 参与人角色变化处理
   */
  public handleRoleChange(participantId: string, role: string) {
    this.participantRoles.value[participantId] = role;
  }

  /**
   * 删除参与人
   */
  public removeParticipant(participantId: string) {
    this.selectedDevelopers.value = this.selectedDevelopers.value.filter(
      (id) => id !== participantId,
    );
    delete this.participantRoles.value[participantId];
  }

  /**
   * 项目负责人变化处理
   */
  public handleManagerChange(value: string) {
    this.managerModel.value = value;

    // 如果新选择的项目负责人已经在项目参与人中，将其移除
    if (value && this.selectedDevelopers.value.includes(value)) {
      this.selectedDevelopers.value = this.selectedDevelopers.value.filter(
        (id) => id !== value,
      );
    }
  }

  /**
   * 表单验证
   */
  public validateForm(): boolean {
    if (!this.nameModel.value.trim()) {
      $message.error({ message: "请输入项目名称" });
      return false;
    }
    if (!this.startDate.value || !this.endDate.value) {
      $message.error({ message: "请选择项目周期" });
      return false;
    }

    // 安全地解析日期（Date组件返回YYYY-MM-DD格式的字符串）
    let parsedStartDate: Date | null = null;
    let parsedEndDate: Date | null = null;

    try {
      if (!this.startDate.value || !this.endDate.value) {
        throw new Error("Date values are empty");
      }

      const startDateStr = this.startDate.value?.toString() || "";
      const endDateStr = this.endDate.value?.toString() || "";

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDateStr) || !dateRegex.test(endDateStr)) {
        throw new Error("Invalid date format");
      }

      try {
        const startDateTime = `${startDateStr}T00:00:00`;
        const endDateTime = `${endDateStr}T00:00:00`;

        parsedStartDate = new Function(
          'return new Date("' + startDateTime + '")',
        )();
        parsedEndDate = new Function(
          'return new Date("' + endDateTime + '")',
        )();
      } catch (e) {
        parsedStartDate = new Function(
          'return new Date("' + startDateStr + '")',
        )();
        parsedEndDate = new Function(
          'return new Date("' + endDateStr + '")',
        )();
      }

      if (
        !parsedStartDate ||
        !parsedEndDate ||
        isNaN(parsedStartDate.getTime()) ||
        isNaN(parsedEndDate.getTime())
      ) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      $message.error({ message: "日期格式无效，请重新选择日期" });
      return false;
    }

    // 确保日期对象存在
    if (!parsedStartDate || !parsedEndDate) {
      $message.error({ message: "日期解析失败，请重新选择日期" });
      return false;
    }

    if (parsedStartDate >= parsedEndDate) {
      $message.error({ message: "结束日期必须晚于开始日期" });
      return false;
    }
    if (!this.managerModel.value) {
      $message.error({ message: "请选择项目负责人" });
      return false;
    }

    return true;
  }

  /**
   * 提交项目
   */
  public handleSubmit() {
    if (!this.validateForm()) return;

    this.submitting.value = true;

    const projectData = {
      name: this.nameModel.value.trim(),
      start_date: this.startDate.value,
      end_date: this.endDate.value,
      priority: this.priorityModel.value,
      manager_id: this.managerModel.value,
      members: this.selectedDevelopers.value.map((staff_id) => ({
        staff_id,
        role: this.participantRoles.value[staff_id] || "Frontend", // 使用选择的角色
      })),
    };

    $network.request(
      "projectAdd",
      projectData,
      (_data: any) => {
        $message.success({ message: "项目添加成功" });
        this.submitting.value = false;

        // 发送项目添加成功事件
        $event.emit("projectAdded", {
          type: "project_added",
          data: projectData,
        });

        // 重置表单
        this.resetForm();
      },
      (error: any) => {
        $message.error({ message: error || "项目添加失败" });
        this.submitting.value = false;
      },
    );
  }

  /**
   * 重置表单
   */
  public resetForm() {
    this.nameModel.value = "";
    this.dateRange.value = ["", ""];
    this.startDate.value = "";
    this.endDate.value = "";
    this.priorityModel.value = "Medium";
    this.managerModel.value = "";
    this.selectedDevelopers.value = [];
    this.participantRoles.value = {};
  }

  /**
   * 初始化
   */
  public init() {
    this.loadDevelopers();
  }
}
