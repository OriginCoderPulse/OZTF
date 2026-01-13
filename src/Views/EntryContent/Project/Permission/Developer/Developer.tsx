/// <reference path="./Developer.d.ts" />

import { defineComponent, ref, onMounted, watch, computed } from "vue";
import { projectConfig } from "./Developer.config.ts";
import Pagination from "@/Components/Paginition/Paginition.tsx";
import "./Developer.scss";
import OperationAdd from "@/Views/EntryContent/Project/Permission/Developer/OperationAdd/OperationAdd.tsx";
import BugAdd from "@/Views/EntryContent/Project/Permission/Developer/BugAdd/BugAdd.tsx";
import { invoke } from "@tauri-apps/api/core";
import Svg from "@/Components/Svg/Svg.tsx";

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
  },
  setup(props) {
    const projectDetail = ref<ProjectDetail>({} as ProjectDetail);
    const exportingFeatures = ref(false);

    const featureList = ref<FeatureData[]>([]);
    const bugList = ref<BugData[]>([]);
    const activeTab = ref<"features" | "bugs">("features");

    const featureCurrentPage = ref(1);
    const featureTotal = ref(0);
    const bugCurrentPage = ref(1);
    const bugTotal = ref(0);

    const requestComplete = ref(false);

    const fetchProjectData = () => {
      if (!props.projectId) return;
      requestComplete.value = false;
      $storage.get("userID").then((userID: string) => {
        const requests = [
          {
            urlKey: "projectDetail",
            params: {
              project_id: props.projectId,
              user_id: userID,
            },
            successCallback: (data: any) => {
              projectDetail.value = data;
            },
            failCallback: (error: any) => {
              $message.error({ message: error });
            },
          },
          {
            urlKey: "featureList",
            params: {
              project_id: props.projectId,
              user_id: userID,
              page: 1,
            },
            successCallback: (data: any) => {
              featureList.value = data.features || [];
              featureTotal.value = data.total || 0;
            },
            failCallback: (error: any) => {
              $message.error({ message: error });
            },
          },
          {
            urlKey: "bugList",
            params: {
              project_id: props.projectId,
              user_id: userID,
              page: 1,
            },
            successCallback: (data: any) => {
              bugList.value = data.bugs || [];
              bugTotal.value = data.total || 0;
            },
            failCallback: (error: any) => {
              $message.error({ message: error });
            },
          },
        ];

        $network.batchRequest(requests).then((results) => {
          const failedRequests = results.filter(
            (result) => result.status === "rejected",
          );
          if (failedRequests.length > 0) {
            return;
          }
          requestComplete.value = true;
        });
      });
    };

    watch(featureCurrentPage, (newPage, oldPage) => {
      fetchFeatureList(newPage, oldPage);
    });

    watch(bugCurrentPage, (newPage, oldPage) => {
      fetchBugList(newPage, oldPage);
    });

    const fetchFeatureList = (page = 1, old?: number) => {
      if (!props.projectId) return;

      $storage.get("userID").then((userID: string) => {
        $network.request(
          "featureList",
          {
            project_id: props.projectId,
            user_id: userID,
            page: page,
          },
          (data: any) => {
            featureList.value = data.features || [];
            featureTotal.value = data.total || 0;
          },
          (error: any) => {
            $message.error({ message: error });
            if (old) featureCurrentPage.value = old;
          },
        );
      });
    };

    const fetchBugList = (page = 1, old?: number) => {
      if (!props.projectId) return;

      $storage.get("userID").then((userID: string) => {
        $network.request(
          "bugList",
          {
            project_id: props.projectId,
            user_id: userID,
            page: page,
          },
          (data: any) => {
            bugList.value = data.bugs || [];
            bugTotal.value = data.total || 0;
          },
          (error: any) => {
            $message.error({ message: error });
            if (old) bugCurrentPage.value = old;
          },
        );
      });
    };

    watch(
      () => props.projectId,
      (newId) => {
        if (newId) {
          fetchProjectData();
        } else {
          projectDetail.value = {} as ProjectDetail;
        }
      },
    );

    onMounted(() => {
      if (props.projectId) {
        fetchProjectData();
      }
    });

    const getStatusColor = (status: string) => {
      return projectConfig.status[status]?.color || "#737373";
    };

    const getPriorityColor = (priority: string) => {
      return projectConfig.priority[priority]?.color || "#737373";
    };

    const getFeatureStatusColor = (status: string) => {
      return projectConfig.featureStatus[status]?.color || "#737373";
    };

    const getBugStatusColor = (status: string) => {
      return projectConfig.bugStatus[status]?.color || "#737373";
    };

    const getSeverityColor = (severity: string) => {
      return projectConfig.severity[severity]?.color || "#737373";
    };

    const switchTab = (tab: "features" | "bugs") => {
      activeTab.value = tab;
    };

    const handleBugDetail = () => { };

    const handleFeatureDetail = () => { };

    const canShowFeatOperator = computed(() => {
      if (!projectDetail.value?.user_role) return false;
      const userRole = projectDetail.value.user_role;
      return userRole === "Super" || userRole === "Manager";
    });

    const canAddBug = computed(() => {
      if (!projectDetail.value?.user_role) return false;
      const userRole = projectDetail.value.user_role;

      if (userRole === "Super") return true;

      if (userRole === "Dev") {
        return projectDetail.value.is_tester === true;
      }

      return false;
    });

    const canManageMembers = computed(() => {
      if (!projectDetail.value?.user_role) return false;
      const userRole = projectDetail.value.user_role;
      return userRole === "Super" || userRole === "Manager";
    });

    const handleAddFeature = () => {
      $popup.popup({}, { component: <OperationAdd />, props: {} });
    };

    const handleExportFeatures = () => {
      if (!props.projectId) {
        return;
      }

      if (exportingFeatures.value) {
        return;
      }

      exportingFeatures.value = true;

      const timeoutId = setTimeout(
        () => {
          if (exportingFeatures.value) {
            $message.warning({ message: "导出操作超时，请重试" });
            exportingFeatures.value = false;
          }
        },
        5 * 60 * 1000,
      );

      $storage
        .get("userID")
        .then((userID: string) => {
          $network.request(
            "exportFeatures",
            {
              project_id: props.projectId,
              user_id: userID,
            },
            (data: any) => {
              if (data && data.file_url && data.file_name) {
                try {
                  const baseUrl = "http://localhost:1024";
                  const fullUrl = `${baseUrl}${data.file_url}`;
                  const fileName =
                    data.download_name ||
                    `项目功能列表_${projectDetail.value?.name || "unknown"}.xlsx`;

                  invoke("download_file", {
                    fileUrl: fullUrl,
                    fileName: fileName,
                  })
                    .then(() => {
                      clearTimeout(timeoutId);
                      $message.success({ message: "已保存到下载目录" });
                      exportingFeatures.value = false;
                    })
                    .catch(() => {
                      clearTimeout(timeoutId);
                      $message.error({ message: "导出失败,请再次尝试..." });
                      exportingFeatures.value = false; // 导出失败，重置状态
                    });
                } catch (downloadError) {
                  clearTimeout(timeoutId);
                  $message.error({ message: "初始化失败" });
                  exportingFeatures.value = false;
                }
              } else {
                $message.error({ message: "响应数据不完整" });
                exportingFeatures.value = false;
              }
            },
            (error) => {
              clearTimeout(timeoutId);
              $message.error({ message: error });
              exportingFeatures.value = false;
            },
          );
        })
        .catch(() => {
          clearTimeout(timeoutId);
          $message.error({ message: "获取用户信息失败" });
          exportingFeatures.value = false;
        });
    };

    const handleAddBug = () => {
      $popup.popup({}, { component: <BugAdd />, props: {} });
    };

    const handleRemoveMember = (staffId: string) => {
      $message.info({ message: `已移除成员 ${staffId}` });
    };

    // 检查项目是否延期
    const isProjectOverdue = computed(() => {
      if (!projectDetail.value?.end_date) return false;

      const endDate = new Date(projectDetail.value.end_date);
      const currentDate = new Date();

      // 如果项目状态是已完成，则不显示延期
      if (projectDetail.value.status === "Completed") return false;

      return endDate < currentDate;
    });

    // 排序功能已移除，现在由后端自动排序

    return () =>
      requestComplete.value ? (
        <div class="project-developer">
          <div class="project-info">
            {projectDetail.value && (
              <div class="project-header">
                <div class="project-title">
                  <h2>
                    {projectDetail.value.name}
                    {isProjectOverdue.value && (
                      <span class="overdue-tag">Delay</span>
                    )}
                  </h2>
                  <div class="project-meta">
                    <span class="project-id">
                      项目ID: {projectDetail.value.id}
                    </span>
                    <div class="project-status">
                      <div
                        class="status-dot"
                        style={{
                          backgroundColor: getStatusColor(
                            projectDetail.value.status,
                          ),
                        }}
                      ></div>
                      <span>
                        {projectConfig.status[projectDetail.value.status]
                          ?.name || projectDetail.value.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div class="project-list-log">
            <div class="project-list">
              {activeTab.value === "features" && canShowFeatOperator.value && (
                <div class="project-operator-action">
                  <div class="add-button" onClick={handleAddFeature}>
                    <span>新增功能</span>
                  </div>
                  <div class="export-button" onClick={handleExportFeatures}>
                    {exportingFeatures.value && (
                      <div class="loader">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                      </div>
                    )}
                    <span>
                      {exportingFeatures.value ? "导出中..." : "导出Excel"}
                    </span>
                  </div>
                </div>
              )}
              {activeTab.value === "bugs" && canAddBug.value && (
                <div class="project-operator-action">
                  <div class="add-button" onClick={handleAddBug}>
                    <span>新增Bug</span>
                  </div>
                </div>
              )}
              <div class="project-details">
                <div class="tab-switcher">
                  <div class="tab-header">
                    <div
                      class={`tab-item ${activeTab.value === "features" ? "active" : ""}`}
                      onClick={() => switchTab("features")}
                    >
                      功能列表 ({featureTotal.value})
                    </div>
                    <div
                      class={`tab-item ${activeTab.value === "bugs" ? "active" : ""}`}
                      onClick={() => switchTab("bugs")}
                    >
                      Bug列表 ({bugTotal.value})
                    </div>
                  </div>

                  <div class="tab-content">
                    <div
                      class={`tab-panel ${activeTab.value === "features" ? "active" : ""}`}
                    >
                      {featureList.value.length > 0 ? (
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
                            {featureList.value.map((feature: FeatureData) => (
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
                                      backgroundColor: getPriorityColor(
                                        feature.priority,
                                      ),
                                    }}
                                  >
                                    {projectConfig.priority[feature.priority]
                                      ?.name || feature.priority}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div
                                    class="status-tag"
                                    style={{
                                      backgroundColor: getFeatureStatusColor(
                                        feature.status,
                                      ),
                                    }}
                                  >
                                    {projectConfig.featureStatus[feature.status]
                                      ?.name || feature.status}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div class="assignee-name">
                                    {feature.assignee_name}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div class="due-date">
                                    {feature.due_date
                                      ? $date.format(
                                        feature.due_date,
                                        "YYYY-MM-DD",
                                      )
                                      : "未设置"}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <Svg
                                    svgPath={[
                                      "M340.471368 670.068062 213.842343 800.934598c-7.860015 8.123005-7.647167 21.080108 0.475837 28.939099 3.974521 3.845585 9.104355 5.758144 14.230096 5.758144 5.350868 0 10.695596-2.085498 14.710027-6.235005l126.629026-130.866536c7.860015-8.123005 7.647167-21.080108-0.475837-28.939099C361.288486 661.731186 348.33343 661.943011 340.471368 670.068062z",
                                      "M885.323591 696.367031 653.151787 466.550879l104.736413-108.750843 56.126298-33.29429 9.549493-5.665023 5.351891-9.728572 35.84437-65.154929 14.459317-26.282596-20.817118-21.597901-26.916023-27.926026-22.367427-23.206538-27.720342 16.443507-62.760392 37.228903-9.549493 5.665023-5.351891 9.728572-32.157397 58.453297-103.905488 107.887172-38.46608-38.250162c-12.281721-12.311397-14.742772-35.525098-10.835789-52.164057 10.989285-43.278689 3.306302-89.344864-21.080108-126.633119-0.354064-0.669242-0.756223-1.312902-1.183965-1.941212-0.338714-0.560772-0.694825-1.111311-1.087774-1.64036-15.245216-20.512173-35.366486-37.314861-58.18826-48.589648-22.228257-10.982122-47.089481-16.786315-71.895447-16.786315-10.037611 0-20.122293 0.942465-29.972639 2.800789-7.260357 1.330298-13.43294 6.064113-16.543791 12.7023-3.193739 6.813173-2.821255 14.83487 0.994654 21.456684 0.264013 0.458441 0.546446 0.906649 0.845251 1.343601l57.507762 83.993996-71.761394 49.408293-57.935504-84.119863c-4.137227-6.006807-11.146874-9.362228-18.430768-8.79634-7.271614 0.560772-13.69593 4.950755-16.86204 11.521404-12.231579 25.387203-17.749246 53.513798-15.956414 81.33954 1.854231 28.761044 11.527544 56.522318 28.0171 80.344886 17.827017 25.550932 42.442648 45.239344 71.184249 56.93778 28.008914 11.398608 58.653865 14.748912 88.567151 9.69378 16.243963-2.700505 40.123836 1.543146 52.344159 14.681374l41.735543 45.113477-41.2331 42.813085-0.315178 0.327458-13.899568-14.34573c-7.373944-7.655354-17.379832-12.046361-27.452235-12.046361-8.668427 0-16.736173 3.219321-22.717398 9.066493l-9.538237 10.1952c-7.564279 7.552-12.392238 19.803022-11.919471 30.277584l0.601704 30.620391c-0.081864 0.246617-0.205685 0.544399-0.320295 0.763386l-8.532327 8.853645c-0.297782 0.172939-0.734734 0.369414-1.093914 0.496304l-20.034289-0.594541c-0.477884-0.01535-0.957815-0.023536-1.445932-0.023536-15.0733 0-33.432437 8.022721-43.787272 19.108197L141.771911 737.980801c-31.686676 32.883945-32.921807 85.110423-2.75474 116.421546l50.874691 52.167127c14.370289 14.887059 33.844829 23.083741 54.846142 23.083741 22.01234 0 43.73713-9.325389 59.603493-25.585725l135.108141-139.913587c10.879792-11.296277 18.434861-30.498618 17.965164-45.594431l-0.588401-21.058618c0.156566-0.661056 0.604774-1.711991 0.971118-2.27788l7.611352-7.899924c0.418532-0.264013 1.106194-0.584308 1.62501-0.76134l28.66997 0.910743 0.649799 0.010233c10.162454 0 22.26305-5.186116 29.439496-12.626575l9.482979-9.843182c12.906961-13.396101 11.967566-35.363416-2.181689-50.052976l-11.471262-11.839653 2.198062-2.281973 38.609343-40.089044 222.255966 239.771899c14.800078 15.391549 35.022655 24.219611 55.483662 24.219611 18.73469 0 36.136012-7.248078 49.019437-20.429285C916.625504 775.868713 914.891 727.445864 885.323591 696.367031zM496.732272 646.025483c-0.295735 0.170892-0.728594 0.366344-1.086751 0.49221l-28.646434-0.909719-0.648776-0.010233c-9.883091 0-21.585621 4.824889-29.121248 12.005428l-9.497305 9.828856-0.594541 0.644683c-6.840802 7.735172-11.259438 19.167548-11.259438 29.127388l0.623193 22.562878c0.12075 3.894703-3.024893 12.348236-6.514367 15.97074L275.004331 875.523387c-8.206916 8.387018-19.235087 13.196557-30.267351 13.196557-9.804297 0-18.830881-3.765767-25.419949-10.603499l-50.864458-52.157917c-14.779611-15.391549-13.506619-42.659589 2.761903-59.544141L306.541605 626.593921l0.343831-0.364297c2.638083-2.863211 10.034541-6.126534 13.884218-6.126534l21.589714 0.639566 0.606821 0.00921c10.163477 0 22.264073-5.187139 29.432333-12.620435l8.653077-8.978489c7.648191-7.53972 12.542664-19.882839 12.066827-30.423917l-0.601704-30.620391c0.079818-0.240477 0.200568-0.531096 0.312108-0.747014l3.965312-4.251837L501.45176 641.124869 496.732272 646.025483zM626.297163 494.435972l232.117568 229.773174c14.852266 15.651468 16.549931 39.125089 3.791349 52.338019-5.682419 5.825682-13.524015 9.033747-22.080901 9.033747-10.248412 0-20.512173-4.552689-28.107151-12.43317L589.29134 532.860097 626.297163 494.435972zM448.136483 168.379918l-9.772574 6.733355-26.78811 18.455327-39.772842-58.091046C400.357294 137.116891 427.488211 148.933007 448.136483 168.379918zM466.944851 399.815965c-23.384593-25.14161-61.58052-31.789007-89.116667-27.213805-46.765093 7.900947-92.524277-11.136641-119.375831-49.621141-16.822131-24.302499-23.623024-53.891398-19.967774-82.804914l34.967396 50.771337c0.039909 0.058328 0.079818 0.115634 0.12075 0.171915 12.287861 17.455557 35.237549 22.280446 52.242851 10.987239 0.095167-0.063445 0.189312-0.12689 0.282433-0.191358l89.771583-61.808718c0.11154-0.045025 0.217964-0.100284 0.328481-0.147356 0.193405-0.081864 0.38374-0.168846 0.574075-0.25685 0.316202-0.146333 0.62831-0.300852 0.937348-0.463558 0.184195-0.097214 0.367367-0.193405 0.548492-0.295735 0.326435-0.185218 0.64673-0.38374 0.963954-0.587378 0.149403-0.096191 0.301875-0.186242 0.450255-0.286526 0.460488-0.312108 0.912789-0.639566 1.353834-0.992607l50.887994-35.287691c11.121292 24.376177 13.558807 51.538817 6.752798 78.210269-0.027629 0.10847-0.055259 0.218988-0.080841 0.328481-6.590092 27.731598-2.453888 66.527183 21.703301 90.7427l38.987966 38.770002-32.16456 33.397644L466.944851 399.815965zM494.494301 572.594053l-27.730575-28.770254 237.886969-247.003604 34.759665-63.183018 62.760392-37.228903 26.916023 27.926026-35.84437 65.154929-60.861136 36.102243L494.494301 572.594053z"
                                    ]}
                                    width="16"
                                    height="16"
                                    class="icon"
                                    fill="#dddddd"
                                    onClick={() => handleFeatureDetail()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                          <div class="pagination-wrapper">
                            <Pagination
                              v-model={featureCurrentPage.value}
                              total={featureTotal.value}
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
                      class={`tab-panel ${activeTab.value === "bugs" ? "active" : ""}`}
                    >
                      {bugList.value.length > 0 ? (
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
                            {bugList.value.map((bug: BugData) => (
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
                                      backgroundColor: getSeverityColor(
                                        bug.severity,
                                      ),
                                    }}
                                  >
                                    {projectConfig.severity[bug.severity]
                                      ?.name || bug.severity}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div
                                    class="status-tag"
                                    style={{
                                      backgroundColor: getBugStatusColor(
                                        bug.status,
                                      ),
                                    }}
                                  >
                                    {projectConfig.bugStatus[bug.status]
                                      ?.name || bug.status}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div class="assignee-name">
                                    {bug.assignee_name}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <div class="reporter-name">
                                    {bug.reported_by_name}
                                  </div>
                                </div>
                                <div class="list-cell">
                                  <Svg
                                    svgPath={[
                                      "M340.471368 670.068062 213.842343 800.934598c-7.860015 8.123005-7.647167 21.080108 0.475837 28.939099 3.974521 3.845585 9.104355 5.758144 14.230096 5.758144 5.350868 0 10.695596-2.085498 14.710027-6.235005l126.629026-130.866536c7.860015-8.123005 7.647167-21.080108-0.475837-28.939099C361.288486 661.731186 348.33343 661.943011 340.471368 670.068062z",
                                      "M885.323591 696.367031 653.151787 466.550879l104.736413-108.750843 56.126298-33.29429 9.549493-5.665023 5.351891-9.728572 35.84437-65.154929 14.459317-26.282596-20.817118-21.597901-26.916023-27.926026-22.367427-23.206538-27.720342 16.443507-62.760392 37.228903-9.549493 5.665023-5.351891 9.728572-32.157397 58.453297-103.905488 107.887172-38.46608-38.250162c-12.281721-12.311397-14.742772-35.525098-10.835789-52.164057 10.989285-43.278689 3.306302-89.344864-21.080108-126.633119-0.354064-0.669242-0.756223-1.312902-1.183965-1.941212-0.338714-0.560772-0.694825-1.111311-1.087774-1.64036-15.245216-20.512173-35.366486-37.314861-58.18826-48.589648-22.228257-10.982122-47.089481-16.786315-71.895447-16.786315-10.037611 0-20.122293 0.942465-29.972639 2.800789-7.260357 1.330298-13.43294 6.064113-16.543791 12.7023-3.193739 6.813173-2.821255 14.83487 0.994654 21.456684 0.264013 0.458441 0.546446 0.906649 0.845251 1.343601l57.507762 83.993996-71.761394 49.408293-57.935504-84.119863c-4.137227-6.006807-11.146874-9.362228-18.430768-8.79634-7.271614 0.560772-13.69593 4.950755-16.86204 11.521404-12.231579 25.387203-17.749246 53.513798-15.956414 81.33954 1.854231 28.761044 11.527544 56.522318 28.0171 80.344886 17.827017 25.550932 42.442648 45.239344 71.184249 56.93778 28.008914 11.398608 58.653865 14.748912 88.567151 9.69378 16.243963-2.700505 40.123836 1.543146 52.344159 14.681374l41.735543 45.113477-41.2331 42.813085-0.315178 0.327458-13.899568-14.34573c-7.373944-7.655354-17.379832-12.046361-27.452235-12.046361-8.668427 0-16.736173 3.219321-22.717398 9.066493l-9.538237 10.1952c-7.564279 7.552-12.392238 19.803022-11.919471 30.277584l0.601704 30.620391c-0.081864 0.246617-0.205685 0.544399-0.320295 0.763386l-8.532327 8.853645c-0.297782 0.172939-0.734734 0.369414-1.093914 0.496304l-20.034289-0.594541c-0.477884-0.01535-0.957815-0.023536-1.445932-0.023536-15.0733 0-33.432437 8.022721-43.787272 19.108197L141.771911 737.980801c-31.686676 32.883945-32.921807 85.110423-2.75474 116.421546l50.874691 52.167127c14.370289 14.887059 33.844829 23.083741 54.846142 23.083741 22.01234 0 43.73713-9.325389 59.603493-25.585725l135.108141-139.913587c10.879792-11.296277 18.434861-30.498618 17.965164-45.594431l-0.588401-21.058618c0.156566-0.661056 0.604774-1.711991 0.971118-2.27788l7.611352-7.899924c0.418532-0.264013 1.106194-0.584308 1.62501-0.76134l28.66997 0.910743 0.649799 0.010233c10.162454 0 22.26305-5.186116 29.439496-12.626575l9.482979-9.843182c12.906961-13.396101 11.967566-35.363416-2.181689-50.052976l-11.471262-11.839653 2.198062-2.281973 38.609343-40.089044 222.255966 239.771899c14.800078 15.391549 35.022655 24.219611 55.483662 24.219611 18.73469 0 36.136012-7.248078 49.019437-20.429285C916.625504 775.868713 914.891 727.445864 885.323591 696.367031zM496.732272 646.025483c-0.295735 0.170892-0.728594 0.366344-1.086751 0.49221l-28.646434-0.909719-0.648776-0.010233c-9.883091 0-21.585621 4.824889-29.121248 12.005428l-9.497305 9.828856-0.594541 0.644683c-6.840802 7.735172-11.259438 19.167548-11.259438 29.127388l0.623193 22.562878c0.12075 3.894703-3.024893 12.348236-6.514367 15.97074L275.004331 875.523387c-8.206916 8.387018-19.235087 13.196557-30.267351 13.196557-9.804297 0-18.830881-3.765767-25.419949-10.603499l-50.864458-52.157917c-14.779611-15.391549-13.506619-42.659589 2.761903-59.544141L306.541605 626.593921l0.343831-0.364297c2.638083-2.863211 10.034541-6.126534 13.884218-6.126534l21.589714 0.639566 0.606821 0.00921c10.163477 0 22.264073-5.187139 29.432333-12.620435l8.653077-8.978489c7.648191-7.53972 12.542664-19.882839 12.066827-30.423917l-0.601704-30.620391c0.079818-0.240477 0.200568-0.531096 0.312108-0.747014l3.965312-4.251837L501.45176 641.124869 496.732272 646.025483zM626.297163 494.435972l232.117568 229.773174c14.852266 15.651468 16.549931 39.125089 3.791349 52.338019-5.682419 5.825682-13.524015 9.033747-22.080901 9.033747-10.248412 0-20.512173-4.552689-28.107151-12.43317L589.29134 532.860097 626.297163 494.435972zM448.136483 168.379918l-9.772574 6.733355-26.78811 18.455327-39.772842-58.091046C400.357294 137.116891 427.488211 148.933007 448.136483 168.379918zM466.944851 399.815965c-23.384593-25.14161-61.58052-31.789007-89.116667-27.213805-46.765093 7.900947-92.524277-11.136641-119.375831-49.621141-16.822131-24.302499-23.623024-53.891398-19.967774-82.804914l34.967396 50.771337c0.039909 0.058328 0.079818 0.115634 0.12075 0.171915 12.287861 17.455557 35.237549 22.280446 52.242851 10.987239 0.095167-0.063445 0.189312-0.12689 0.282433-0.191358l89.771583-61.808718c0.11154-0.045025 0.217964-0.100284 0.328481-0.147356 0.193405-0.081864 0.38374-0.168846 0.574075-0.25685 0.316202-0.146333 0.62831-0.300852 0.937348-0.463558 0.184195-0.097214 0.367367-0.193405 0.548492-0.295735 0.326435-0.185218 0.64673-0.38374 0.963954-0.587378 0.149403-0.096191 0.301875-0.186242 0.450255-0.286526 0.460488-0.312108 0.912789-0.639566 1.353834-0.992607l50.887994-35.287691c11.121292 24.376177 13.558807 51.538817 6.752798 78.210269-0.027629 0.10847-0.055259 0.218988-0.080841 0.328481-6.590092 27.731598-2.453888 66.527183 21.703301 90.7427l38.987966 38.770002-32.16456 33.397644L466.944851 399.815965zM494.494301 572.594053l-27.730575-28.770254 237.886969-247.003604 34.759665-63.183018 62.760392-37.228903 26.916023 27.926026-35.84437 65.154929-60.861136 36.102243L494.494301 572.594053z"
                                    ]}
                                    width="16"
                                    height="16"
                                    class="icon"
                                    fill="#dddddd"
                                    onClick={() => handleBugDetail()}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div class="pagination-wrapper">
                            <Pagination
                              v-model={bugCurrentPage.value}
                              total={bugTotal.value}
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
                            backgroundColor: getPriorityColor(
                              projectDetail.value?.priority || "Medium",
                            ),
                          }}
                        >
                          {projectConfig.priority[
                            projectDetail.value?.priority || "Medium"
                          ]?.name ||
                            projectDetail.value?.priority ||
                            "中"}
                        </span>
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">开始日期:</span>
                      <span class="value">
                        {projectDetail.value?.start_date
                          ? $date.format(
                            projectDetail.value.start_date,
                            "YYYY-MM-DD",
                          )
                          : "未设置"}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">结束日期:</span>
                      <span class="value">
                        {projectDetail.value?.end_date
                          ? $date.format(
                            projectDetail.value.end_date,
                            "YYYY-MM-DD",
                          )
                          : "未设置"}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">项目负责人:</span>
                      <span class="value">
                        <span class="manager-tag">
                          @{projectDetail.value?.manager_name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                {projectDetail.value?.progress > 0 && (
                  <div class="statistics-proportion">
                    <div
                      class="progress-proportion"
                      style={{
                        width: `${projectDetail.value.progress}%`,
                      }}
                    ></div>
                    <div class="progress-text">
                      {projectDetail.value.progress}%
                    </div>
                  </div>
                )}
              </div>

              <div class="project-todo">
                <div class="members-list">
                  <div class="table-header">
                    <div class="header-cell">姓名</div>
                    <div class="header-cell">职位</div>
                    <div class="header-cell">项目角色</div>
                    {canManageMembers.value && (
                      <div class="header-cell">操作</div>
                    )}
                  </div>
                  <div class="table-body">
                    {(projectDetail.value?.members || []).map(
                      (member: ProjectMember) => (
                        <div class="table-row" key={member.staff_id}>
                          <div class="table-cell">
                            <div class="name-text">{member.name}</div>
                          </div>
                          <div class="table-cell">
                            <div class="occupation-text">
                              {member.occupation}
                            </div>
                          </div>
                          <div class="table-cell">
                            <div
                              class="role-tag"
                              style={{
                                backgroundColor:
                                  projectConfig.role[member.role]?.color ||
                                  "#737373",
                              }}
                            >
                              {projectConfig.role[member.role]?.name ||
                                member.role}
                            </div>
                          </div>
                          {canManageMembers.value && (
                            <div class="table-cell">
                              <Svg
                                svgPath={[
                                  "M340.471368 670.068062 213.842343 800.934598c-7.860015 8.123005-7.647167 21.080108 0.475837 28.939099 3.974521 3.845585 9.104355 5.758144 14.230096 5.758144 5.350868 0 10.695596-2.085498 14.710027-6.235005l126.629026-130.866536c7.860015-8.123005 7.647167-21.080108-0.475837-28.939099C361.288486 661.731186 348.33343 661.943011 340.471368 670.068062z",
                                  "M885.323591 696.367031 653.151787 466.550879l104.736413-108.750843 56.126298-33.29429 9.549493-5.665023 5.351891-9.728572 35.84437-65.154929 14.459317-26.282596-20.817118-21.597901-26.916023-27.926026-22.367427-23.206538-27.720342 16.443507-62.760392 37.228903-9.549493 5.665023-5.351891 9.728572-32.157397 58.453297-103.905488 107.887172-38.46608-38.250162c-12.281721-12.311397-14.742772-35.525098-10.835789-52.164057 10.989285-43.278689 3.306302-89.344864-21.080108-126.633119-0.354064-0.669242-0.756223-1.312902-1.183965-1.941212-0.338714-0.560772-0.694825-1.111311-1.087774-1.64036-15.245216-20.512173-35.366486-37.314861-58.18826-48.589648-22.228257-10.982122-47.089481-16.786315-71.895447-16.786315-10.037611 0-20.122293 0.942465-29.972639 2.800789-7.260357 1.330298-13.43294 6.064113-16.543791 12.7023-3.193739 6.813173-2.821255 14.83487 0.994654 21.456684 0.264013 0.458441 0.546446 0.906649 0.845251 1.343601l57.507762 83.993996-71.761394 49.408293-57.935504-84.119863c-4.137227-6.006807-11.146874-9.362228-18.430768-8.79634-7.271614 0.560772-13.69593 4.950755-16.86204 11.521404-12.231579 25.387203-17.749246 53.513798-15.956414 81.33954 1.854231 28.761044 11.527544 56.522318 28.0171 80.344886 17.827017 25.550932 42.442648 45.239344 71.184249 56.93778 28.008914 11.398608 58.653865 14.748912 88.567151 9.69378 16.243963-2.700505 40.123836 1.543146 52.344159 14.681374l41.735543 45.113477-41.2331 42.813085-0.315178 0.327458-13.899568-14.34573c-7.373944-7.655354-17.379832-12.046361-27.452235-12.046361-8.668427 0-16.736173 3.219321-22.717398 9.066493l-9.538237 10.1952c-7.564279 7.552-12.392238 19.803022-11.919471 30.277584l0.601704 30.620391c-0.081864 0.246617-0.205685 0.544399-0.320295 0.763386l-8.532327 8.853645c-0.297782 0.172939-0.734734 0.369414-1.093914 0.496304l-20.034289-0.594541c-0.477884-0.01535-0.957815-0.023536-1.445932-0.023536-15.0733 0-33.432437 8.022721-43.787272 19.108197L141.771911 737.980801c-31.686676 32.883945-32.921807 85.110423-2.75474 116.421546l50.874691 52.167127c14.370289 14.887059 33.844829 23.083741 54.846142 23.083741 22.01234 0 43.73713-9.325389 59.603493-25.585725l135.108141-139.913587c10.879792-11.296277 18.434861-30.498618 17.965164-45.594431l-0.588401-21.058618c0.156566-0.661056 0.604774-1.711991 0.971118-2.27788l7.611352-7.899924c0.418532-0.264013 1.106194-0.584308 1.62501-0.76134l28.66997 0.910743 0.649799 0.010233c10.162454 0 22.26305-5.186116 29.439496-12.626575l9.482979-9.843182c12.906961-13.396101 11.967566-35.363416-2.181689-50.052976l-11.471262-11.839653 2.198062-2.281973 38.609343-40.089044 222.255966 239.771899c14.800078 15.391549 35.022655 24.219611 55.483662 24.219611 18.73469 0 36.136012-7.248078 49.019437-20.429285C916.625504 775.868713 914.891 727.445864 885.323591 696.367031zM496.732272 646.025483c-0.295735 0.170892-0.728594 0.366344-1.086751 0.49221l-28.646434-0.909719-0.648776-0.010233c-9.883091 0-21.585621 4.824889-29.121248 12.005428l-9.497305 9.828856-0.594541 0.644683c-6.840802 7.735172-11.259438 19.167548-11.259438 29.127388l0.623193 22.562878c0.12075 3.894703-3.024893 12.348236-6.514367 15.97074L275.004331 875.523387c-8.206916 8.387018-19.235087 13.196557-30.267351 13.196557-9.804297 0-18.830881-3.765767-25.419949-10.603499l-50.864458-52.157917c-14.779611-15.391549-13.506619-42.659589 2.761903-59.544141L306.541605 626.593921l0.343831-0.364297c2.638083-2.863211 10.034541-6.126534 13.884218-6.126534l21.589714 0.639566 0.606821 0.00921c10.163477 0 22.264073-5.187139 29.432333-12.620435l8.653077-8.978489c7.648191-7.53972 12.542664-19.882839 12.066827-30.423917l-0.601704-30.620391c0.079818-0.240477 0.200568-0.531096 0.312108-0.747014l3.965312-4.251837L501.45176 641.124869 496.732272 646.025483zM626.297163 494.435972l232.117568 229.773174c14.852266 15.651468 16.549931 39.125089 3.791349 52.338019-5.682419 5.825682-13.524015 9.033747-22.080901 9.033747-10.248412 0-20.512173-4.552689-28.107151-12.43317L589.29134 532.860097 626.297163 494.435972zM448.136483 168.379918l-9.772574 6.733355-26.78811 18.455327-39.772842-58.091046C400.357294 137.116891 427.488211 148.933007 448.136483 168.379918zM466.944851 399.815965c-23.384593-25.14161-61.58052-31.789007-89.116667-27.213805-46.765093 7.900947-92.524277-11.136641-119.375831-49.621141-16.822131-24.302499-23.623024-53.891398-19.967774-82.804914l34.967396 50.771337c0.039909 0.058328 0.079818 0.115634 0.12075 0.171915 12.287861 17.455557 35.237549 22.280446 52.242851 10.987239 0.095167-0.063445 0.189312-0.12689 0.282433-0.191358l89.771583-61.808718c0.11154-0.045025 0.217964-0.100284 0.328481-0.147356 0.193405-0.081864 0.38374-0.168846 0.574075-0.25685 0.316202-0.146333 0.62831-0.300852 0.937348-0.463558 0.184195-0.097214 0.367367-0.193405 0.548492-0.295735 0.326435-0.185218 0.64673-0.38374 0.963954-0.587378 0.149403-0.096191 0.301875-0.186242 0.450255-0.286526 0.460488-0.312108 0.912789-0.639566 1.353834-0.992607l50.887994-35.287691c11.121292 24.376177 13.558807 51.538817 6.752798 78.210269-0.027629 0.10847-0.055259 0.218988-0.080841 0.328481-6.590092 27.731598-2.453888 66.527183 21.703301 90.7427l38.987966 38.770002-32.16456 33.397644L466.944851 399.815965zM494.494301 572.594053l-27.730575-28.770254 237.886969-247.003604 34.759665-63.183018 62.760392-37.228903 26.916023 27.926026-35.84437 65.154929-60.861136 36.102243L494.494301 572.594053z"
                                ]}
                                width="14"
                                height="14"
                                class="icon"
                                fill="#dddddd"
                                onClick={() =>
                                  handleRemoveMember(member.staff_id)
                                }
                              />
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div class="project-developer-empty">
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
        </div>
      );
  },
});
