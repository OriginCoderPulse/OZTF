/// <reference path="./Tab.d.ts" />

import { defineComponent, onMounted, ref, computed, watch } from "vue";
import { Motion } from "motion-v";
import { permissionBgColor, projectStatusColor } from "./Tab.config";
import ProjectAdd from "../EntryContent/Project/ProjectAdd/ProjectAdd.tsx";
import Svg from "@/Components/Svg/Svg.tsx";
import "./Tab.scss";

export default defineComponent({
  name: "Tab",
  props: {
    tabList: {
      type: Array as () => TabItem[],
      required: true,
    },
  },
  setup(props) {
    const permission = ref("Developer");
    const selectedTab = ref<string>("Home");
    const projectId = ref<string | null>(null);
    const searchText = ref<string>("");
    const expandedProjects = ref<Set<string>>(new Set()); // 存储展开的项目ID
    const selectedUtil = ref<string | null>(null); // 存储当前选中的util项ID

    watch(
      () => props.tabList,
      () => {
        // 响应tabList变化
      },
      { deep: true }
    );

    const permissionStyle = computed(() => {
      // 处理权限值：如果是数组，取第一个；如果是字符串，直接使用
      let permissionKey = permission.value;
      if (Array.isArray(permissionKey)) {
        permissionKey = permissionKey[0] || "CEO";
      }
      if (!permissionKey || typeof permissionKey !== "string") {
        permissionKey = "CEO"; // 默认值
      }

      // 角色名称映射：后端返回的部门名称映射到前端配置
      const roleNameMap: Record<string, keyof typeof permissionBgColor> = {
        Technical: "Dev", // Technical 部门映射到 Dev
        CEO: "CEO",
        RMD: "RMD",
        Finance: "Treasurer",
        Product: "Product",
      };

      const mappedKey = roleNameMap[permissionKey] || permissionKey;

      return (
        permissionBgColor[mappedKey as keyof typeof permissionBgColor] || permissionBgColor.CEO
      ); // 如果找不到，使用 CEO 的样式
    });

    const utilTextShadowStyle = computed(() => {
      const bgColor = permissionStyle.value.bg;
      // 从背景色中提取RGB值来创建文字阴影
      // 这里假设背景色是十六进制格式，我们需要转换为RGB来创建阴影效果
      return `0 0 8px ${bgColor}80, 0 0 16px ${bgColor}40`;
    });

    // 搜索过滤逻辑
    const filteredTabList = computed(() => {
      if (!searchText.value.trim()) {
        return props.tabList;
      }

      return props.tabList.map((tab) => {
        if (tab.name === "Project" && tab.children) {
          const filteredChildren = tab.children.filter((child) =>
            child.name.toLowerCase().includes(searchText.value.toLowerCase().trim())
          );
          return {
            ...tab,
            children: filteredChildren,
          };
        }
        return tab;
      });
    });

    const selectTab = (title: string) => {
      if (title === "Project") return;
      selectedTab.value = title;
      projectId.value = null;
      selectedUtil.value = null; // 清除util项的高亮
      $event.emit("changeTab", title);
    };

    // 实时搜索处理（用户要求只要输入就搜索）
    const handleSearchInput = (event: any) => {
      const value = event.target.value;
      searchText.value = value;
    };

    const clearSearch = () => {
      searchText.value = "";
    };

    const selectUtil = (
      _util: UtilsItem,
      project_id: string,
      isOverdue: boolean,
      roleTitle: string,
      projectName: string
    ) => {
      // 点击util项时直接跳转到Project页面，传递角色title参数
      const utilId = `${project_id}-${roleTitle}`;

      // 设置选中状态，显示文字阴影
      selectedUtil.value = utilId;

      // 设置选中项目并跳转，传递角色title参数
      selectedTab.value = "";
      projectId.value = project_id;
      $event.emit("changeProject", project_id, isOverdue, roleTitle, projectName);
    };

    const selectProject = (child: TabChild) => {
      // 只处理展开/闭合逻辑
      if (child.utils && child.utils.length > 0) {
        // 关闭其他展开的项目
        const currentExpanded = Array.from(expandedProjects.value);
        currentExpanded.forEach((projectId) => {
          if (projectId !== child.id) {
            expandedProjects.value.delete(projectId);
          }
        });

        // 切换当前项目的展开状态
        if (expandedProjects.value.has(child.id)) {
          expandedProjects.value.delete(child.id);
        } else {
          expandedProjects.value.add(child.id);
        }
      }
    };

    const showAddProjectModal = (id: number) => {
      $popup.popup(
        { width: "38%" },
        {
          component: ProjectAdd,
          props: {
            id,
          },
        }
      );
    };

    onMounted(() => {
      $storage
        .get("permission")
        .then((result) => {
          // 处理权限值：如果是数组，取第一个；如果是字符串，直接使用
          let permissionValue: string;
          if (Array.isArray(result)) {
            permissionValue = result[0] || "CEO";
          } else if (typeof result === "string") {
            permissionValue = result;
          } else {
            permissionValue = "CEO"; // 默认值
          }
          permission.value = permissionValue;
        })
        .catch(() => {
          permission.value = "CEO"; // 如果获取失败，使用默认值
        });
    });

    return () => (
      <div class="tab-container">
        <div class="tab-head">
          <div class="logo">
            <img src="http://localhost:1024/oztf/api/v1/static/logo.png" alt="Logo" />
          </div>
          <span>{$config.appName}</span>
          <div
            class="permission"
            style={{
              backgroundColor: permissionStyle.value.bg,
              display: "flex",
              justifyContent: "center",
              alignContent: "center",
              padding: "4px 6px",
              borderRadius: "5px",
            }}
          >
            <span
              style={{
                color: permissionStyle.value.text,
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              {permission.value}
            </span>
          </div>
        </div>
        <div class="tab-list">
          {filteredTabList.value.map((tab) => (
            <div
              key={tab.name}
              class={{
                "tab-item": true,
                active: selectedTab.value === tab.name && tab.name !== "Project",
                "has-children": tab.children && tab.children.length > 0,
              }}
              onClick={() => selectTab(tab.name)}
            >
              <Motion
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.3,
                  delay: props.tabList.indexOf(tab) * 0.1,
                }}
                class="tab-content"
              >
                <div class="tab-header">
                  <div class="tab-icon">
                    {tab.icon ? (
                      <Svg svgPath={tab.icon} width="18" height="18" class="icon" />
                    ) : null}
                  </div>
                  <span
                    class="tab-title"
                    style={{
                      textShadow:
                        tab.name === selectedTab.value
                          ? `0 2px 8px ${permissionStyle.value.bg}`
                          : "",
                    }}
                  >
                    {tab.name}
                  </span>
                  {permission.value === "CEO" && tab.name == "Project" && (
                    <div
                      class={{
                        "fold-icon": true,
                        folded: tab.fold,
                      }}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        showAddProjectModal(tab.id);
                      }}
                    >
                      <Svg
                        svgPath={PROJECT_ADD}
                        width="14"
                        height="14"
                        class="icon"
                        fill="#999999"
                      />
                    </div>
                  )}
                </div>
                {/* 对于Project项，基于原始项目列表判断是否显示；对于其他项，基于过滤后的列表 */}
                {(() => {
                  if (tab.name === "Project") {
                    // 获取原始项目列表（未过滤的）
                    const originalProjectTab = props.tabList.find((t) => t.name === "Project");
                    const hasOriginalProjects =
                      originalProjectTab &&
                      originalProjectTab.children &&
                      originalProjectTab.children.length > 0;

                    if (!hasOriginalProjects) return null;

                    return (
                      <Motion
                        initial={{ height: 0, opacity: 0, padding: 0 }}
                        animate={{
                          height: tab.fold ? 0 : "auto",
                          opacity: tab.fold ? 0 : 1,
                          padding: tab.fold ? 0 : 8,
                          paddingTop: tab.fold ? 0 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        class="children-wrapper"
                      >
                        {/* Project项的搜索框 - 固定在顶部 */}
                        <div class="project-search-container">
                          <input
                            type="text"
                            placeholder="搜索项目..."
                            onInput={handleSearchInput}
                            value={searchText.value}
                          />
                          {searchText.value && (
                            <button onClick={clearSearch} class="clear-search-btn">
                              ✕
                            </button>
                          )}
                        </div>

                        {/* 可滚动的内容区域 */}
                        <div class="children-container">
                          <div class="children-list">
                            {tab.children && tab.children.length > 0 ? (
                              tab.children.map((child) => (
                                <div
                                  key={child.id}
                                  class={{
                                    "child-item": true,
                                    expanded: expandedProjects.value.has(child.id),
                                  }}
                                >
                                  {/* 项目标题和点击区域 */}
                                  <div
                                    class="child-item-header"
                                    onClick={(e: any) => {
                                      e.stopPropagation();
                                      selectProject(child);
                                    }}
                                  >
                                    <Motion
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{
                                        duration: 0.2,
                                        delay: tab.children!.indexOf(child) * 0.05,
                                      }}
                                      class="child-content"
                                    >
                                      <span
                                        class="child-title"
                                        style={{
                                          textShadow:
                                            child.id === projectId.value && !child.utils
                                              ? `0 2px 8px ${permissionStyle.value.bg}`
                                              : "",
                                        }}
                                      >
                                        {child.name}
                                      </span>
                                      <div
                                        class="status-dot"
                                        style={{
                                          backgroundColor:
                                            projectStatusColor[
                                            child.status as keyof typeof projectStatusColor
                                            ] || "#737373",
                                        }}
                                        title={child.status}
                                      ></div>
                                    </Motion>
                                  </div>

                                  {/* utils内容展开区域 */}
                                  {child.utils && child.utils.length > 0 && (
                                    <Motion
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={
                                        expandedProjects.value.has(child.id)
                                          ? { height: "auto", opacity: 1 }
                                          : { height: 0, opacity: 0 }
                                      }
                                      transition={{
                                        duration: 0.3,
                                        ease: "easeInOut",
                                      }}
                                      class="utils-content"
                                    >
                                      <div class="utils-list">
                                        {child.utils.map((util) => {
                                          const utilId = `${child.id}-${util.title}`;
                                          return (
                                            <div
                                              key={util.title}
                                              class={{
                                                "util-item": true,
                                                selected: selectedUtil.value === utilId,
                                              }}
                                              onClick={(e: any) => {
                                                e.stopPropagation();
                                                selectUtil(
                                                  util,
                                                  child.id,
                                                  child.isOverdue || false,
                                                  util.title,
                                                  child.name
                                                );
                                              }}
                                            >
                                              <div class="util-icon">
                                                {util.icon ? (
                                                  <Svg svgPath={util.icon} width="14" height="14" />
                                                ) : null}
                                              </div>
                                              <span
                                                class="util-title"
                                                style={{
                                                  textShadow:
                                                    selectedUtil.value === utilId
                                                      ? utilTextShadowStyle.value
                                                      : "none",
                                                }}
                                              >
                                                {util.title}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </Motion>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div class="no-results">
                                <p>没有找到匹配的项目</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Motion>
                    );
                  } else {
                    // 非Project项，保持原有逻辑
                    if (!tab.children || tab.children.length === 0) return null;

                    return (
                      <Motion
                        initial={{ height: 0, opacity: 0, padding: 0 }}
                        animate={{
                          height: tab.fold ? 0 : "auto",
                          opacity: tab.fold ? 0 : 1,
                          padding: tab.fold ? 0 : 8,
                          paddingTop: tab.fold ? 0 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        class="children-wrapper"
                      >
                        <div class="children-container">
                          <div class="children-list">
                            {tab.children.map((child) => (
                              <div key={child.id} class="child-item">
                                <div class="child-item-header">
                                  <span class="child-title">{child.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Motion>
                    );
                  }
                })()}
              </Motion>
            </div>
          ))}
        </div>
      </div>
    );
  },
});
