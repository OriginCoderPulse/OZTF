/// <reference path="./Meet.d.ts" />

import { defineComponent, onMounted, onUnmounted } from "vue";
import "./Meet.scss";
import { motion, Motion } from "motion-v";
import { MeetController } from "./Meet.controller.ts";
import { meetConfig } from "./Meet.config.ts";
import Svg from "@/Components/Svg/Svg.tsx";

export default defineComponent({
  name: "Meet",
  props: {},
  setup() {
    const controller = new MeetController();

    onMounted(() => {
      controller.init();
      controller.initMeetList();
    });

    onUnmounted(() => {
      controller.destroy();
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
            class="meet-create-btn meet-btn"
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
            class="meet-join-btn meet-btn"
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
                    <div className="item-value" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>{meet.meetId}</span>
                      <div
                        style={{ cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        onClick={(e: Event) => {
                          e.stopPropagation();
                          controller.copyMeetingInfo(meet);
                        }}
                      >
                        <Svg
                          svgPath={[
                            'M878.272 981.312H375.36a104.64 104.64 0 0 1-104.64-104.64V375.36c0-57.792 46.848-104.64 104.64-104.64h502.912c57.792 0 104.64 46.848 104.64 104.64v502.912c-1.6 56.192-48.448 103.04-104.64 103.04z m-502.912-616.96a10.688 10.688 0 0 0-10.944 11.008v502.912c0 6.208 4.672 10.88 10.88 10.88h502.976c6.208 0 10.88-4.672 10.88-10.88V375.36a10.688 10.688 0 0 0-10.88-10.944H375.36z',
                            'M192.64 753.28h-45.312a104.64 104.64 0 0 1-104.64-104.64V147.328c0-57.792 46.848-104.64 104.64-104.64h502.912c57.792 0 104.64 46.848 104.64 104.64v49.92a46.016 46.016 0 0 1-46.848 46.912 46.08 46.08 0 0 1-46.848-46.848v-49.984a10.688 10.688 0 0 0-10.944-10.944H147.328a10.688 10.688 0 0 0-10.944 10.88v502.976c0 6.208 4.672 10.88 10.88 10.88h45.312a46.08 46.08 0 0 1 46.848 46.912c0 26.496-21.824 45.248-46.848 45.248z'
                          ]}
                          width="12"
                          height="12"
                          class="copy-icon"
                          fill="#dddddd"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="content-item">
                    <div className="item-title">会议时间</div>
                    <div className="item-value">{$date.format(meet.startTime, "YYYY-MM-DD HH:mm:ss")}</div>
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
                {(controller.canConcludeMeet(meet.meetId) || controller.canEnterMeet(meet.meetId) || controller.canCancelMeet(meet.meetId)) && (
                  <div className="record-item-footer-button">
                    {controller.canEnterMeet(meet.meetId) && (
                      <div 
                        className="enter-button" 
                        onClick={async () => {
                          if (controller.isCurrentMeeting(meet.meetId)) {
                            await controller.handleReturnToMeet();
                          } else {
                            await controller.handleEnterMeet(meet.meetId, meet.topic);
                          }
                        }}
                      >
                        {controller.isCurrentMeeting(meet.meetId) ? "返回" : "入会"}
                      </div>
                    )}
                    {controller.canConcludeMeet(meet.meetId) && (
                      <div 
                        className="conclude-button"
                        onClick={() => controller.handleConcludeMeet(meet.meetId)}
                      >
                        结会
                      </div>
                    )}
                    {controller.canCancelMeet(meet.meetId) && (
                      <div 
                        className="cancel-button"
                        onClick={() => controller.handleCancelMeet(meet.meetId)}
                      >
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
