import {
  defineComponent,
  ref,
  onMounted,
  onUnmounted,
  watch,
  nextTick,
} from "vue";
import "./Excalidraw.scss";

// 基于官方 Excalidraw 的工具类型
const TOOL_TYPE = {
  selection: "selection",
  lasso: "lasso",
  rectangle: "rectangle",
  diamond: "diamond",
  ellipse: "ellipse",
  arrow: "arrow",
  line: "line",
  freedraw: "freedraw",
  text: "text",
  image: "image",
  eraser: "eraser",
  hand: "hand",
  frame: "frame",
  magicframe: "magicframe",
  embeddable: "embeddable",
  laser: "laser",
} as const;

type ToolType = (typeof TOOL_TYPE)[keyof typeof TOOL_TYPE];

interface ExcalidrawElement {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  points?: number[][]; // 用于自由绘制
  text?: string; // 用于文本元素
  angle?: number; // 旋转角度
  opacity?: number; // 透明度
}

interface ExcalidrawData {
  elements: ExcalidrawElement[];
  appState: {
    viewBackgroundColor?: string;
    zoom?: number;
    scrollX?: number;
    scrollY?: number;
  };
}

interface Props {
  data?: ExcalidrawData;
  readOnly?: boolean;
  onChange?: (data: ExcalidrawData) => void;
}

