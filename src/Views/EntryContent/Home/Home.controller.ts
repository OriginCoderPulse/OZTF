import { ref } from "vue";

export class HomeController {
  public permission = ref("");

  /**
   * 初始化 - 在组件 onMounted 时调用
   */
  public init() {
    $token.getPermission().then((res) => {
      this.permission.value = res;
    });
  }
}
