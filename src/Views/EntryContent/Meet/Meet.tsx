/// <reference path="./Meet.d.ts" />

import { defineComponent, onMounted } from "vue";
import "./Meet.scss";
import { motion, Motion } from "motion-v";
import { MeetController } from "./Meet.controller.ts";
import { meetConfig } from "./Meet.config.ts";

export default defineComponent({
  name: "Meet",
  props: {},
  setup() {
    const controller = new MeetController();

    onMounted(() => {
      controller.initMeetList();
    });

    return () => (
      <div class="meet">
        <div class="meet-operation">
          <Motion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeInOut" }}
            whileHover={{
              scale: 1.03,
              y: -2,
              transition: { duration: 0.2, ease: "easeInOut" },
            }}
            class="meet-create meet-btn"
            onClick={() => controller.handleCreateMeet()}
          >
            创建会议
          </Motion>
          <Motion
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeInOut" }}
            whileHover={{
              scale: 1.03,
              y: -2,
              transition: { duration: 0.2, ease: "easeInOut" },
            }}
            class="meet-join meet-btn"
            onClick={() => controller.handleJoinMeet()}
          >
            加入会议
          </Motion>
        </div>
        {!controller.meetListLoading.value ? controller.meetList.value.length > 0 ? (
          <div class="meet-record ">
            {controller.meetList.value.map((meet: any) => (
              <div class="meet-record-item">
                <div className="record-item-header">
                  <div className="record-item-header-title">
                    {meet.topic}
                  </div>
                  <div className="record-item-header-status" style={{ backgroundColor: meetConfig.status[meet.status as keyof MeetStatus].bg }}>
                    {meetConfig.status[meet.status as keyof MeetStatus].name}
                  </div>
                </div>
                <div className="record-item-content">
                  <div className="content-item">
                    <div className="item-title">会议ID</div>
                    <div className="item-value">{meet.meetId}</div>
                  </div>
                  <div className="content-item">
                    <div className="item-title">会议时间</div>
                    <div className="item-value">{$date.format(meet.startTime, "YYYY-MM-DD hh:mm:ss")}</div>
                  </div>
                  <div className="content-item">
                    <div className="item-title">会议时长</div>
                    <div className="item-value">{meet.duration}分钟</div>
                  </div>
                  <div className="content-item">
                    <div className="item-title">会议说明</div>
                    <div className="item-value">{meet.description}</div>
                  </div>
                </div>
                {controller.canConcludeAndCancelMeet(meet.meetID) || controller.canEnterMeet(meet.meetID) && (
                  <div className="record-item-footer-button">
                  {controller.canEnterMeet(meet.meetId) && (
                    <div className="enter-button">
                      入会
                    </div>
                  )}
                  {controller.canConcludeAndCancelMeet(meet.meetId) && (
                    <div className="conclude-button">
                      结会
                    </div>
                  )}
                  {controller.canConcludeAndCancelMeet(meet.meetId) && (
                    <div className="cancel-button">
                      取消
                    </div>
                  )}
                </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div class="meet-empty">暂无会议纪录</div>
        ) : (
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              class="meet-loading"
            >
              <div class="spinner-container">
                <div class="spinner">
                  <div class="spinner">
                    <div class="spinner">
                      <div class="spinner">
                        <div class="spinner">
                          <div class="spinner"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
        )}
      </div>
    );
  },
});
