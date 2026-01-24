import { ref } from "vue";

export class MeetCreateController {
  // 表单数据
  public topic = ref("");
  public description = ref("");
  public startTime = ref<Date | null>(null);
  public duration = ref<number>(60); // 默认60分钟
  public password = ref("");
  public innerParticipants = ref<string[]>([]);

  // 员工选项
  public staffOptions = ref<
    Array<{ id: string; name: string; occupation: string; department: string }>
  >([]);
  public loadingStaff = ref(false);

  // 会议时长选项
  public durationOptions = ref([
    { value: 30, label: "30分钟" },
    { value: 60, label: "60分钟" },
    { value: 90, label: "90分钟" },
    { value: 120, label: "120分钟" },
    { value: 7 * 24 * 60, label: "测试专用（7天）" },
  ]);

  // 提交状态
  public submitting = ref(false);

  // 弹窗ID，用于关闭弹窗
  public popupId = ref<string>("");

  /**
   * 初始化，加载员工列表
   */
  public async init() {
    await this.loadStaffList();
  }

  /**
   * 加载员工列表
   */
  public loadStaffList() {
    this.loadingStaff.value = true;
    $network.request(
      "staffInfo",
      {
        current_page: 1,
        status: "Active", // 只加载在职员工
      },
      (result: any) => {
        this.staffOptions.value = (result.data_list || []).map((staff: any) => ({
          id: staff.id,
          name: staff.name,
          occupation: staff.occupation,
          department: staff.department,
        }));
        this.loadingStaff.value = false;
      },
      (error: any) => {
        $message.error({ message: "获取员工列表失败: " + (error || "未知错误") });
        this.loadingStaff.value = false;
      }
    );
  }

  /**
   * 处理参会人选择变化
   */
  public handleParticipantsChange(value: string[]) {
    this.innerParticipants.value = value;
  }

  /**
   * 验证表单
   */
  public validateForm(): boolean {
    if (!this.topic.value.trim()) {
      $message.error({ message: "请输入会议主题" });
      return false;
    }

    if (!this.startTime.value) {
      $message.error({ message: "请选择会议开始时间" });
      return false;
    }

    // 检查开始时间是否在未来
    const now = new Date();
    const startTime = new Date(this.startTime.value);
    if (startTime <= now) {
      $message.error({ message: "会议开始时间必须晚于当前时间" });
      return false;
    }

    // 验证时长是否在允许的选项中
    const allowedDurations = [30, 60, 90, 120, 7 * 24 * 60];
    if (!this.duration.value || !allowedDurations.includes(this.duration.value)) {
      $message.error({ message: "请选择有效的会议时长" });
      return false;
    }

    return true;
  }

  /**
   * 提交创建会议
   */
  public async submit() {
    if (!this.validateForm()) {
      return;
    }

    this.submitting.value = true;

    // 获取当前用户ID
    $token
      .getUserId()
      .then((userID: string) => {
        // 格式化开始时间（转换为UTC时间字符串）
        if (!this.startTime.value) {
          this.submitting.value = false;
          return;
        }
        // 确保使用UTC时间字符串发送到后端
        const startTimeDate =
          this.startTime.value instanceof Date
            ? this.startTime.value
            : new Date(this.startTime.value);
        const startTimeStr = startTimeDate.toISOString();

        $network.request(
          "meetCreateRoom",
          {
            topic: this.topic.value.trim(),
            description: this.description.value.trim(),
            organizerId: userID,
            startTime: startTimeStr,
            duration: this.duration.value,
            password: this.password.value.trim() || undefined,
            innerParticipants: this.innerParticipants.value,
          },
          () => {
            this.submitting.value = false;
            $message.success({ message: "会议创建成功" });
            // 关闭弹窗
            if (this.popupId.value) {
              $popup.close(this.popupId.value);
            } else {
              $popup.closeAll();
            }
            // 刷新会议列表（通过事件通知父组件）
            window.dispatchEvent(new CustomEvent("meet-created"));
          },
          (error: any) => {
            console.log(error);
            this.submitting.value = false;
            $message.error({ message: "创建会议失败: " + (error || "未知错误") });
          }
        );
      })
      .catch((error: any) => {
        this.submitting.value = false;
        $message.error({ message: "获取用户ID失败: " + (error?.message || "未知错误") });
      });
  }

  /**
   * 重置表单
   */
  public reset() {
    this.topic.value = "";
    this.description.value = "";
    this.startTime.value = null;
    this.duration.value = 60;
    this.password.value = "";
    this.innerParticipants.value = [];
  }
}
