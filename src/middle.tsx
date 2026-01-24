import { defineComponent, onMounted, onUnmounted, ref } from "vue";
import router from "@/router";
import { useRoute } from "vue-router";

export default defineComponent({
    name: "Middle",
    setup() {
        const route = useRoute();
        const timer = ref<NodeJS.Timeout | null>(null);

        onMounted(() => {
            // 从路由查询参数中获取目标路由名称
            const targetRoute = route.query.target as string;
            timer.value = setTimeout(() => {
                router.replace({ name: targetRoute });
            }, 0);
        });

        onUnmounted(() => {
            if (timer.value) {
                clearTimeout(timer.value);
            }
        });

        return () => (
            <div style={{ width: "100%", height: "100%", backgroundColor: "rgba(37, 37, 37, 0.49)" }}></div>
        );
    },
});