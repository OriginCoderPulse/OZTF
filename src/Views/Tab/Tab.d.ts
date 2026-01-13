/**
 * 标签页模块类型定义
 * 定义标签页相关的数据结构接口
 */

/** utils角色项接口 */
interface UtilsItem {
  /** 角色标题 */
  title: string;
  /** 角色图标（可以是字符串、字符串数组或null） */
  icon: string | string[] | null;
}

/** 标签页子项接口 */
interface TabChild {
  /** 子项唯一标识 */
  id: string;
  /** 子项标题 */
  name: string;
  /** 子项状态 */
  status: string;
  /** 是否超时 */
  isOverdue?: boolean;
  /** utils角色列表（可选，用于Super用户或项目负责人） */
  utils?: UtilsItem[];
  /** 项目角色标识（可选，用于普通成员） */
  pr?: string;
}

/** 标签页项接口 */
interface TabItem {
  /** 标签页唯一标识 */
  id: number;
  /** 标签页组件名称 */
  name: string;
  /** 是否折叠 */
  fold: boolean;
  /** 标签页图标（可以是字符串、字符串数组或null） */
  icon: string | string[] | null;
  /** 子项列表（可选） */
  children?: TabChild[];
}

/** 项目状态颜色接口 */
interface PSC {
  /** 进行中状态颜色 */
  "In Progress": string;
  /** 待处理状态颜色 */
  Pending: string;
  /** 检查中状态颜色 */
  Checking: string;
  /** 完成状态颜色 */
  Completed: string;
}

/** 权限背景颜色接口 */
interface PBC {
  [key: string]: PBCC;
}

/** 权限背景颜色配置接口 */
interface PBCC {
  /** 背景颜色 */
  bg: string;
  /** 文字颜色 */
  text: string;
}
