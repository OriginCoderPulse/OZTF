/// <reference path="./MeetCreate.d.ts" />

import { defineComponent, onMounted } from "vue";
import "./MeetCreate.scss";
import Input from "@Form/Input/Input.tsx";
import TextArea from "@Form/TextArea/TextArea.tsx";
import Date from "@Form/Date/Date.tsx";
import Selector from "@Form/Selector/Selector.tsx";
import { MeetCreateController } from "./MeetCreate.controller.ts";

export default defineComponent({
  name: "MeetCreate",
  props: {
    popup_id: {
      type: String,
      default: "",
    },
  },
  setup(props) {
    const controller = new MeetCreateController();

    // 设置弹窗ID
    if (props.popup_id) {
      controller.popupId.value = props.popup_id;
    }

    onMounted(() => {
      controller.init();
    });

    return () => (
      <div class="meet-create">
        <div class="meet-create-header">
          <div class="meet-create-title">创建会议</div>
        </div>
        <div class="meet-create-form">
          {/* 会议主题 */}
          <div class="form-item">
            <div class="form-label">会议主题</div>
            <div class="form-input">
              <Input
                placeHolder="请输入会议主题"
                modelValue={controller.topic.value}
                onUpdate:modelValue={(value: string) => (controller.topic.value = value)}
                clearable={true}
              />
            </div>
          </div>

          {/* 会议描述 */}
          <div class="form-item">
            <div class="form-label">会议描述</div>
            <div class="form-input">
              <TextArea
                placeHolder="请输入会议描述（可选）"
                modelValue={controller.description.value}
                onUpdate:modelValue={(value: string) => (controller.description.value = value)}
                clearable={true}
                rows={4}
                resize="none"
              />
            </div>
          </div>

          {/* 开始时间 */}
          <div class="form-item">
            <div class="form-label">开始时间</div>
            <div class="form-input">
              <Date
                modelValue={
                  controller.startTime.value ? controller.startTime.value.toISOString() : null
                }
                onChange={(value: Date | null) => {
                  controller.startTime.value = value;
                }}
                placeholder="请选择会议开始时间"
                format="YYYY-MM-DD HH:mm"
                dateType="single"
                showTime={true}
              />
            </div>
          </div>

          {/* 会议时长 */}
          <div class="form-item">
            <div class="form-label">会议时长</div>
            <div class="form-input">
              <Selector
                modelValue={controller.duration.value}
                onUpdate:modelValue={(value: number) => {
                  controller.duration.value = value;
                }}
                options={controller.durationOptions.value}
                placeholder="请选择会议时长"
                multiple={false}
                searchable={false}
                clearable={false}
                optionLabel="label"
                optionValue="value"
                emptyText="暂无选项"
              />
            </div>
          </div>

          {/* 会议密码 */}
          <div class="form-item">
            <div class="form-label">会议密码</div>
            <div class="form-input">
              <Input
                type="password"
                placeHolder="请输入会议密码（可选）"
                modelValue={controller.password.value}
                onUpdate:modelValue={(value: string) => (controller.password.value = value)}
                clearable={true}
              />
            </div>
          </div>

          {/* 内部参会人 */}
          <div class="form-item">
            <div class="form-label">参会人</div>
            <div class="form-input">
              <Selector
                modelValue={controller.innerParticipants.value}
                onUpdate:modelValue={(value: string[]) =>
                  controller.handleParticipantsChange(value)
                }
                options={controller.staffOptions.value}
                placeholder="请选择内部参会人（可选）"
                multiple={true}
                searchable={true}
                clearable={true}
                optionLabel="name"
                optionValue="id"
                emptyText={controller.loadingStaff.value ? "加载中..." : "暂无员工"}
                disabled={controller.loadingStaff.value}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div class="form-actions">
            <button
              class="btn btn-submit"
              onClick={() => controller.submit()}
              disabled={controller.submitting.value}
            >
              {controller.submitting.value ? "创建中..." : "创建会议"}
            </button>
          </div>
        </div>
      </div>
    );
  },
});
