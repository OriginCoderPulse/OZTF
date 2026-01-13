export const projectConfig: {
  status: { [key: string]: { name: string; color: string } };
  priority: { [key: string]: { name: string; color: string } };
  role: { [key: string]: { name: string; color: string } };
  featureStatus: { [key: string]: { name: string; color: string } };
  bugStatus: { [key: string]: { name: string; color: string } };
  severity: { [key: string]: { name: string; color: string } };
} = {
  status: {
    Planning: {
      name: "规划中",
      color: "#feebc356",
    },
    InProgress: {
      name: "进行中",
      color: "#d5f5e356",
    },
    Completed: {
      name: "已完成",
      color: "#9ae6b456",
    },
    OnHold: {
      name: "暂停",
      color: "#fbb6ce56",
    },
    Cancelled: {
      name: "已取消",
      color: "#b9b7b356",
    },
  },
  priority: {
    Low: {
      name: "低",
      color: "#9ae6b456",
    },
    Medium: {
      name: "中",
      color: "#feebc356",
    },
    High: {
      name: "高",
      color: "#fbb6ce56",
    },
    Critical: {
      name: "紧急",
      color: "#fed7d756",
    },
  },
  role: {
    // 完整名称映射（用于前端选择）
    UI: {
      name: "UI设计师",
      color: "#fdebd056",
    },
    DevOps: {
      name: "运维工程师",
      color: "#fed7d756",
    },
    // 简写代码映射（用于后端返回的数据显示）
    FD: {
      name: "前端开发",
      color: "#9ae6b456",
    },
    BD: {
      name: "后端开发",
      color: "#d6bcfa56",
    },
    QA: {
      name: "测试工程师",
      color: "#feebc356",
    },
    FSD: {
      name: "全栈开发",
      color: "#b4d8e156",
    },
  },
  featureStatus: {
    InProgress: {
      name: "进行中",
      color: "#d5f5e356",
    },
    Testing: {
      name: "测试中",
      color: "#fbb6ce56",
    },
    Done: {
      name: "已完成",
      color: "#9ae6b456",
    },
    Cancelled: {
      name: "已取消",
      color: "#b9b7b356",
    },
  },
  bugStatus: {
    Open: {
      name: "待处理",
      color: "#fed7d756",
    },
    InProgress: {
      name: "处理中",
      color: "#d5f5e356",
    },
    PendingVerification: {
      name: "待验证",
      color: "#fdebd056",
    },
    PendingRelease: {
      name: "待发布",
      color: "#d6bcfa56",
    },
    Resolved: {
      name: "已解决",
      color: "#9ae6b456",
    },
    Closed: {
      name: "已关闭",
      color: "#b9b7b356",
    },
    Reopened: {
      name: "重新打开",
      color: "#feebc356",
    },
  },
  severity: {
    Low: {
      name: "低",
      color: "#9ae6b456",
    },
    Medium: {
      name: "中",
      color: "#feebc356",
    },
    High: {
      name: "高",
      color: "#fbb6ce56",
    },
    Critical: {
      name: "严重",
      color: "#fed7d756",
    },
  },
};
