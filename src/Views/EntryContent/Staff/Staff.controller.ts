import { ref, watch, computed } from "vue";
import StaffDetail from "./StaffDetail/StaffDetail";

export class StaffController {
  // 数据状态
  public staffList = ref<StaffData[]>([]);
  public currentPageNumber = ref(1);
  public totalStaffCount = ref(0);
  public activeStaffCount = ref(0);
  public probationStaffCount = ref(0);
  public requestComplete = ref(false);

  // 搜索相关状态
  public searchName = ref("");
  public searchDepartment = ref("");
  public searchStatus = ref("");
  public searchSalaryMin = ref("");
  public searchSalaryMax = ref("");
  public searchGender = ref("");
  public searchJoinDate = ref("");

  // 搜索状态
  public searching = ref(false);

  // 清除按钮操作标志
  public clearingByButton = ref(false);

  // 部门选项
  public departmentOptions = [
    { label: "技术部", value: "Technical" },
    { label: "资源管理部", value: "RMD" },
    { label: "财务部", value: "Finance" },
    { label: "产品部", value: "Product" },
  ];

  // 状态选项
  public statusOptions = [
    { label: "在职", value: "Active" },
    { label: "试用", value: "Probation" },
    { label: "离职", value: "Inactive" },
  ];

  // 性别选项
  public genderOptions = [
    { label: "男", value: "男" },
    { label: "女", value: "女" },
  ];

  // 表格数据
  public tableData = computed(() => {
    return this.staffList.value.map((staff) => ({
      name: staff.name,
      gender: staff.gender || "-",
      department: staff.department,
      occupation: staff.occupation,
      status: staff.status,
      service_date: staff.service_date,
      _raw: staff,
    }));
  });

  constructor() {
    this.initWatchers();
  }

  /**
   * 初始化监听器
   */
  private initWatchers() {
    // 监听页码变化
    watch(this.currentPageNumber, (newPage, oldPage) => {
      this.fetchStaffInfo(newPage, oldPage);
    });

    // 监听所有搜索条件的变化
    watch(
      [
        this.searchName,
        this.searchDepartment,
        this.searchStatus,
        this.searchSalaryMin,
        this.searchSalaryMax,
        this.searchGender,
        this.searchJoinDate,
      ],
      () => {
        const allEmpty =
          !this.searchName.value.trim() &&
          !this.searchDepartment.value &&
          !this.searchStatus.value &&
          !this.searchSalaryMin.value.trim() &&
          !this.searchSalaryMax.value.trim() &&
          !this.searchGender.value &&
          !this.searchJoinDate.value.trim();

        if (allEmpty && !this.clearingByButton.value && !this.searching.value) {
          this.handleSearch();
        }
      }
    );
  }

  /**
   * 检查是否有搜索条件
   */
  public hasSearchConditions(): boolean {
    return !!(
      this.searchName.value.trim() ||
      this.searchDepartment.value ||
      this.searchStatus.value ||
      this.searchGender.value ||
      this.searchSalaryMin.value.trim() ||
      this.searchSalaryMax.value.trim() ||
      this.searchJoinDate.value.trim()
    );
  }

  /**
   * 打开员工详情
   */
  public handleOpenStaffDetail(staff: StaffData) {
    $popup.popup({}, { component: StaffDetail, props: { staffDetail: staff } });
  }

  /**
   * 搜索函数
   */
  public handleSearch() {
    if (this.searching.value) return;
    this.searching.value = true;
    this.fetchStaffInfo(1, 0);
  }

  /**
   * 清除搜索
   */
  public clearSearch() {
    if (this.searching.value) return;
    if (!this.hasSearchConditions()) return;
    this.clearingByButton.value = true;
    this.searchName.value = "";
    this.searchDepartment.value = "";
    this.searchStatus.value = "";
    this.searchSalaryMin.value = "";
    this.searchSalaryMax.value = "";
    this.searchGender.value = "";
    this.searchJoinDate.value = "";
    this.handleSearch();
    setTimeout(() => {
      this.clearingByButton.value = false;
    }, 100);
  }

  /**
   * 处理页码更改事件
   */
  public handlePageChange(page: number) {
    this.currentPageNumber.value = page;
  }

  /**
   * 获取员工信息
   */
  public fetchStaffInfo(page = 1, old?: number) {
    $storage.get("userID").then((userID: string) => {
      const searchParams: any = {
        current_page: page,
        user_id: userID,
      };

      // 添加搜索条件
      if (this.searchName.value.trim()) {
        searchParams.name = this.searchName.value.trim();
      }
      if (this.searchDepartment.value) {
        searchParams.department = this.searchDepartment.value;
      }
      if (this.searchStatus.value) {
        searchParams.status = this.searchStatus.value;
      }
      if (this.searchSalaryMin.value.trim()) {
        searchParams.salary_min = parseFloat(this.searchSalaryMin.value.trim());
      }
      if (this.searchSalaryMax.value.trim()) {
        searchParams.salary_max = parseFloat(this.searchSalaryMax.value.trim());
      }
      if (this.searchGender.value) {
        searchParams.gender = this.searchGender.value;
      }
      if (this.searchJoinDate.value.trim()) {
        searchParams.join_date = this.searchJoinDate.value.trim();
      }

      $network.request(
        "staffInfo",
        searchParams,
        (data: any) => {
          this.updateStaffList(data);
          this.totalStaffCount.value = data.total;
          this.activeStaffCount.value = data.active_staff;
          this.probationStaffCount.value = data.probation_staff;
          this.requestComplete.value = true;
          this.searching.value = false;
        },
        (error: any) => {
          if (old) this.currentPageNumber.value = old;
          $message.error({ message: error });
          this.searching.value = false;
        }
      );
    });
  }

  /**
   * 更新员工列表
   */
  private updateStaffList(...args: any[]) {
    if (typeof args[0] !== "string") {
      this.staffList.value = args[0].data_list;
    } else {
      args[1].data_list.forEach((newStaff: any) => {
        const oldStaff = this.staffList.value.find((s) => s.id === newStaff.id);
        if (oldStaff) {
          Object.assign(oldStaff, newStaff);
        } else {
          this.staffList.value.push(newStaff);
        }
      });
    }
  }

  /**
   * 初始化 - 在组件 onMounted 时调用
   */
  public init() {
    this.fetchStaffInfo();

    $event.on("changeStaffStatus", () => {
      $storage.get("userID").then((userID: string) => {
        $network.request(
          "staffInfo",
          { current_page: this.currentPageNumber.value, user_id: userID },
          (data: any) => {
            this.updateStaffList("", data);
            this.totalStaffCount.value = data.total;
            this.activeStaffCount.value = data.active_staff;
            this.probationStaffCount.value = data.probation_staff;
          },
          (error: any) => {
            $message.error({ message: error });
          }
        );
      });
    });
  }

  /**
   * 清理 - 在组件 onUnmounted 时调用
   */
  public cleanup() {
    $event.off("changeStaffStatus");
  }
}
