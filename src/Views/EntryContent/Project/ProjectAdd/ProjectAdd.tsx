/// <reference path="./ProjectAdd.d.ts" />

import { defineComponent, onMounted } from "vue";
import "./ProjectAdd.scss";
import Input from "@Form/Input/Input.tsx";
import Date from "@Form/Date/Date.tsx";
import Selector from "@Form/Selector/Selector.tsx";
import Table from "@/Components/Table/Table";
import { projectAddConfig } from "./ProjectAdd.config";
import { ProjectAddController } from "./ProjectAdd.controller.ts";

export default defineComponent({
  name: "ProjectAdd",
  props: {},
  setup() {
    const controller = new ProjectAddController();

    onMounted(() => {
      controller.init();
    });

    return () => (
      <div class="project-add">
        {/* 项目名称 */}
        <div class="project-name">
          <Input
            placeHolder={"请输入项目名称"}
            modelValue={controller.nameModel.value}
            onUpdate:modelValue={(value: string) => (controller.nameModel.value = value)}
            border={false}
            style={{
              height: "80px",
              fontSize: "25px",
              fontWeight: "bold",
              textAlign: "center",
            }}
          />
        </div>
        <div class="project-form">
          <div class="project-row">
            <div class="project-manager">
              <div class="title">项目负责人</div>
              <div class="manager-select">
                <Selector
                  modelValue={controller.managerModel.value}
                  onUpdate:modelValue={(value: string) => controller.handleManagerChange(value)}
                  options={controller.pmOptions.value}
                  placeholder="请选择项目负责人"
                  searchable={true}
                  clearable={true}
                  optionLabel="name"
                  optionValue="id"
                  emptyText="暂无项目负责人"
                />
              </div>
            </div>
            <div class="project-priority">
              <div class="title">项目优先级</div>
              <div class="priority-buttons">
                <button
                  class={`priority-btn low ${controller.priorityModel.value === "Low" ? "active" : ""}`}
                  onClick={() => (controller.priorityModel.value = "Low")}
                >
                  低
                </button>
                <button
                  class={`priority-btn medium ${controller.priorityModel.value === "Medium" ? "active" : ""}`}
                  onClick={() => (controller.priorityModel.value = "Medium")}
                >
                  中
                </button>
                <button
                  class={`priority-btn high ${controller.priorityModel.value === "High" ? "active" : ""}`}
                  onClick={() => (controller.priorityModel.value = "High")}
                >
                  高
                </button>
                <button
                  class={`priority-btn critical ${controller.priorityModel.value === "Critical" ? "active" : ""}`}
                  onClick={() => (controller.priorityModel.value = "Critical")}
                >
                  紧急
                </button>
              </div>
            </div>
          </div>
          <div class="project-date">
            <div class="title">项目周期</div>
            <div class="date-picker">
              <Date
                dateType="range"
                modelValue={controller.dateRange.value}
                onUpdate:modelValue={(value: string[]) => {
                  controller.dateRange.value = value;
                  if (value && value.length === 2) {
                    controller.startDate.value = value[0] || "";
                    controller.endDate.value = value[1] || "";
                  }
                }}
                rangePlaceholder={["开始日期", "结束日期"]}
                separator=" ~ "
                placeholder="请选择项目周期"
                format="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>
        <div class="participant">
          <div class="title">项目参与人</div>
          <div class="participant-select">
            <Selector
              modelValue={controller.selectedDevelopers.value}
              onUpdate:modelValue={(value: string[]) => controller.handleDevelopersChange(value)}
              options={controller.developerOptions.value}
              placeholder={controller.selectedDevelopersDisplay.value}
              multiple={true}
              searchable={true}
              clearable={true}
              optionLabel="name"
              optionValue="id"
              maxHeight="200px"
              emptyText="暂无项目参与人"
            />
          </div>
          <div class="participant-table">
            <Table
              titles={["姓名", "职位", "项目角色"]}
              data={controller.participantTableData.value}
              emptyText="暂无项目参与人"
              columnWidths={{
                2: "280px",
              }}
              icon={{
                svgPath: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
                width: 16,
                height: 16,
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                class: "icon",
                onClick: (row: any) => controller.removeParticipant(row.id),
              }}
              v-slots={{
                "cell-0": ({ row }: any) => row.name,
                "cell-1": ({ row }: any) => {
                  // 映射 occupation 到 role 配置的键
                  const occupationMap: Record<string, keyof typeof projectAddConfig.role> = {
                    'BD': 'BD',
                    'Backend': 'BD',
                    'FD': 'FD',
                    'Frontend': 'FD',
                    'QA': 'QA',
                    'Tester': 'QA',
                    'UI': 'UI',
                    'DevOps': 'DevOps',
                  };
                  const rawOccupation = row._raw?.occupation || row.occupation || '';
                  const roleKey = occupationMap[rawOccupation] || rawOccupation;
                  const roleConfig = projectAddConfig.occupation[roleKey as keyof typeof projectAddConfig.occupation];
                  
                  return (
                    <div class="occupation-tag" style={{ backgroundColor: roleConfig?.color || "#737373" }}>
                      {roleConfig?.name || rawOccupation || "开发工程师"}
                    </div>
                  );
                },
                "cell-2": ({ row }: any) => (
                  <div class="role-buttons">
                    <button
                      class={`role-btn ${row.role === "FD" ? "active" : ""}`}
                      onClick={() => controller.handleRoleChange(row.id, "FD")}
                    >
                      前端
                    </button>
                    <button
                      class={`role-btn ${row.role === "BD" ? "active" : ""}`}
                      onClick={() => controller.handleRoleChange(row.id, "BD")}
                    >
                      后端
                    </button>
                    <button
                      class={`role-btn ${row.role === "QA" ? "active" : ""}`}
                      onClick={() => controller.handleRoleChange(row.id, "QA")}
                    >
                      测试
                    </button>
                    <button
                      class={`role-btn ${row.role === "UI" ? "active" : ""}`}
                      onClick={() => controller.handleRoleChange(row.id, "UI")}
                    >
                      UI
                    </button>
                    <button
                      class={`role-btn ${row.role === "DevOps" ? "active" : ""}`}
                      onClick={() => controller.handleRoleChange(row.id, "DevOps")}
                    >
                      运维
                    </button>
                  </div>
                ),
              }}
            />
          </div>
        </div>

        {/* 提交按钮 */}
        <div class="form-actions">
          <button
            class="submit-btn"
            disabled={controller.submitting.value}
            onClick={() => controller.handleSubmit()}
          >
            {controller.submitting.value ? "提交中..." : "创建项目"}
          </button>
        </div>
      </div>
    );
  },
});
