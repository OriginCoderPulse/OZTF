/// <reference path="./ProjectAdd.d.ts" />

import { defineComponent, onMounted, ref, computed } from "vue";
import "./ProjectAdd.scss";
import Input from "@Form/Input/Input.tsx";
import Date from "@Form/Date/Date.tsx";
import Selector from "@Form/Selector/Selector.tsx";
import Table from "@/Components/Table/Table";
import { projectAddConfig } from "./ProjectAdd.config";
// Select组件不存在，使用Selector组件实现多选功能

export default defineComponent({
  name: "ProjectAdd",
  props: {},
  setup() {
    // 项目基本信息
    const nameModel = ref("");
    const priorityModel = ref("");
    const managerModel = ref("");

    // 日期范围 - 使用明确的字符串类型
    const startDate = ref<string>("");
    const endDate = ref<string>("");
    const dateRange = ref<string[]>(["", ""]);

    // PM选项（用于项目负责人）
    const pmOptions = ref<any[]>([]);
    // 开发人员选项（用于项目参与人）
    const developerOptions = ref<any[]>([]);
    const selectedDevelopers = ref<string[]>([]);
    const participantRoles = ref<{ [key: string]: string }>({}); // 存储每个参与人的角色

    // 计算属性：处理开发人员显示逻辑（超过两个显示+n）
    const selectedDevelopersDisplay = computed(() => {
      if (!selectedDevelopers.value || selectedDevelopers.value.length === 0) {
        return "选择项目参与人";
      }

      // 获取选中的开发人员名称（从原始列表查找，确保能找到名字）
      const selectedNames = selectedDevelopers.value.map((id) => {
        const dev = developerOptions.value.find((d: any) => d.id === id);
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

    // 开发人员选择变化处理
    const handleDevelopersChange = (value: string[]) => {
      // 过滤掉项目负责人，防止重复选择
      const filteredValue = value.filter((id) => id !== managerModel.value);
      selectedDevelopers.value = filteredValue;

      // 为新添加的参与人设置默认角色
      filteredValue.forEach((id) => {
        if (!participantRoles.value[id]) {
          participantRoles.value[id] = "FD"; // 默认前端开发角色
        }
      });

      // 清理已移除参与人的角色数据
      Object.keys(participantRoles.value).forEach((id) => {
        if (!filteredValue.includes(id)) {
          delete participantRoles.value[id];
        }
      });
    };

    // 参与人角色变化处理
    const handleRoleChange = (participantId: string, role: string) => {
      participantRoles.value[participantId] = role;
    };

    // 删除参与人
    const removeParticipant = (participantId: string) => {
      selectedDevelopers.value = selectedDevelopers.value.filter(
        (id) => id !== participantId,
      );
      delete participantRoles.value[participantId];
    };

    // 计算属性：参与人表格数据
    const participantTableData = computed(() => {
      return selectedDevelopers.value.map((id) => {
        const developer = developerOptions.value.find((dev) => dev.id === id);
        return {
          id,
          name: developer?.name || `用户${id}`,
          occupation: developer?.occupation,
          role: participantRoles.value[id],
          _raw: {
            id,
            name: developer?.name || `用户${id}`,
            occupation: developer?.occupation,
            role: participantRoles.value[id],
          },
        };
      });
    });

    // 项目负责人变化处理
    const handleManagerChange = (value: string) => {
      managerModel.value = value;

      // 如果新选择的项目负责人已经在项目参与人中，将其移除
      if (value && selectedDevelopers.value.includes(value)) {
        selectedDevelopers.value = selectedDevelopers.value.filter(
          (id) => id !== value,
        );
      }
    };

    // UI状态
    const submitting = ref(false);

    const loadDevelopers = () => {
      $network.request(
        "staffDevelopers",
        {},
        (data: any) => {
          pmOptions.value = data.pmList || [];
          developerOptions.value = data.developers || [];
        },
        (_error: any) => {
          $message.error({ message: "获取开发人员列表失败" });
        },
      );
    };

    // 表单验证
    const validateForm = () => {
      if (!nameModel.value.trim()) {
        $message.error({ message: "请输入项目名称" });
        return false;
      }
      if (!startDate.value || !endDate.value) {
        $message.error({ message: "请选择项目周期" });
        return false;
      }

      // 安全地解析日期（Date组件返回YYYY-MM-DD格式的字符串）
      let parsedStartDate: Date | null = null;
      let parsedEndDate: Date | null = null;

      try {
        if (!startDate.value || !endDate.value) {
          throw new Error("Date values are empty");
        }

        const startDateStr = startDate.value?.toString() || "";
        const endDateStr = endDate.value?.toString() || "";

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
      if (!managerModel.value) {
        $message.error({ message: "请选择项目负责人" });
        return false;
      }

      return true;
    };

    // 提交项目
    const handleSubmit = () => {
      if (!validateForm()) return;

      submitting.value = true;

      const projectData = {
        name: nameModel.value.trim(),
        start_date: startDate.value,
        end_date: endDate.value,
        priority: priorityModel.value,
        manager_id: managerModel.value,
        members: selectedDevelopers.value.map((staff_id) => ({
          staff_id,
          role: participantRoles.value[staff_id] || "Frontend", // 使用选择的角色
        })),
      };

      $network.request(
        "projectAdd",
        projectData,
        (_data: any) => {
          $message.success({ message: "项目添加成功" });
          submitting.value = false;

          // 发送项目添加成功事件
          $event.emit("projectAdded", {
            type: "project_added",
            data: projectData,
          });

          // 重置表单
          nameModel.value = "";
          dateRange.value = ["", ""];
          startDate.value = "";
          endDate.value = "";
          priorityModel.value = "Medium";
          managerModel.value = "";
          selectedDevelopers.value = [];
          participantRoles.value = {};
        },
        (error: any) => {
          $message.error({ message: error || "项目添加失败" });
          submitting.value = false;
        },
      );
    };

    onMounted(() => {
      loadDevelopers();
    });

    return () => (
      <div class="project-add">
        {/* 项目名称 */}
        <div class="project-name">
          <Input
            placeHolder={"请输入项目名称"}
            modelValue={nameModel.value}
            onUpdate:modelValue={(value: string) => (nameModel.value = value)}
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
                  modelValue={managerModel.value}
                  onUpdate:modelValue={handleManagerChange}
                  options={pmOptions.value}
                  placeholder="请选择项目负责人"
                  searchable={true}
                  clearable={true}
                  optionLabel="name"
                  optionValue="id"
                />
              </div>
            </div>
            <div class="project-priority">
              <div class="title">项目优先级</div>
              <div class="priority-buttons">
                <button
                  class={`priority-btn low ${priorityModel.value === "Low" ? "active" : ""}`}
                  onClick={() => (priorityModel.value = "Low")}
                >
                  低
                </button>
                <button
                  class={`priority-btn medium ${priorityModel.value === "Medium" ? "active" : ""}`}
                  onClick={() => (priorityModel.value = "Medium")}
                >
                  中
                </button>
                <button
                  class={`priority-btn high ${priorityModel.value === "High" ? "active" : ""}`}
                  onClick={() => (priorityModel.value = "High")}
                >
                  高
                </button>
                <button
                  class={`priority-btn critical ${priorityModel.value === "Critical" ? "active" : ""}`}
                  onClick={() => (priorityModel.value = "Critical")}
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
                modelValue={dateRange.value}
                onUpdate:modelValue={(value: string[]) => {
                  dateRange.value = value;
                  if (value && value.length === 2) {
                    startDate.value = value[0] || "";
                    endDate.value = value[1] || "";
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
              modelValue={selectedDevelopers.value}
              onUpdate:modelValue={handleDevelopersChange}
              options={developerOptions.value}
              placeholder={selectedDevelopersDisplay.value}
              multiple={true}
              searchable={true}
              clearable={true}
              optionLabel="name"
              optionValue="id"
              maxHeight="200px"
            />
          </div>
          <div class="participant-table">
            <Table
              titles={["姓名", "职位", "项目角色"]}
              data={participantTableData.value}
              emptyText="暂无项目参与人"
              columnWidths={{
                2: "280px", // 项目角色列固定宽度150px
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
                onClick: (row: any) => removeParticipant(row.id),
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
                      onClick={() => handleRoleChange(row.id, "FD")}
                    >
                      前端
                    </button>
                    <button
                      class={`role-btn ${row.role === "BD" ? "active" : ""}`}
                      onClick={() => handleRoleChange(row.id, "BD")}
                    >
                      后端
                    </button>
                    <button
                      class={`role-btn ${row.role === "QA" ? "active" : ""}`}
                      onClick={() => handleRoleChange(row.id, "QA")}
                    >
                      测试
                    </button>
                    <button
                      class={`role-btn ${row.role === "UI" ? "active" : ""}`}
                      onClick={() => handleRoleChange(row.id, "UI")}
                    >
                      UI
                    </button>
                    <button
                      class={`role-btn ${row.role === "DevOps" ? "active" : ""}`}
                      onClick={() => handleRoleChange(row.id, "DevOps")}
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
            disabled={submitting.value}
            onClick={handleSubmit}
          >
            {submitting.value ? "提交中..." : "创建项目"}
          </button>
        </div>
      </div>
    );
  },
});
