/**
 * Token 工具类
 * 用于解析 JWT token 并提取 userID 和 permission
 */
class Token {
    /**
     * 从 token 中解析 payload
     */
    private parseToken(token: string): any {
        try {
            if (!token || typeof token !== "string") {
                return null;
            }

            const parts = token.split(".");
            if (parts.length !== 3) {
                return null;
            }

            const payload = parts[1];
            const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
            return JSON.parse(decoded);
        } catch (error) {
            return null;
        }
    }

    /**
     * 获取 userID
     */
    async getUserId(): Promise<string> {
        try {
            const token = await $storage.get("authorization");
            if (!token || token.trim() === "") {
                return "";
            }

            const payload = this.parseToken(token);
            if (!payload) {
                return "";
            }

            // 支持 userId 和 userID 两种字段名
            return payload.userId || payload.userID || "";
        } catch (error) {
            return "";
        }
    }

    /**
     * 获取 permission
     */
    async getPermission(): Promise<string> {
        try {
            const token = await $storage.get("authorization");
            if (!token || token.trim() === "") {
                return "";
            }

            const payload = this.parseToken(token);
            if (!payload) {
                return "";
            }

            return payload.permission || "";
        } catch (error) {
            return "";
        }
    }

    /**
     * 获取完整的 token
     */
    async getToken(): Promise<string> {
        try {
            return await $storage.get("authorization");
        } catch (error) {
            return "";
        }
    }
}

export default {
    install(app: any) {
        app.config.globalProperties.$token = new Token();
        window.$token = new Token();
    },
};
