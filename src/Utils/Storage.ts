/**
 * Storage 工具类 - 使用 IndexedDB 存储数据
 */
class Storage {
  private dbName = "OZTF_Storage";
  private dbVersion = 1;
  private storeName = "keyValueStore";
  private db: IDBDatabase | null = null;

  /**
   * 初始化 IndexedDB
   */
  private async initDB(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error("打开 IndexedDB 失败"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<string> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);

        request.onerror = () => {
          reject(new Error(`获取 ${key} 失败`));
        };

        request.onsuccess = () => {
          const result = request.result;
          if (result === undefined) {
            resolve("");
          } else if (typeof result === "string") {
            resolve(result);
          } else {
            resolve(JSON.stringify(result));
          }
        };
      });
    } catch (err: Error | any) {
      console.error(`[Storage.get] Error:`, err);
      return "";
    }
  }

  /**
   * 设置值
   */
  async set(key: string, value: any): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const valueToStore = typeof value === "string" ? value : JSON.stringify(value);
        const request = store.put(valueToStore, key);

        request.onerror = () => {
          reject(new Error(`设置 ${key} 失败`));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (err: Error | any) {
      console.error(`[Storage.set] Error:`, err);
      throw new Error(err?.message || "设置存储失败");
    }
  }

  /**
   * 删除值
   */
  async remove(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);

        request.onerror = () => {
          reject(new Error(`删除 ${key} 失败`));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (err: Error | any) {
      console.error(`[Storage.remove] Error:`, err);
      throw new Error(err?.message || "删除存储失败");
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onerror = () => {
          reject(new Error("清空存储失败"));
        };

        request.onsuccess = () => {
          resolve();
        };
      });
    } catch (err: Error | any) {
      console.error(`[Storage.clearAll] Error:`, err);
      throw new Error(err?.message || "清空存储失败");
    }
  }
}

export default {
  install(app: any) {
    app.config.globalProperties.$storage = new Storage();
    window.$storage = new Storage();
  },
};
