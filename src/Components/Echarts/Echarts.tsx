import { defineComponent, onMounted, onUnmounted, ref, watch } from "vue";
import * as echarts from "echarts";
import "./Echarts.scss";

// 导入配置
import { staffConfig } from "@/Views/EntryContent/Staff/Staff.config";
import { projectConfig } from "@/Views/EntryContent/Project/Project.config";

interface ChartData {
  name: string;
  value: number;
  percentage?: number;
}

interface EChartsProps {
  type: "pie" | "bar";
  data: ChartData[];
  title?: string;
  height?: string;
  showGrid?: boolean;
}

export default defineComponent({
  name: "ECharts",
  props: {
    type: {
      type: String as () => "pie" | "bar",
      required: true,
    },
    data: {
      type: Array as () => ChartData[],
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    height: {
      type: String,
      default: "400px",
    },
    showGrid: {
      type: Boolean,
      default: true,
    },
  },
  setup(props: EChartsProps) {
    const chartRef = ref<HTMLDivElement>();
    let chartInstance: echarts.ECharts | null = null;

    const initChart = () => {
      if (!chartRef.value) return;

      // 销毁之前的实例
      if (chartInstance) {
        chartInstance.dispose();
      }

      // 创建新的实例
      chartInstance = echarts.init(chartRef.value);

      // 设置配置
      const option = getChartOption();
      chartInstance.setOption(option);

      // 响应式调整
      const resizeObserver = new ResizeObserver(() => {
        chartInstance?.resize();
      });
      resizeObserver.observe(chartRef.value);
    };

    const getChartOption = () => {
      // 根据图表类型获取对应的颜色配置
      let chartColors: string[] = [];

      if (props.type === "pie") {
        // 环形图使用部门颜色
        chartColors = Object.values(staffConfig.department).map((dept) => dept.color);
      } else {
        // 柱状图使用优先级颜色，映射到5个等级
        const priorityColors = Object.values(projectConfig.priority).map(
          (priority) => priority.color
        );
        // 为5个薪资等级分配优先级颜色
        chartColors = [
          priorityColors[0], // Low - 一级
          priorityColors[1], // Medium - 二级
          priorityColors[2], // High - 三级
          priorityColors[3], // Critical - 四级
          priorityColors[1], // Medium - 五级 (循环使用)
        ];
      }

      if (props.type === "pie") {
        return {
          title: {
            text: props.title,
            left: "center",
            top: 0,
            textStyle: {
              color: "#666",
              fontSize: 16,
              fontWeight: "bold",
            },
          },
          tooltip: {
            show: false, // 禁用tooltip
          },
          legend: {
            orient: "vertical",
            right: 0,
            top: "center",
            textStyle: {
              color: "#666",
              fontSize: 12,
            },
            itemWidth: 12,
            itemHeight: 12,
            itemGap: 8,
            // 移除图例边框
            borderWidth: 0,
            padding: 0,
          },
          series: [
            {
              name: props.title,
              type: "pie",
              radius: ["35%", "60%"],
              center: ["30%", "55%"],
              avoidLabelOverlap: false,
              padAngle: 2, // 在每个扇形之间添加角度间距
              itemStyle: {
                borderRadius: 5,
                borderWidth: 10, // 设置边框宽度
                borderColor: "transparent", // 使用白色边框创建扇形间距
              },
              label: {
                show: false,
              },
              emphasis: {
                label: {
                  show: false,
                },
                itemStyle: {
                  borderWidth: 0,
                },
              },
              labelLine: {
                show: false,
              },
              data: props.data.map((item, index) => ({
                value: item.value,
                name: item.name,
                itemStyle: {
                  color: chartColors[index % chartColors.length],
                },
              })),
            },
          ],
        };
      } else {
        // 柱状图
        return {
          title: {
            text: props.title,
            left: "center",
            top: 0,
            textStyle: {
              color: "#666",
              fontSize: 16,
              fontWeight: "bold",
            },
          },
          tooltip: {
            show: false, // 禁用tooltip
          },
          grid: {
            left: "3%",
            right: "4%",
            bottom: "10%",
            top: "35%", // 进一步增加顶部间距，让标题和图表之间距离更大
            containLabel: true,
          },
          xAxis: {
            type: "category",
            data: props.data.map((item) => item.name),
            axisTick: {
              alignWithLabel: true,
            },
            axisLabel: {
              color: "#666",
              fontSize: 12,
              rotate: 0,
            },
            axisLine: {
              show: false, // 隐藏x轴线
            },
          },
          yAxis: {
            type: "value",
            minInterval: 1, // 最小间隔为1，确保只显示整数
            axisLabel: {
              color: "#666",
              fontSize: 12,
              formatter: (value: number) => {
                // 确保返回整数，不显示小数
                return Math.round(value).toString();
              },
            },
            axisLine: {
              lineStyle: {
                color: "#ddd",
              },
            },
            splitLine: false, // 不显示网格线
          },
          series: [
            {
              name: props.title,
              type: "bar",
              barWidth: "35%",
              data: props.data.map((item, index) => ({
                value: item.value,
                itemStyle: {
                  color: chartColors[index % chartColors.length],
                  borderRadius: [2, 2, 0, 0],
                },
                label: {
                  show: item.value > 0, // 只有值大于0时才显示标签
                  position: "top",
                  color: "#666",
                  fontSize: 11,
                  fontWeight: "normal",
                },
              })),
            },
          ],
        };
      }
    };

    // 监听数据变化
    watch(
      () => props.data,
      () => {
        if (chartInstance) {
          const option = getChartOption();
          chartInstance.setOption(option);
        }
      },
      { deep: true }
    );

    // 监听类型变化
    watch(
      () => props.type,
      () => {
        if (chartInstance) {
          const option = getChartOption();
          chartInstance.setOption(option);
        }
      }
    );

    onMounted(() => {
      initChart();
    });

    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
    });

    return () => (
      <div
        ref={chartRef}
        class="echarts-container"
        style={{ width: "100%", height: props.height }}
      />
    );
  },
});
