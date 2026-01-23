/**
 * 标签页模块配置
 * 定义项目状态颜色和权限背景颜色配置
 */

/** 项目状态颜色配置 */
const projectStatusColor: PSC = {
  /** 规划中状态 - 黄色 */
  Planning: "#feebc3",
  /** 进行中状态 - 绿色 */
  InProgress: "#d5f5e3",
  /** 已完成状态 - 绿色 */
  Completed: "#9ae6b4",
  /** 暂停状态 - 粉色 */
  OnHold: "#fbb6ce",
  /** 已取消状态 - 灰色 */
  Cancelled: "#b9b7b3",
};

/** 权限背景颜色配置 */
const permissionBgColor: PBC = {
  /** 超级管理员权限样式 */
  CEO: {
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
  /** 产品部权限样式 */
  Product: {
    bg: "#B3A095",
    text: "#FFD700",
  },
};

export { projectStatusColor, permissionBgColor };
