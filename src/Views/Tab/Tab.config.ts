/**
 * 标签页模块配置
 * 定义项目状态颜色和权限背景颜色配置
 */

/** 项目状态颜色配置 */
const projectStatusColor: PSC = {
  /** 规划中状态 - 黄色 */
  Planning: "#ffe066",
  /** 进行中状态 - 绿色 */
  InProgress: "#93dab2",
  /** 已完成状态 - 蓝色 */
  Completed: "#93c5da",
  /** 暂停状态 - 橙色 */
  OnHold: "#f98f71",
  /** 已取消状态 - 灰色 */
  Cancelled: "#b9b7b3",
};

/** 权限背景颜色配置 */
const permissionBgColor: PBC = {
  /** 超级管理员权限样式 */
  Super: {
    bg: "#B2A190",
    text: "#FFE5C9",
  },
  /** 开发者权限样式 */
  Dev: {
    bg: "#91ADB3",
    text: "#C9E4FF",
  },
  /** 资源管理部权限样式 */
  RMD: {
    bg: "#A095B3",
    text: "#CFC9FF",
  },
  /** 财务权限样式 */
  Treasurer: {
    bg: "#B3A095",
    text: "#FFE5C9",
  },
};

export { projectStatusColor, permissionBgColor };
