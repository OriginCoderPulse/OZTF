/// <reference path="./Staff.d.ts" />

import { defineComponent, ref, onMounted, onUnmounted, watch, computed } from "vue";
import StaffDetail from "./StaffDetail/StaffDetail";
import { staffConfig } from "./Staff.config.ts";
import "./Staff.scss";
import AnimationNumberText from "@/Components/AnimationNumberText/AnimationNumberText";
import Table from "@/Components/Table/Table";
import Input from "@/Components/FormBuilder/Input/Input";
import Selector from "@/Components/FormBuilder/Selector/Selector";
import Date from "@/Components/FormBuilder/Date/Date";
import Radio from "@/Components/FormBuilder/Radio/Radio";

export default defineComponent({
  name: "Staff",
  setup() {
    const staffList = ref<StaffData[]>([]);
    const currentPageNumber = ref(1);
    const totalStaffCount = ref(0);
    const activeStaffCount = ref(0);
    const probationStaffCount = ref(0);
    const requestComplete = ref(false);

    const handleOpenStaffDetail = (staff: StaffData) => {
      $popup.popup(
        {},
        { component: StaffDetail, props: { staffDetail: staff } },
      );
    };

    // 搜索相关状态
    const searchName = ref("");
    const searchDepartment = ref("");
    const searchStatus = ref("");
    const searchSalaryMin = ref("");
    const searchSalaryMax = ref("");
    const searchGender = ref("");
    const searchJoinDate = ref("");

    // 搜索状态
    const searching = ref(false);

    // 清除按钮操作标志
    const clearingByButton = ref(false);

    // 部门选项
    const departmentOptions = [
      { label: "技术部", value: "Technical" },
      { label: "资源管理部", value: "RMD" },
      { label: "财务部", value: "Finance" },
      { label: "产品部", value: "Product" },
    ];

    // 状态选项
    const statusOptions = [
      { label: "在职", value: "Active" },
      { label: "试用", value: "Probation" },
      { label: "离职", value: "Inactive" },
    ];

    // 性别选项
    const genderOptions = [
      { label: "男", value: "男" },
      { label: "女", value: "女" },
    ];

    // 检查是否有搜索条件
    const hasSearchConditions = () => {
      return !!(
        searchName.value.trim() ||
        searchDepartment.value ||
        searchStatus.value ||
        searchGender.value ||
        searchSalaryMin.value.trim() ||
        searchSalaryMax.value.trim() ||
        searchJoinDate.value.trim()
      );
    };

    // 搜索函数
    const handleSearch = () => {
      if (searching.value) return; // 如果正在搜索，阻止重复请求
      searching.value = true;
      fetchStaffInfo(1, 0); // 搜索时重置到第一页
    };

    // 清除搜索
    const clearSearch = () => {
      if (searching.value) return; // 如果正在搜索，阻止清除操作
      if (!hasSearchConditions()) return; // 如果没有搜索条件，不执行清除
      clearingByButton.value = true; // 标记为通过清除按钮操作
      searchName.value = "";
      searchDepartment.value = "";
      searchStatus.value = "";
      searchSalaryMin.value = "";
      searchSalaryMax.value = "";
      searchGender.value = "";
      searchJoinDate.value = "";
      handleSearch();
      // 重置标志
      setTimeout(() => {
        clearingByButton.value = false;
      }, 100);
    };

    watch(currentPageNumber, (newPage, oldPage) => {
      fetchStaffInfo(newPage, oldPage);
    });

    // 处理页码更改事件
    const handlePageChange = (page: number) => {
      currentPageNumber.value = page;
    };

    // 准备表格数据，将staff数据转换为Table组件需要的格式
    const tableData = computed(() => {
      return staffList.value.map((staff) => ({
        name: staff.name,
        gender: staff.gender || "-",
        department: staff.department,
        occupation: staff.occupation,
        status: staff.status,
        service_date: staff.service_date,
        // 保留原始数据用于插槽
        _raw: staff,
      }));
    });

    // 监听所有搜索条件的变化，当手动清空所有条件时自动搜索
    watch(
      [
        searchName,
        searchDepartment,
        searchStatus,
        searchSalaryMin,
        searchSalaryMax,
        searchGender,
        searchJoinDate,
      ],
      () => {
        // 检查是否所有条件都为空
        const allEmpty =
          !searchName.value.trim() &&
          !searchDepartment.value &&
          !searchStatus.value &&
          !searchSalaryMin.value.trim() &&
          !searchSalaryMax.value.trim() &&
          !searchGender.value &&
          !searchJoinDate.value.trim();

        // 如果所有条件都为空且不是通过清除按钮操作，自动触发搜索
        if (allEmpty && !clearingByButton.value && !searching.value) {
          handleSearch();
        }
      },
    );

    const fetchStaffInfo = (page = 1, old?: number) => {
      $storage.get("userID").then((userID: string) => {
        // 构建搜索参数
        const searchParams: any = {
          current_page: page,
          user_id: userID,
        };

        // 添加搜索条件
        if (searchName.value.trim()) {
          searchParams.name = searchName.value.trim();
        }
        if (searchDepartment.value) {
          searchParams.department = searchDepartment.value;
        }
        if (searchStatus.value) {
          searchParams.status = searchStatus.value;
        }
        if (searchSalaryMin.value.trim()) {
          searchParams.salary_min = parseFloat(searchSalaryMin.value.trim());
        }
        if (searchSalaryMax.value.trim()) {
          searchParams.salary_max = parseFloat(searchSalaryMax.value.trim());
        }
        if (searchGender.value) {
          searchParams.gender = searchGender.value;
        }
        if (searchJoinDate.value.trim()) {
          searchParams.join_date = searchJoinDate.value.trim();
        }

        // 获取员工列表数据
        $network.request(
          "staffInfo",
          searchParams,
          (data: any) => {
            updateStaffList(data);
            totalStaffCount.value = data.total;
            activeStaffCount.value = data.active_staff;
            probationStaffCount.value = data.probation_staff;
            requestComplete.value = true;
            searching.value = false;
          },
          (error: any) => {
            if (old) currentPageNumber.value = old;
            $message.error({ message: error });
            searching.value = false;
          },
        );
      });
    };

    const updateStaffList = (...args: any[]) => {
      if (typeof args[0] !== "string") {
        staffList.value = args[0].data_list;
      } else {
        args[1].data_list.forEach((newStaff: any) => {
          const oldStaff = staffList.value.find((s) => s.id === newStaff.id);
          if (oldStaff) {
            Object.assign(oldStaff, newStaff);
          } else {
            staffList.value.push(newStaff);
          }
        });
      }
    };

    onMounted(() => {
      fetchStaffInfo();

      $event.on("changeStaffStatus", () => {
        $storage.get("userID").then((userID: string) => {
          $network.request(
            "staffInfo",
            { current_page: currentPageNumber.value, user_id: userID },
            (data: any) => {
              updateStaffList("", data);
              totalStaffCount.value = data.total;
              activeStaffCount.value = data.active_staff;
              probationStaffCount.value = data.probation_staff;
            },
            (error: any) => {
              $message.error({ message: error });
            },
          );
        });
      });
    });

    onUnmounted(() => {
      $event.off("changeStaffStatus");
    });

    return () =>
      requestComplete.value ? (
        <div class="staff">
          <div class="staff-detail">
            <div className="staff-header"></div>
            <div className="staff-content">
              <div class="staff-list">
                <Table
                  titles={["名称", "性别", "部门", "职位", "状态", "入职日期"]}
                  data={tableData.value}
                  total={totalStaffCount.value}
                  pageQuantity={15}
                  modelValue={currentPageNumber.value}
                  pageNumPosition="center"
                  emptyText="暂无员工数据"
                  icon={{
                    svgPath: (row: any) => {
                      // 判断是否是CEO（部门为CEO且职位为CEO）
                      const isCEO = row._raw?.department === "CEO" && row._raw?.occupation === "CEO";

                      if (isCEO) {
                        // 禁止图标（圆形禁止符号）
                        return null
                      }

                      // 普通操作图标
                      return [
                        "M800 64h-576C134.4 64 64 134.4 64 224v640C64 953.6 134.4 1024 224 1024h576c89.6 0 160-70.4 160-160v-640C960 134.4 889.6 64 800 64zM896 864c0 51.2-44.8 96-96 96h-576c-51.2 0-96-44.8-96-96v-640C128 172.8 172.8 128 224 128h576c51.2 0 96 44.8 96 96v640z",
                        "M736 320h-448c-19.2 0-32 12.8-32 32s12.8 32 32 32h448c19.2 0 32-12.8 32-32s-12.8-32-32-32zM736 512h-448c-19.2 0-32 12.8-32 32s12.8 32 32 32h448c19.2 0 32-12.8 32-32s-12.8-32-32-32zM544 704h-256c-19.2 0-32 12.8-32 32s12.8 32 32 32h256c19.2 0 32-12.8 32-32s-12.8-32-32-32z"
                      ];
                    },
                    width: 14,
                    height: 14,
                    fill: (row: any) => {
                      // CEO使用灰色，表示禁用
                      const isCEO = row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      return isCEO ? "#999999" : "#dddddd";
                    },
                    class: "icon",
                    onClick: (row: any) => {
                      // CEO不允许操作
                      const isCEO = row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      if (!isCEO) {
                        handleOpenStaffDetail(row._raw);
                      }
                    },
                  }}
                  onPageChange={handlePageChange}
                  v-slots={{
                    "cell-0": ({ row }: any) => row.name,
                    "cell-1": ({ row }: any) => row.gender,
                    "cell-2": ({ row }: any) => {
                      const deptRaw = row._raw.department as "CEO" | "Technology" | "Technical" | "RMD" | "Finance" | "Product" | undefined;
                      // 将 Technology 映射到 Technical（兼容处理）
                      const dept = deptRaw === "Technology" ? "Technical" : deptRaw;
                      const deptKey = dept as keyof typeof staffConfig.department | undefined;
                      return deptKey && deptKey in staffConfig.department ? (
                        <div
                          class="department"
                          style={{
                            backgroundColor:
                              staffConfig.department[deptKey]?.color || "#d4e6f156",
                          }}
                        >
                          {staffConfig.department[deptKey]?.name || dept}
                        </div>
                      ) : null;
                    },
                    "cell-3": ({ row }: any) => {
                      const occupation = row._raw.occupation as keyof typeof staffConfig.occupation | undefined;
                      return occupation && staffConfig.occupation[occupation] ? (
                        <div
                          class="occupation"
                          style={{
                            backgroundColor: staffConfig.occupation[occupation]?.color || "#d4e6f156",
                          }}
                        >
                          {staffConfig.occupation[occupation]?.name || occupation}
                        </div>
                      ) : (
                        row.occupation || "-"
                      );
                    },
                    "cell-4": ({ row }: any) => {
                      const status = row._raw.status as "Active" | "Probation" | "Inactive" | undefined;
                      const isCEO = row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      return status ? (
                        <div class="staff-status">
                          {!isCEO && <div
                            class="status-dot"
                            style={{
                              backgroundColor:
                                staffConfig.status[status]?.color || "#cbfed6ff",
                            }}
                          ></div>}
                          <span>
                            {staffConfig.status[status]?.name || status}
                          </span>
                        </div>
                      ) : null;
                    },
                    "cell-5": ({ row }: any) => {
                      const isCEO = row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      return isCEO ? "-" : $date.format(row._raw.service_date, "YYYY-MM-DD");
                    },
                  }}
                />
              </div>

              <div class="staff-log">
                <div class="staff-statistics">
                  <div class="statistics-number">
                    <div class="statistics-item">
                      <AnimationNumberText
                        value={activeStaffCount.value}
                        style={{
                          fontWeight: "bold",
                          color: "#fff",
                          fontSize: "35px",
                        }}
                      />
                      <span>Active Staff</span>
                    </div>
                    <div class="statistics-item">
                      <AnimationNumberText
                        value={probationStaffCount.value}
                        style={{
                          fontWeight: "bold",
                          color: "#fff",
                          fontSize: "35px",
                        }}
                      />
                      <span>Probation Staff</span>
                    </div>
                  </div>
                  <div class="statistics-proportion">
                    <div
                      class="active-proportion"
                      style={{
                        width:
                          (activeStaffCount.value /
                            (activeStaffCount.value +
                              probationStaffCount.value)) *
                          100 +
                          "%",
                        borderTopRightRadius:
                          activeStaffCount.value === totalStaffCount.value
                            ? "8px"
                            : 0,
                        borderBottomRightRadius:
                          activeStaffCount.value === totalStaffCount.value
                            ? "8px"
                            : 0,
                      }}
                    ></div>
                    <div
                      class="another-proportion"
                      style={{
                        width:
                          (probationStaffCount.value /
                            (activeStaffCount.value +
                              probationStaffCount.value)) *
                          100 +
                          "%",
                        borderTopLeftRadius:
                          totalStaffCount.value - activeStaffCount.value ===
                            totalStaffCount.value
                            ? "8px"
                            : 0,
                        borderBottomLeftRadius:
                          totalStaffCount.value - activeStaffCount.value ===
                            totalStaffCount.value
                            ? "8px"
                            : 0,
                      }}
                    ></div>
                  </div>
                </div>
                <div class="staff-search">
                  <div class="search-form">
                    {/* 姓名搜索 */}
                    <div class="search-group">
                      <label class="search-label">姓名</label>
                      <Input
                        v-model={searchName.value}
                        placeHolder="输入姓名"
                        border={true}
                        clearable={true}
                      />
                    </div>

                    {/* 部门选择 */}
                    <div class="search-group">
                      <label class="search-label">部门</label>
                      <Selector
                        v-model={searchDepartment.value}
                        options={departmentOptions}
                        placeholder="选择部门"
                      />
                    </div>

                    {/* 状态选择 */}
                    <div class="search-group">
                      <label class="search-label">状态</label>
                      <Selector
                        v-model={searchStatus.value}
                        options={statusOptions}
                        placeholder="选择状态"
                      />
                    </div>

                    {/* 性别选择 */}
                    <div class="search-group">
                      <label class="search-label">性别</label>
                      <Radio
                        v-model={searchGender.value}
                        options={genderOptions}
                      />
                    </div>

                    {/* 薪资范围 */}
                    <div class="search-group">
                      <label class="search-label">薪资范围</label>
                      <div class="range-input-group">
                        <Input
                          v-model={searchSalaryMin.value}
                          placeHolder="最低"
                          border={true}
                          clearable={true}
                          type="number"
                        />
                        <span class="range-to">至</span>
                        <Input
                          v-model={searchSalaryMax.value}
                          placeHolder="最高"
                          border={true}
                          clearable={true}
                          type="number"
                        />
                      </div>
                    </div>

                    {/* 入职日期 */}
                    <div class="search-group">
                      <label class="search-label">入职日期</label>
                      <Date
                        v-model={searchJoinDate.value}
                        placeholder="选择入职日期"
                        format="YYYY-MM-DD"
                        dropdownPlacement="top"
                      />
                    </div>

                    {/* 操作按钮 */}
                    <div class="search-actions">
                      <button
                        class={`search-btn search-btn-primary ${searching.value ? "loading" : ""}`}
                        onClick={handleSearch}
                        disabled={searching.value || !hasSearchConditions()}
                      >
                        {searching.value && (
                          <div class="loader">
                            <span class="bar"></span>
                            <span class="bar"></span>
                            <span class="bar"></span>
                          </div>
                        )}
                        {searching.value ? "搜索中" : "搜索"}
                      </button>
                      <button
                        class={`search-btn search-btn-secondary ${searching.value ? "disabled" : ""}`}
                        onClick={clearSearch}
                        disabled={searching.value || !hasSearchConditions()}
                      >
                        清除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div class="staff-loader">
          <div class="spinner-container">
            <div class="spinner">
              <div class="spinner">
                <div class="spinner">
                  <div class="spinner">
                    <div class="spinner">
                      <div class="spinner"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
  },
});
