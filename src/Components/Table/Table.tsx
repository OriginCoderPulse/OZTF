import { defineComponent, computed, Fragment } from "vue";
import Pagenition from "@/Components/Paginition/Paginition";
import Svg from "@/Components/Svg/Svg";
import "./Table.scss";

export default defineComponent({
  name: "Table",
  props: {
    // 列标题数组，必须和列数一致
    titles: {
      type: Array as () => string[],
      required: true,
      validator: (value: string[]) => value.length > 0,
    },
    // 数据数组，每个元素是一个对象，对象的键对应列
    data: {
      type: Array as () => Record<string, any>[],
      default: () => [],
    },
    // 最后一列的图标配置
    icon: {
      type: Object as () => {
        svgPath?:
          | string
          | string[]
          | ((row: Record<string, any>, index: number) => string | string[]);
        width?: number | string;
        height?: number | string;
        fill?: string | ((row: Record<string, any>, index: number) => string);
        stroke?: string;
        strokeWidth?: number | string;
        strokeLinecap?: string;
        viewBox?: string;
        class?: string;
        onClick?: (row: Record<string, any>, index: number) => void;
      },
      default: null,
    },
    // 页码位置：left, right, center
    pageNumPosition: {
      type: String as () => "left" | "right" | "center",
      default: "center",
    },
    // 总数据量
    total: {
      type: Number,
      default: 0,
    },
    // 每页数量
    pageQuantity: {
      type: Number,
      default: 15,
    },
    // 当前页码
    modelValue: {
      type: Number,
      default: 1,
    },
    // 空数据提示
    emptyText: {
      type: String,
      default: "暂无数据",
    },
    // 列宽度配置，可以按列索引（从0开始）或列名（title）指定固定宽度
    // 例如: { 0: "100px", 2: "150px" } 或 { "姓名": "100px", "部门": "150px" }
    // 未指定的列将平均分配剩余宽度
    columnWidths: {
      type: Object as () => Record<number | string, string | number>,
      default: () => ({}),
    },
  },
  emits: ["update:modelValue", "pageChange"],
  setup(props, { emit, slots }) {
    const currentPage = computed({
      get: () => props.modelValue,
      set: (val: number) => {
        emit("update:modelValue", val);
        emit("pageChange", val);
      },
    });

    // 获取列的宽度
    const getColumnWidth = (colIndex: number, title?: string) => {
      // 先检查是否通过列索引指定了宽度
      if (props.columnWidths[colIndex] !== undefined) {
        const width = props.columnWidths[colIndex];
        return typeof width === "number" ? `${width}px` : width;
      }

      // 再检查是否通过列名指定了宽度
      if (title && props.columnWidths[title] !== undefined) {
        const width = props.columnWidths[title];
        return typeof width === "number" ? `${width}px` : width;
      }

      // 如果没有指定宽度，返回null，后续会计算平均宽度
      return null;
    };

    // 计算每列的宽度（考虑固定宽度列）
    const columnWidths = computed(() => {
      const widths: (string | null)[] = [];

      // 为所有列（包括操作列）获取宽度配置
      for (let i = 0; i < props.titles.length; i++) {
        const width = getColumnWidth(i, props.titles[i]);
        widths[i] = width;
      }

      // 如果有操作列，也检查是否指定了宽度
      if (props.icon) {
        const actionColIndex = props.titles.length;
        const width = getColumnWidth(actionColIndex, "···");
        widths[actionColIndex] = width;
      }

      return widths;
    });

    // 计算每行的高度（基于pageQuantity，即使数据少也保持固定高度）
    const rowHeight = computed(() => {
      return `${100 / props.pageQuantity}%`;
    });

    // 渲染单元格内容
    const renderCellContent = (
      row: Record<string, any>,
      title: string,
      colIndex: number,
      rowIndex: number
    ) => {
      // 如果提供了自定义插槽，使用插槽
      const slotName = `cell-${colIndex}`;
      if (slots[slotName]) {
        return slots[slotName]({ row, title, colIndex, rowIndex });
      }
      // 否则直接显示数据
      return row[title] ?? "-";
    };

    return () => {
      const titles = props.icon ? [...props.titles, "···"] : props.titles;

      return (
        <div class="custom-table">
          {/* 表头 */}
          <div class="table-header">
            {titles.map((title, index) => {
              const width = index < columnWidths.value.length ? columnWidths.value[index] : null;
              return (
                <div
                  key={`header-${index}`}
                  class="table-header-cell"
                  style={width ? { width, flexShrink: 0 } : { flex: 1 }}
                >
                  {title}
                </div>
              );
            })}
          </div>

          {/* 表体 */}
          <div class="table-body" style={{ "--row-height": rowHeight.value } as any}>
            {props.data.length > 0 ? (
              <Fragment>
                {props.data.map((row, rowIndex) => (
                  <div
                    key={`row-${rowIndex}`}
                    class="table-row"
                    style={{ height: rowHeight.value }}
                  >
                    {/* 数据列 */}
                    {props.titles.map((title, colIndex) => {
                      const width =
                        colIndex < columnWidths.value.length ? columnWidths.value[colIndex] : null;
                      return (
                        <div
                          key={`cell-${rowIndex}-${colIndex}`}
                          class="table-cell"
                          style={width ? { width, flexShrink: 0 } : { flex: 1 }}
                        >
                          {renderCellContent(row, title, colIndex, rowIndex)}
                        </div>
                      );
                    })}
                    {/* 操作列（如果有icon） */}
                    {props.icon &&
                      (() => {
                        const svgPath =
                          typeof props.icon.svgPath === "function"
                            ? props.icon.svgPath(row, rowIndex)
                            : props.icon.svgPath;
                        const fill =
                          typeof props.icon.fill === "function"
                            ? props.icon.fill(row, rowIndex)
                            : props.icon.fill;

                        const isCEO =
                          row._raw?.department === "CEO" && row._raw?.occupation === "CEO";

                        return (
                          <div
                            class="table-cell table-cell-action"
                            style={
                              columnWidths.value[props.titles.length]
                                ? { width: columnWidths.value[props.titles.length], flexShrink: 0 }
                                : { flex: 1 }
                            }
                          >
                            <div
                              class={props.icon.class || "table-icon"}
                              onClick={() => {
                                if (props.icon?.onClick && !isCEO) {
                                  props.icon.onClick(row, rowIndex);
                                }
                              }}
                              style={{
                                cursor: props.icon.onClick && !isCEO ? "pointer" : "not-allowed",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {svgPath ? (
                                <Svg
                                  svgPath={svgPath}
                                  width={props.icon.width || 14}
                                  height={props.icon.height || 14}
                                  fill={fill}
                                  stroke={props.icon.stroke}
                                  strokeWidth={props.icon.strokeWidth}
                                  strokeLinecap={props.icon.strokeLinecap}
                                  viewBox={props.icon.viewBox}
                                  class="icon"
                                />
                              ) : (
                                "-"
                              )}
                            </div>
                          </div>
                        );
                      })()}
                  </div>
                ))}
                {/* 当数据少于pageQuantity时，添加占位行以保持固定行高 */}
                {Array.from({ length: Math.max(0, props.pageQuantity - props.data.length) }).map(
                  (_, index) => (
                    <div
                      key={`placeholder-${index}`}
                      class="table-row table-row-placeholder"
                      style={{ height: rowHeight.value }}
                    >
                      {props.titles.map((_, colIndex) => {
                        const width =
                          colIndex < columnWidths.value.length
                            ? columnWidths.value[colIndex]
                            : null;
                        return (
                          <div
                            key={`placeholder-cell-${index}-${colIndex}`}
                            class="table-cell"
                            style={width ? { width, flexShrink: 0 } : { flex: 1 }}
                          ></div>
                        );
                      })}
                      {props.icon && (
                        <div
                          class="table-cell table-cell-action"
                          style={
                            columnWidths.value[props.titles.length]
                              ? { width: columnWidths.value[props.titles.length], flexShrink: 0 }
                              : { flex: 1 }
                          }
                        ></div>
                      )}
                    </div>
                  )
                )}
              </Fragment>
            ) : (
              <div class="table-empty">{props.emptyText}</div>
            )}
          </div>

          {/* 分页 */}
          {props.total > 0 && (
            <div
              class="table-pagination"
              style={{
                justifyContent:
                  props.pageNumPosition === "left"
                    ? "flex-start"
                    : props.pageNumPosition === "right"
                      ? "flex-end"
                      : "center",
              }}
            >
              <Pagenition
                total={props.total}
                pageQuantity={props.pageQuantity}
                v-model={currentPage.value}
              />
            </div>
          )}
        </div>
      );
    };
  },
});
