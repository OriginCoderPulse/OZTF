/// <reference path="./Staff.d.ts" />

import { defineComponent, onMounted, onUnmounted } from "vue";
import { staffConfig } from "./Staff.config.ts";
import { StaffController } from "./Staff.controller.ts";
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
    // 创建 controller 实例
    const controller = new StaffController();

    // 生命周期钩子
    onMounted(() => {
      controller.init();
    });

    onUnmounted(() => {
      controller.cleanup();
    });

    return () => (
      <div class="staff" v-loading={!controller.requestComplete.value}>
        {controller.requestComplete.value ? (
          <>
            <div class="staff-detail">
            <div className="staff-header"></div>
            <div className="staff-content">
              <div class="staff-list">
                <Table
                  titles={["名称", "性别", "部门", "职位", "状态", "入职日期"]}
                  data={controller.tableData.value}
                  total={controller.totalStaffCount.value}
                  pageQuantity={15}
                  modelValue={controller.currentPageNumber.value}
                  pageNumPosition="center"
                  emptyText="暂无员工数据"
                  icon={{
                    svgPath: (row: any) => {
                      // 判断是否是CEO（部门为CEO且职位为CEO）
                      const isCEO =
                        row._raw?.department === "CEO" && row._raw?.occupation === "CEO";

                      if (isCEO) {
                        // 禁止图标（圆形禁止符号）
                        return null;
                      }

                      // 普通操作图标
                      return [
                        "M800 64h-576C134.4 64 64 134.4 64 224v640C64 953.6 134.4 1024 224 1024h576c89.6 0 160-70.4 160-160v-640C960 134.4 889.6 64 800 64zM896 864c0 51.2-44.8 96-96 96h-576c-51.2 0-96-44.8-96-96v-640C128 172.8 172.8 128 224 128h576c51.2 0 96 44.8 96 96v640z",
                        "M736 320h-448c-19.2 0-32 12.8-32 32s12.8 32 32 32h448c19.2 0 32-12.8 32-32s-12.8-32-32-32zM736 512h-448c-19.2 0-32 12.8-32 32s12.8 32 32 32h448c19.2 0 32-12.8 32-32s-12.8-32-32-32zM544 704h-256c-19.2 0-32 12.8-32 32s12.8 32 32 32h256c19.2 0 32-12.8 32-32s-12.8-32-32-32z",
                      ];
                    },
                    width: 14,
                    height: 14,
                    fill: (row: any) => {
                      // CEO使用灰色，表示禁用
                      const isCEO =
                        row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      return isCEO ? "#999999" : "#dddddd";
                    },
                    class: "icon",
                    onClick: (row: any) => {
                      // CEO不允许操作
                      const isCEO =
                        row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      if (!isCEO) {
                        controller.handleOpenStaffDetail(row._raw);
                      }
                    },
                  }}
                  onPageChange={(page: number) => controller.handlePageChange(page)}
                  v-slots={{
                    "cell-0": ({ row }: any) => row.name,
                    "cell-1": ({ row }: any) => row.gender,
                    "cell-2": ({ row }: any) => {
                      const deptRaw = row._raw.department as
                        | "CEO"
                        | "Technology"
                        | "Technical"
                        | "RMD"
                        | "Finance"
                        | "Product"
                        | undefined;
                      // 将 Technology 映射到 Technical（兼容处理）
                      const dept = deptRaw === "Technology" ? "Technical" : deptRaw;
                      const deptKey = dept as keyof typeof staffConfig.department | undefined;
                      return deptKey && deptKey in staffConfig.department ? (
                        <div
                          class="department"
                          style={{
                            backgroundColor: staffConfig.department[deptKey]?.color || "#d4e6f156",
                          }}
                        >
                          {staffConfig.department[deptKey]?.name || dept}
                        </div>
                      ) : null;
                    },
                    "cell-3": ({ row }: any) => {
                      const occupation = row._raw.occupation as
                        | keyof typeof staffConfig.occupation
                        | undefined;
                      return occupation && staffConfig.occupation[occupation] ? (
                        <div
                          class="occupation"
                          style={{
                            backgroundColor:
                              staffConfig.occupation[occupation]?.color || "#d4e6f156",
                          }}
                        >
                          {staffConfig.occupation[occupation]?.name || occupation}
                        </div>
                      ) : (
                        row.occupation || "-"
                      );
                    },
                    "cell-4": ({ row }: any) => {
                      const status = row._raw.status as
                        | "Active"
                        | "Probation"
                        | "Inactive"
                        | undefined;
                      const isCEO =
                        row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
                      return status ? (
                        <div class="staff-status">
                          {!isCEO && (
                            <div
                              class="status-dot"
                              style={{
                                backgroundColor: staffConfig.status[status]?.color || "#cbfed6ff",
                              }}
                            ></div>
                          )}
                          <span>{staffConfig.status[status]?.name || status}</span>
                        </div>
                      ) : null;
                    },
                    "cell-5": ({ row }: any) => {
                      const isCEO =
                        row._raw?.department === "CEO" && row._raw?.occupation === "CEO";
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
                        value={controller.activeStaffCount.value}
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
                        value={controller.probationStaffCount.value}
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
                          (controller.activeStaffCount.value /
                            (controller.activeStaffCount.value +
                              controller.probationStaffCount.value)) *
                            100 +
                          "%",
                        borderTopRightRadius:
                          controller.activeStaffCount.value === controller.totalStaffCount.value
                            ? "8px"
                            : 0,
                        borderBottomRightRadius:
                          controller.activeStaffCount.value === controller.totalStaffCount.value
                            ? "8px"
                            : 0,
                      }}
                    ></div>
                    <div
                      class="another-proportion"
                      style={{
                        width:
                          (controller.probationStaffCount.value /
                            (controller.activeStaffCount.value +
                              controller.probationStaffCount.value)) *
                            100 +
                          "%",
                        borderTopLeftRadius:
                          controller.totalStaffCount.value - controller.activeStaffCount.value ===
                          controller.totalStaffCount.value
                            ? "8px"
                            : 0,
                        borderBottomLeftRadius:
                          controller.totalStaffCount.value - controller.activeStaffCount.value ===
                          controller.totalStaffCount.value
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
                        v-model={controller.searchName.value}
                        placeHolder="输入姓名"
                        border={true}
                        clearable={true}
                      />
                    </div>

                    {/* 部门选择 */}
                    <div class="search-group">
                      <label class="search-label">部门</label>
                      <Selector
                        v-model={controller.searchDepartment.value}
                        options={controller.departmentOptions}
                        placeholder="选择部门"
                      />
                    </div>

                    {/* 状态选择 */}
                    <div class="search-group">
                      <label class="search-label">状态</label>
                      <Selector
                        v-model={controller.searchStatus.value}
                        options={controller.statusOptions}
                        placeholder="选择状态"
                      />
                    </div>

                    {/* 性别选择 */}
                    <div class="search-group">
                      <label class="search-label">性别</label>
                      <Radio
                        v-model={controller.searchGender.value}
                        options={controller.genderOptions}
                      />
                    </div>

                    {/* 薪资范围 */}
                    <div class="search-group">
                      <label class="search-label">薪资范围</label>
                      <div class="range-input-group">
                        <Input
                          v-model={controller.searchSalaryMin.value}
                          placeHolder="最低"
                          border={true}
                          clearable={true}
                          type="number"
                        />
                        <span class="range-to">至</span>
                        <Input
                          v-model={controller.searchSalaryMax.value}
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
                        v-model={controller.searchJoinDate.value}
                        placeholder="选择入职日期"
                        format="YYYY-MM-DD"
                        dropdownPlacement="top"
                      />
                    </div>

                    {/* 操作按钮 */}
                    <div class="search-actions">
                      <button
                        class={`search-btn search-btn-primary ${controller.searching.value ? "loading" : ""}`}
                        onClick={() => controller.handleSearch()}
                        disabled={controller.searching.value || !controller.hasSearchConditions()}
                      >
                        {controller.searching.value && (
                          <div class="loader">
                            <span class="bar"></span>
                            <span class="bar"></span>
                            <span class="bar"></span>
                          </div>
                        )}
                        {controller.searching.value ? "搜索中" : "搜索"}
                      </button>
                      <button
                        class={`search-btn search-btn-secondary ${controller.searching.value ? "disabled" : ""}`}
                        onClick={() => controller.clearSearch()}
                        disabled={controller.searching.value || !controller.hasSearchConditions()}
                      >
                        清除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </>
        ) : null}
      </div>
    );
  },
});
