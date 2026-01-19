/// <reference path="./Developer.d.ts" />

import { defineComponent, onMounted } from "vue";
import { projectConfig } from "./Developer.config.ts";
import Pagination from "@/Components/Paginition/Paginition.tsx";
import Table from "@/Components/Table/Table";
import "./Developer.scss";
import Svg from "@/Components/Svg/Svg.tsx";
import { DeveloperController } from "./Developer.controller.ts";

export default defineComponent({
  name: "ProjectDeveloper",
  props: {
    projectId: {
      type: [String, Number, null],
      required: true,
    },
    isOverdue: {
      type: Boolean,
      default: false,
    },
    projectRole: {
      type: String as () => "M" | "D",
      default: "D",
    },
    globalPermission: {
      type: String,
      default: "",
    },
    projectFeatureRole: {
      type: String as () => "M" | "D",
      default: "D",
    },
    projectQARole: {
      type: String as () => "M" | "D",
      default: "D",
    },
  },
  setup(props) {
    const controller = new DeveloperController(props);

    onMounted(() => {
      controller.init();
    });

    return () => (
      <div class="project-developer" v-loading={!controller.requestComplete.value}>
        {controller.requestComplete.value ? (
          <>
            <div class="project-info">
            {controller.projectDetail.value && (
              <div class="project-header">
                <div class="project-title">
                  <h2>
                    {controller.projectDetail.value.name}
                    {controller.isProjectOverdue.value && <span class="overdue-tag">Delay</span>}
                  </h2>
                  <div class="project-meta">
                    <span class="project-id">项目ID: {controller.projectDetail.value.id}</span>
                    <div class="project-status">
                      <div
                        class="status-dot"
                        style={{
                          backgroundColor: controller.getStatusColor(
                            controller.projectDetail.value.status
                          ),
                        }}
                      ></div>
                      <span>
                        {projectConfig.status[controller.projectDetail.value.status]?.name ||
                          controller.projectDetail.value.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div class="project-list-log">
            <div class="project-list">
              {controller.activeTab.value === "features" &&
                controller.canShowFeatOperator.value && (
                  <div class="project-operator-action">
                    <div class="add-button" onClick={() => controller.handleAddFeature()}>
                      <span>新增功能</span>
                    </div>
                    <div class="export-button" onClick={() => controller.handleExportFeatures()}>
                      {controller.exportingFeatures.value && (
                        <div class="loader">
                          <span class="bar"></span>
                          <span class="bar"></span>
                          <span class="bar"></span>
                        </div>
                      )}
                      <span>{controller.exportingFeatures.value ? "导出中..." : "导出Excel"}</span>
                    </div>
                  </div>
                )}
              {controller.activeTab.value === "bugs" && controller.canShowBugOperator.value && (
                <div class="project-operator-action">
                  <div class="add-button" onClick={() => controller.handleAddBug()}>
                    <span>新增Bug</span>
                  </div>
                </div>
              )}
              <div class="project-details">
                <div class="tab-switcher">
                  <div class="tab-header">
                    <div
                      class={`tab-item ${controller.activeTab.value === "features" ? "active" : ""}`}
                      onClick={() => controller.switchTab("features")}
                    >
                      功能列表 ({controller.featureTotal.value})
                    </div>
                    <div
                      class={`tab-item ${controller.activeTab.value === "bugs" ? "active" : ""}`}
                      onClick={() => controller.switchTab("bugs")}
                    >
                      Bug列表 ({controller.bugTotal.value})
                    </div>
                  </div>

                  <div class="tab-content">
                    <div
                      class={`tab-panel ${controller.activeTab.value === "features" ? "active" : ""}`}
                    >
                      {controller.featureList.value.length > 0 ? (
                        <div class="feature-list">
                          <div class="list-header">
                            <div class="header-cell">功能名称</div>
                            <div class="header-cell">模块</div>
                            <div class="header-cell">优先级</div>
                            <div class="header-cell">状态</div>
                            <div class="header-cell">负责人</div>
                            <div class="header-cell">截止日期</div>
                            <div class="header-cell">操作</div>
                          </div>
                          <div class="list-body">
                            {controller.featureList.value.map((feature: FeatureData) => (
                              <div class="list-row" key={feature.id}>
                                <div class="list-cell">
                                  <div class="feature-name">{feature.name}</div>
                                </div>
                                <div class="list-cell">
                                  <div class="module-tag">{feature.module}</div>
                                </div>
                                <div class="list-cell">
                                  <div
                                    class="priority-tag"
                                    style={{
                                      backgroundColor: controller.getPriorityColor(
                                        feature.priority
                                      ),
                                    }}
                                  >
                                    {projectConfig.priority[feature.priority]?.name ||
                                      feature.priority}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div
                                    class="status-tag"
                                    style={{
                                      backgroundColor: controller.getFeatureStatusColor(
                                        feature.status
                                      ),
                                    }}
                                  >
                                    {projectConfig.featureStatus[feature.status]?.name ||
                                      feature.status}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div class="assignee-name">{feature.assignee_name}</div>
                                </div>
                                <div class="list-cell">
                                  <div class="due-date">
                                    {feature.due_date
                                      ? $date.format(feature.due_date, "YYYY-MM-DD")
                                      : "未设置"}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <Svg
                                    svgPath={PROJECT_DETAIL_BTN}
                                    width="16"
                                    height="16"
                                    class="icon"
                                    fill="#dddddd"
                                    onClick={() => controller.handleFeatureDetail()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div class="pagination-wrapper">
                            <Pagination
                              v-model={controller.featureCurrentPage.value}
                              total={controller.featureTotal.value}
                              pageQuantity={13}
                              maxShow={5}
                            />
                          </div>
                        </div>
                      ) : (
                        <div class="empty-state">
                          <div class="empty-text">暂无功能数据</div>
                        </div>
                      )}
                    </div>

                    <div
                      class={`tab-panel ${controller.activeTab.value === "bugs" ? "active" : ""}`}
                    >
                      {controller.bugList.value.length > 0 ? (
                        <div class="bug-list">
                          <div class="list-header">
                            <div class="header-cell">Bug名称</div>
                            <div class="header-cell">模块</div>
                            <div class="header-cell">严重程度</div>
                            <div class="header-cell">状态</div>
                            <div class="header-cell">负责人</div>
                            <div class="header-cell">报告人</div>
                            <div class="header-cell">操作</div>
                          </div>
                          <div class="list-body">
                            {controller.bugList.value.map((bug: BugData) => (
                              <div class="list-row" key={bug.id}>
                                <div class="list-cell">
                                  <div class="bug-name">{bug.name}</div>
                                </div>
                                <div class="list-cell">
                                  <div class="module-tag">{bug.module}</div>
                                </div>

                                <div class="list-cell">
                                  <div
                                    class="severity-tag"
                                    style={{
                                      backgroundColor: controller.getSeverityColor(bug.severity),
                                    }}
                                  >
                                    {projectConfig.severity[bug.severity]?.name || bug.severity}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div
                                    class="status-tag"
                                    style={{
                                      backgroundColor: controller.getBugStatusColor(bug.status),
                                    }}
                                  >
                                    {projectConfig.bugStatus[bug.status]?.name || bug.status}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div class="assignee-name">{bug.assignee_name}</div>
                                </div>
                                <div class="list-cell">
                                  <div class="reporter-name">{bug.reported_by_name}</div>
                                </div>
                                <div class="list-cell">
                                  <Svg
                                    svgPath={PROJECT_DETAIL_BTN}
                                    width="16"
                                    height="16"
                                    class="icon"
                                    fill="#dddddd"
                                    onClick={() => controller.handleBugDetail()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div class="pagination-wrapper">
                            <Pagination
                              v-model={controller.bugCurrentPage.value}
                              total={controller.bugTotal.value}
                              pageQuantity={13}
                              maxShow={5}
                            />
                          </div>
                        </div>
                      ) : (
                        <div class="empty-state">
                          <div class="empty-text">暂无Bug数据</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="project-log">
              <div class="project-statistics">
                <div class="statistics-number">
                  <div class="detail-content">
                    <div class="detail-item priority-item">
                      <span class="label">项目优先级:</span>
                      <span class="value">
                        <span
                          class="priority-tag-large"
                          style={{
                            backgroundColor: controller.getPriorityColor(
                              controller.projectDetail.value?.priority || "Medium"
                            ),
                          }}
                        >
                          {projectConfig.priority[
                            controller.projectDetail.value?.priority || "Medium"
                          ]?.name ||
                            controller.projectDetail.value?.priority ||
                            "中"}
                        </span>
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">开始日期:</span>
                      <span class="value">
                        {controller.projectDetail.value?.start_date
                          ? $date.format(controller.projectDetail.value.start_date, "YYYY-MM-DD")
                          : "未设置"}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">结束日期:</span>
                      <span class="value">
                        {controller.projectDetail.value?.end_date
                          ? $date.format(controller.projectDetail.value.end_date, "YYYY-MM-DD")
                          : "未设置"}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">项目负责人:</span>
                      <span class="value">
                        <span class="manager-tag">
                          @{controller.projectDetail.value?.manager_name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                {controller.projectDetail.value?.progress > 0 && (
                  <div class="statistics-proportion">
                    <div
                      class="progress-proportion"
                      style={{
                        width: `${controller.projectDetail.value.progress}%`,
                      }}
                    ></div>
                    <div class="progress-text">{controller.projectDetail.value.progress}%</div>
                  </div>
                )}
              </div>

              <div class="project-todo">
                <div class="members-list">
                  <Table
                    titles={
                      controller.canManageMembers.value
                        ? ["姓名", "职位", "项目角色"]
                        : ["姓名", "职位", "项目角色"]
                    }
                    data={controller.membersTableData.value}
                    emptyText="暂无成员"
                    icon={
                      controller.canManageMembers.value
                        ? {
                          svgPath: PROJECT_DETAIL_BTN,
                          width: 14,
                          height: 14,
                          fill: "#dddddd",
                          class: "icon",
                          onClick: (row: any) => controller.handleRemoveMember(row._raw.staff_id),
                        }
                        : undefined
                    }
                    v-slots={{
                      "cell-0": ({ row }: any) => <div class="name-text">{row.name}</div>,
                      "cell-1": ({ row }: any) => {
                        const occupation = row._raw.occupation as keyof typeof projectConfig.role;
                        return (
                          <div
                            class="occupation-tag"
                            style={{
                              backgroundColor: projectConfig.role[occupation]?.color || "#737373",
                            }}
                          >
                            {projectConfig.role[occupation]?.name || row._raw.occupation}
                          </div>
                        );
                      },
                      "cell-2": ({ row }: any) => {
                        const role = row._raw.role as keyof typeof projectConfig.role;
                        return (
                          <div
                            class="role-tag"
                            style={{
                              backgroundColor: projectConfig.role[role]?.color || "#737373",
                            }}
                          >
                            {projectConfig.role[role]?.name || row._raw.role}
                          </div>
                        );
                      },
                    }}
                  />
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
