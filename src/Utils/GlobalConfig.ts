class GlobalConfig {
  appName = "壹零贰肆";
  urls = {
    initial: {
      method: "POST",
      path: ["initial"],
      retry: true,
      cache: false,
    },
    staffInfo: {
      method: "POST",
      path: ["staff", "info"],
      retry: true,
      cache: true,
    },
    projectDetail: {
      method: "POST",
      path: ["project", "detail"],
      retry: true,
      cache: true,
    },
    projectAdd: {
      method: "POST",
      path: ["project", "add"],
      retry: false,
      cache: false,
    },
    featureList: {
      method: "POST",
      path: ["feature", "list"],
      retry: true,
      cache: true,
    },
    bugList: {
      method: "POST",
      path: ["bug", "list"],
      retry: true,
      cache: true,
    },
    staffDevelopers: {
      method: "POST",
      path: ["staff", "developers"],
      retry: true,
      cache: true,
    },
    changeStaffStatus: {
      method: "POST",
      path: ["staff", "change-status"],
      retry: false,
      cache: false,
    },
    projectFeatureExport: {
      method: "POST",
      path: ["project", "feature", "export"],
      retry: false,
      cache: false,
    },
    departmentStats: {
      method: "POST",
      path: ["staff", "department-stats"],
      retry: true,
      cache: true,
    },
    salaryLevelStats: {
      method: "POST",
      path: ["staff", "salary-level-stats"],
      retry: true,
      cache: true,
    },
    projectGetRole: {
      method: "POST",
      path: ["project", "getRole"],
      retry: true,
      cache: false,
    },
  };
}

export default {
  install(app: any) {
    app.config.globalProperties.$config = new GlobalConfig();
    window.$config = new GlobalConfig();
  },
};
