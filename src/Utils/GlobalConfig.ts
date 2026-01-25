class GlobalConfig {
  appName = "壹零贰肆";
  baseUrl = "http://localhost:1024/oztf/api/v1/"
  meetWebBaseURL = "https://oztf.site/";
  wsUrl = "http://localhost:1024";
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
    projectGetRole: {
      method: "POST",
      path: ["project", "getRole"],
      retry: true,
      cache: false,
    },
    meetCreateRoom: {
      method: "POST",
      path: ["meet", "create-room"],
      retry: false,
      cache: false,
    },
    meetGetRoom: {
      method: "POST",
      path: ["meet", "get-room"],
      retry: false,
      cache: false,
    },
    meetStatusChange: {
      method: "POST",
      path: ["meet", "status-change"],
      retry: false,
      cache: false,
    },
    meetAddInnerParticipant: {
      method: "POST",
      path: ["meet", "add-inner-participant"],
      retry: false,
      cache: false,
    },
    meetRemoveInnerParticipant: {
      method: "POST",
      path: ["meet", "remove-inner-participant"],
      retry: false,
      cache: false,
    },
    meetGetRoomProperties: {
      method: "POST",
      path: ["meet", "get-room-properties"],
      retry: false,
      cache: false,
    },
    meetGenerateUserSig: {
      method: "POST",
      path: ["meet", "generate-usersig"],
      retry: false,
      cache: false,
    },
    qrcodeGenerate: {
      method: "POST",
      path: ["qrcode", "generate"],
      retry: false,
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