export default defineComponent({
  name: "Excalidraw",
  props: {
    data: {
      type: Object as () => ExcalidrawData,
      default: () => ({
        elements: [],
        appState: { viewBackgroundColor: "transparent" },
      }),
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
    onChange: {
      type: Function as any,
      default: () => {},
    },
  },
  setup(props: Props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const containerRef = ref<HTMLDivElement | null>(null);
    const ctx = ref<CanvasRenderingContext2D | null>(null);
    const isDrawing = ref(false);
    const currentTool = ref<ToolType>(TOOL_TYPE.selection);
    const startPoint = ref({ x: 0, y: 0 });
    const currentElement = ref<ExcalidrawElement | null>(null);

    // 初始化画布
    const initCanvas = () => {
      if (!canvasRef.value) return;

      const canvas = canvasRef.value;
      const container = containerRef.value;
      if (!container) return;

      // 设置画布尺寸
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      ctx.value = canvas.getContext("2d");
      if (ctx.value) {
        ctx.value.fillStyle =
          props.data?.appState?.viewBackgroundColor || "transparent";
        ctx.value.fillRect(0, 0, canvas.width, canvas.height);
        drawElements();
      }
    };

    // 绘制所有元素
    const drawElements = () => {
      if (!ctx.value || !canvasRef.value) return;

      const canvas = canvasRef.value;
      const context = ctx.value;

      // 清空画布
      context.fillStyle =
        props.data?.appState?.viewBackgroundColor || "transparent";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 绘制所有元素
      props.data?.elements.forEach((element) => {
        drawElement(element);
      });
    };

    // 绘制单个元素
    const drawElement = (element: ExcalidrawElement) => {
      if (!ctx.value) return;

      const context = ctx.value;
      context.strokeStyle = element.strokeColor || "#000000";
      context.lineWidth = element.strokeWidth || 2;

      switch (element.type) {
        case TOOL_TYPE.rectangle:
          context.strokeRect(
            element.x,
            element.y,
            element.width,
            element.height,
          );
          break;
        case TOOL_TYPE.ellipse:
          context.beginPath();
          context.arc(
            element.x + element.width / 2,
            element.y + element.height / 2,
            Math.min(element.width, element.height) / 2,
            0,
            2 * Math.PI,
          );
          context.stroke();
          break;
        case TOOL_TYPE.line:
          context.beginPath();
          context.moveTo(element.x, element.y);
          context.lineTo(element.x + element.width, element.y + element.height);
          context.stroke();
          break;
        case TOOL_TYPE.text:
          context.fillStyle = element.strokeColor || "#000000";
          context.font = "16px Arial";
          context.fillText("Text", element.x, element.y);
          break;
      }
    };

    // 获取鼠标位置
    const getMousePos = (e: MouseEvent) => {
      if (!canvasRef.value) return { x: 0, y: 0 };

      const rect = canvasRef.value.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    // 鼠标按下事件
    const handleMouseDown = (e: MouseEvent) => {
      if (props.readOnly || currentTool.value === "selection") return;

      const pos = getMousePos(e);
      isDrawing.value = true;
      startPoint.value = pos;

      currentElement.value = {
        id: Date.now().toString(),
        type: currentTool.value,
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        strokeColor: "#000000",
        strokeWidth: 2,
      };
    };

    // 鼠标移动事件
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing.value || !currentElement.value) return;

      const pos = getMousePos(e);
      currentElement.value.width = pos.x - startPoint.value.x;
      currentElement.value.height = pos.y - startPoint.value.y;

      drawElements();
      drawElement(currentElement.value);
    };

    // 鼠标释放事件
    const handleMouseUp = () => {
      if (!isDrawing.value || !currentElement.value) return;

      isDrawing.value = false;

      // 添加元素到数据中
      const newData: ExcalidrawData = {
        elements: [...(props.data?.elements || []), currentElement.value],
        appState: props.data?.appState || {
          viewBackgroundColor: "transparent",
        },
      };

      props.onChange?.(newData);
      currentElement.value = null;
    };

    // 渲染工具栏（与官方 Excalidraw 完全一致的结构）
    const renderToolbar = () => {
      if (props.readOnly) return null;

      // 工具定义 - 与官方 SHAPES 完全一致
      const tools = [
        {
          value: TOOL_TYPE.selection,
          icon: (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M6 6l4.153 11.793a0.365 .365 0 0 0 .331 .207a0.366 .366 0 0 0 .332 -.207l2.184 -4.793l4.787 -1.994a0.355 .355 0 0 0 .213 -.323a0.355 .355 0 0 0 -.213 -.323l-11.787 -4.36z" />
                <path d="M13.5 13.5l4.5 4.5" />
              </g>
            </svg>
          ),
          key: "V",
          numericKey: "1",
          fillable: true,
          label: "Selection tool",
        },
        {
          value: TOOL_TYPE.rectangle,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <rect x="4" y="4" width="16" height="16" rx="2"></rect>
              </g>
            </svg>
          ),
          key: "R",
          numericKey: "2",
          fillable: true,
          label: "Rectangle",
        },
        {
          value: TOOL_TYPE.diamond,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M10.5 20.4l-6.9 -6.9c-.781 -.781 -.781 -2.219 0 -3l6.9 -6.9c.781 -.781 2.219 -.781 3 0l6.9 6.9c.781 .781 .781 2.219 0 3l-6.9 6.9c-.781 .781 -2.219 .781 -3 0z" />
              </g>
            </svg>
          ),
          key: "D",
          numericKey: "3",
          fillable: true,
          label: "Diamond",
        },
        {
          value: TOOL_TYPE.ellipse,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <circle cx="12" cy="12" r="9" />
              </g>
            </svg>
          ),
          key: "O",
          numericKey: "4",
          fillable: true,
          label: "Ellipse",
        },
        {
          value: TOOL_TYPE.arrow,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 12h14" />
                <path d="M15 16l4-4" />
                <path d="M15 8l4 4" />
              </g>
            </svg>
          ),
          key: "A",
          numericKey: "5",
          fillable: true,
          label: "Arrow",
        },
        {
          value: TOOL_TYPE.line,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <line x1="7" y1="17" x2="17" y2="7" />
              </g>
            </svg>
          ),
          key: "L",
          numericKey: "6",
          fillable: true,
          label: "Line",
        },
        {
          value: TOOL_TYPE.freedraw,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 19c2-1.5 4-2.5 6-2.5s4 .5 6 2.5" />
                <path d="M12 5c-2 0 -3 1 -3 3s1 3 3 3s3 -1 3 -3s-1 -3 -3 -3" />
              </g>
            </svg>
          ),
          key: ["P", "X"],
          numericKey: "7",
          fillable: false,
          label: "Draw",
        },
        {
          value: TOOL_TYPE.text,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <line x1="4" y1="20" x2="7" y2="20" />
                <line x1="10" y1="20" x2="13" y2="20" />
                <line x1="16" y1="20" x2="19" y2="20" />
                <line x1="7" y1="16" x2="7" y2="20" />
                <line x1="17" y1="16" x2="17" y2="20" />
                <polyline points="14,3 14,8 20,8" />
                <line x1="14" y1="12" x2="20" y2="12" />
                <line x1="14" y1="16" x2="20" y2="16" />
              </g>
            </svg>
          ),
          key: "T",
          numericKey: "8",
          fillable: false,
          label: "Text",
        },
        {
          value: TOOL_TYPE.eraser,
          icon: (
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g strokeWidth="1.5">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.4l10 -10a1 1 0 0 1 1.41 0l5.08 5.08a1 1 0 0 1 0 1.41l-9.2 9.26" />
                <path d="M18 13.3l-6.3 -6.3" />
              </g>
            </svg>
          ),
          key: "E",
          numericKey: "0",
          fillable: false,
          label: "Eraser",
        },
      ];

      return (
        <div class="layer-ui__wrapper">
          <div class="FixedSideContainer FixedSideContainer--top">
            <div class="App-menu App-menu_top">
              <div
                class="Stack Stack--col App-menu_top__left"
                style={{ gap: "6px" }}
              >
                <div class="Section shapes-section">
                  <div style={{ position: "relative" }}>
                    <div
                      class="Stack Stack--col"
                      style={{ gap: "4px", alignItems: "flex-start" }}
                    >
                      <div
                        class="Stack Stack--row App-toolbar-container"
                        style={{ gap: "1px" }}
                      >
                        <div
                          class="Island App-toolbar"
                          style={{ padding: "1px" }}
                        >
                          <div class="Stack Stack--row" style={{ gap: "1px" }}>
                            {/* PenModeButton */}
                            <button class={`ToolIcon`} title="Pen mode">
                              <div class="ToolIcon__icon">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g strokeWidth="1.5">
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <path d="M5 19c2-1.5 4-2.5 6-2.5s4 .5 6 2.5" />
                                    <path d="M12 5c-2 0 -3 1 -3 3s1 3 3 3s3 -1 3 -3s-1 -3 -3 -3" />
                                  </g>
                                </svg>
                              </div>
                            </button>

                            {/* LockButton */}
                            <button class={`ToolIcon`} title="Lock">
                              <div class="ToolIcon__icon">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g strokeWidth="1.5">
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <rect
                                      x="5"
                                      y="11"
                                      width="14"
                                      height="10"
                                      rx="2"
                                      ry="2"
                                    />
                                    <circle cx="12" cy="16" r="1" />
                                    <path d="M8 11v-5a4 4 0 0 1 8 0v5" />
                                  </g>
                                </svg>
                              </div>
                            </button>

                            {/* Divider */}
                            <div class="App-toolbar__divider"></div>

                            {/* HandButton */}
                            <button
                              class={`ToolIcon ${currentTool.value === TOOL_TYPE.hand ? "ToolIcon--selected" : ""}`}
                              onClick={() =>
                                (currentTool.value = TOOL_TYPE.hand)
                              }
                              title="Hand — H"
                            >
                              <div class="ToolIcon__icon">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g strokeWidth="1.5">
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <path d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" />
                                    <path d="M11 11.5v-2a1.5 1.5 0 1 1 3 0v2.5" />
                                    <path d="M14 10v-1.5a1.5 1.5 0 0 1 3 0v1.5" />
                                    <path d="M17 11.5v-6.5a1.5 1.5 0 0 1 3 0v6.5" />
                                    <path d="M8 8.5a1.5 1.5 0 0 1 3 0v7.5h-6a1.5 1.5 0 0 1 0 -3h3" />
                                  </g>
                                </svg>
                              </div>
                            </button>

                            {/* ShapesSwitcher - 使用与官方完全相同的循环结构 */}
                            {tools.map((tool) => (
                              <button
                                key={tool.value}
                                class={`ToolIcon Shape ${tool.fillable ? "fillable" : ""} ${currentTool.value === tool.value ? "ToolIcon--selected" : ""}`}
                                onClick={() => (currentTool.value = tool.value)}
                                title={`${tool.label} — ${tool.key} ${tool.numericKey}`}
                                data-testid={`toolbar-${tool.value}`}
                              >
                                <div class="ToolIcon__icon">{tool.icon}</div>
                              </button>
                            ))}

                            {/* Divider */}
                            <div class="App-toolbar__divider"></div>

                            {/* Extra tools dropdown */}
                            <button
                              class={`ToolIcon App-toolbar__extra-tools-trigger ${false ? "App-toolbar__extra-tools-trigger--selected" : ""}`}
                              title="More tools"
                            >
                              <div class="ToolIcon__icon">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <g strokeWidth="1.5">
                                    <path
                                      stroke="none"
                                      d="M0 0h24v24H0z"
                                      fill="none"
                                    />
                                    <circle cx="12" cy="12" r="1" />
                                    <circle cx="12" cy="19" r="1" />
                                    <circle cx="12" cy="5" r="1" />
                                  </g>
                                </svg>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // 监听数据变化
    watch(
      () => props.data,
      () => {
        nextTick(() => {
          drawElements();
        }).then();
      },
      { deep: true },
    );

    // 监听只读状态变化
    watch(
      () => props.readOnly,
      () => {
        if (props.readOnly) {
          currentTool.value = "selection";
        }
      },
    );

    onMounted(() => {
      nextTick(() => {
        initCanvas();

        // 监听窗口大小变化
        window.addEventListener("resize", initCanvas);
      }).then();
    });

    onUnmounted(() => {
      window.removeEventListener("resize", initCanvas);
    });

    return () => (
      <div class="excalidraw" ref={containerRef}>
        <div class="excalidraw__canvas-wrapper">
          <canvas
            ref={canvasRef}
            class="excalidraw-canvas"
            onMousedown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            style={{
              cursor: props.readOnly
                ? "default"
                : currentTool.value === TOOL_TYPE.selection
                  ? "default"
                  : currentTool.value === TOOL_TYPE.hand
                    ? "grab"
                    : "crosshair",
            }}
          />
        </div>
        {renderToolbar()}
        {props.readOnly && (
          <div class="excalidraw-readonly-notice">
            只读模式 - 仅UI角色可编辑
          </div>
        )}
      </div>
    );
  },
});
