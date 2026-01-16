import { defineComponent, Fragment, onMounted, onUnmounted } from "vue";
import "./MeetRoom.scss";
import { Motion } from "motion-v";
import Svg from "@/Components/Svg/Svg.tsx";
import { MeetRoomController } from "./MeetRoom.controller.ts";
import { useRoute } from "vue-router";

export default defineComponent({
  name: "MeetRoom",
  setup() {
    const controller = new MeetRoomController();
    const route = useRoute();
    let meetId: string = "";

    onMounted(() => {
      const roomId = route.params.roomId as string;
      if (roomId) {
        meetId = roomId;
        try {
          const numericRoomId = $roomformat.roomIdToNumber(roomId);
          controller.initRoom(roomId, numericRoomId);
        } catch (error: any) {
          console.error('RoomId 转换失败:', error);
          $message.error({
            message: '会议ID格式错误: ' + (error?.message || '未知错误'),
          });
        }
      }
    });

    onUnmounted(() => {
      // 组件卸载时，尝试删除内部参与人
      if (meetId) {
        controller.cleanup(meetId).catch(console.error);
      }
    });

    return () => (
      <div class="meet-room">
        <div class="meet-main">
          <div id="meet-video" class="meet-video">
            <div
              class="show-participant"
              onClick={() => controller.toggleParticipant()}
            >
              <Motion
                animate={{
                  rotate: controller.showParticipant.value ? 180 : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                class="motion-show-participant"
              >
                <Svg
                  svgPath={['M576 672c-6.4 0-19.2 0-25.6-6.4l-128-128c-12.8-12.8-12.8-32 0-44.8l128-128c12.8-12.8 32-12.8 44.8 0s12.8 32 0 44.8L492.8 512l102.4 102.4c12.8 12.8 12.8 32 0 44.8C595.2 672 582.4 672 576 672z']}
                  width="24"
                  height="24"
                  class="icon"
                  fill={'#dddddd'}
                />
              </Motion>
            </div>
          </div>
          <Motion
            initial={{ width: 0, height: "100%", marginLeft: 0 }}
            animate={{
              width: controller.showParticipant.value ? "20%" : 0,
              height: "100%",
              marginLeft: controller.showParticipant.value ? 15 : 0,
            }}
            exit={{ width: 0, height: "100%", marginLeft: 0, padding: 10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            class="meet-participant"
          >

            {controller.participantList.value
              .filter(participant => participant.participantId !== controller.userId.value)
              .map(participant => {
                const videoState = controller.getParticipantVideoState(participant.participantId);
                return (
                  <div id={`${participant.participantId}_remote_video`} class="meet-participant-video">
                    {!videoState && (
                      <div class="video-placeholder">
                        <Svg
                          svgPath="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z m-32-196h64v-64h-64v64z m0-128h64V320h-64v320z"
                          width="48"
                          height="48"
                          fill="#999999"
                        />
                        <span class="placeholder-text">摄像头已关闭</span>
                      </div>
                    )}
                    <div class="participant-name">{participant.name}</div>
                  </div>
                );
              })}
          </Motion>
        </div>
        <div class="meet-operator">
          <div class="operator-list">
            <div
              class={["operator-item", { "disabled": !controller.canOpenMicrophone.value }]}
              onClick={() => {
                if (controller.canOpenMicrophone.value) {
                  controller.toggleMicrophone();
                }
              }}
            >
              {controller.canOpenMicrophone.value ? controller.microphoneState.value ? (
                <Fragment>
                  <Svg
                    svgPath="M512 128a128 128 0 0 0-128 128v170.666667a128 128 0 0 0 256 0V256a128 128 0 0 0-128-128z m0-85.333333a213.333333 213.333333 0 0 1 213.333333 213.333333v170.666667a213.333333 213.333333 0 0 1-426.666666 0V256a213.333333 213.333333 0 0 1 213.333333-213.333333zM130.346667 469.333333H216.32a298.752 298.752 0 0 0 591.274667 0h86.016A384.170667 384.170667 0 0 1 554.666667 808.32V981.333333h-85.333334v-173.013333A384.170667 384.170667 0 0 1 130.346667 469.333333z"
                    width="20"
                    height="20"
                    class="icon"
                    fill="#dddddd"
                  />
                  <span class="tooltip">关闭麦克风</span>
                </Fragment>
              ) : (
                <Fragment>
                  <Svg
                    svgPath="M700.8 761.130667A381.482667 381.482667 0 0 1 554.666667 808.32V981.333333h-85.333334v-173.013333A384.170667 384.170667 0 0 1 130.346667 469.333333H216.32a298.752 298.752 0 0 0 421.12 228.437334l-66.176-66.133334A213.333333 213.333333 0 0 1 298.666667 426.666667V358.997333L59.434667 119.808l60.373333-60.373333 844.757333 844.8-60.373333 60.330666-203.392-203.434666z m-315.392-315.392l107.52 107.52a128.085333 128.085333 0 0 1-107.52-107.52z m441.258667 201.088l-61.568-61.525334c21.717333-34.56 36.522667-73.813333 42.538666-115.968h86.016a381.866667 381.866667 0 0 1-66.986666 177.493334z m-124.16-124.117334l-66.048-66.048c2.304-9.642667 3.541333-19.626667 3.541333-29.994666V256a128 128 0 0 0-248.234667-44.032L327.936 148.096A213.333333 213.333333 0 0 1 725.333333 256v170.666667a212.48 212.48 0 0 1-22.784 96.042666z"
                    width="20"
                    height="20"
                    class="icon"
                    fill="#dddddd"
                  />
                  <span class="tooltip">开启麦克风</span>
                </Fragment>
              ) : <Fragment>
                <Svg
                  svgPath="M700.8 761.130667A381.482667 381.482667 0 0 1 554.666667 808.32V981.333333h-85.333334v-173.013333A384.170667 384.170667 0 0 1 130.346667 469.333333H216.32a298.752 298.752 0 0 0 421.12 228.437334l-66.176-66.133334A213.333333 213.333333 0 0 1 298.666667 426.666667V358.997333L59.434667 119.808l60.373333-60.373333 844.757333 844.8-60.373333 60.330666-203.392-203.434666z m-315.392-315.392l107.52 107.52a128.085333 128.085333 0 0 1-107.52-107.52z m441.258667 201.088l-61.568-61.525334c21.717333-34.56 36.522667-73.813333 42.538666-115.968h86.016a381.866667 381.866667 0 0 1-66.986666 177.493334z m-124.16-124.117334l-66.048-66.048c2.304-9.642667 3.541333-19.626667 3.541333-29.994666V256a128 128 0 0 0-248.234667-44.032L327.936 148.096A213.333333 213.333333 0 0 1 725.333333 256v170.666667a212.48 212.48 0 0 1-22.784 96.042666z"
                  width="20"
                  height="20"
                  class="icon-error"
                  fill="#999999"
                />
                <span class="tooltip">麦克风权限未授予</span>
              </Fragment>}
            </div>
            <div
              class={["operator-item", { "disabled": !controller.canOpenCamera.value }]}
              onClick={() => {
                if (controller.canOpenCamera.value) {
                  controller.toggleCamera("meet-video");
                }
              }}
            >
              {controller.canOpenCamera.value ? controller.cameraState.value ? (
                <Fragment>
                  <Svg
                    svgPath="M873.770667 314.922667c19.797333-12.202667 37.632-2.048 37.632 18.304v335.232c0 24.362667-15.872 32.512-37.632 18.261333l-112.938667-67.029333c-19.797333-12.202667-37.632-26.453333-37.632-46.72V424.618667c0-18.261333 17.834667-30.464 37.632-42.666667l112.938667-67.029333zM207.232 288h391.936c43.562667 0 79.232 32 79.232 71.125333v305.749334c0 39.125333-35.669333 71.125333-79.232 71.125333H207.232C163.669333 736 128 704 128 664.874667V359.125333C128 320 163.669333 288 207.232 288z"
                    width="20"
                    height="20"
                    class="icon"
                    fill="#dddddd"
                  />
                  <span class="tooltip">关闭摄像头</span>
                </Fragment>
              ) : (
                <Fragment>
                  <Svg
                    svgPath="M873.770667 314.922667c19.797333-12.202667 37.632-2.048 37.632 18.304v335.232c0 24.362667-15.872 32.512-37.632 18.261333l-112.938667-67.029333c-19.797333-12.202667-37.632-26.453333-37.632-46.72V424.618667c0-18.261333 17.834667-30.464 37.632-42.666667l112.938667-67.029333zM385.152 288h214.016c43.562667 0 79.232 32 79.232 71.125333v222.122667L385.152 288z m256.042667 437.077333a85.333333 85.333333 0 0 1-42.026667 10.922667H207.232C163.669333 736 128 704 128 664.874667V359.125333c0-38.186667 34.005333-69.632 76.16-71.082666l437.034667 437.034666zM145.28 183.893333l45.226667-45.226666 678.826666 678.826666-45.226666 45.226667z"
                    width="20"
                    height="20"
                    class="icon"
                    fill="#dddddd"
                  />
                  <span class="tooltip">开启摄像头</span>
                </Fragment>
              ) : <Fragment>
                <Svg
                  svgPath="M873.770667 314.922667c19.797333-12.202667 37.632-2.048 37.632 18.304v335.232c0 24.362667-15.872 32.512-37.632 18.261333l-112.938667-67.029333c-19.797333-12.202667-37.632-26.453333-37.632-46.72V424.618667c0-18.261333 17.834667-30.464 37.632-42.666667l112.938667-67.029333zM385.152 288h214.016c43.562667 0 79.232 32 79.232 71.125333v222.122667L385.152 288z m256.042667 437.077333a85.333333 85.333333 0 0 1-42.026667 10.922667H207.232C163.669333 736 128 704 128 664.874667V359.125333c0-38.186667 34.005333-69.632 76.16-71.082666l437.034667 437.034666zM145.28 183.893333l45.226667-45.226666 678.826666 678.826666-45.226666 45.226667z"
                  width="20"
                  height="20"
                  class="icon-error"
                  fill="#999999"
                />
                <span class="tooltip">摄像头权限未授予</span>
              </Fragment>}
            </div>
            <div class="operator-item">
              <Svg
                svgPath="M896 128a42.666667 42.666667 0 0 1 42.666667 42.666667v298.666666h-85.333334V213.333333H170.666667v597.333334h256v85.333333H128a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h768z m0 426.666667a42.666667 42.666667 0 0 1 42.666667 42.666666v256a42.666667 42.666667 0 0 1-42.666667 42.666667h-341.333333a42.666667 42.666667 0 0 1-42.666667-42.666667v-256a42.666667 42.666667 0 0 1 42.666667-42.666666h341.333333z m-405.333333-256L403.498667 385.834667l96 96-60.330667 60.330666-96-96L256 533.333333V298.666667h234.666667z"
                width="20"
                height="20"
                class="icon"
                fill="#dddddd"
              />
              <span class="tooltip">屏幕共享</span>
            </div>
            <div class="operator-item">
              <Svg
                svgPath={[
                  "M704 320a192 192 0 1 1-384 0 192 192 0 0 1 384 0zM512 448a128 128 0 1 0 0-256 128 128 0 0 0 0 256z",
                  "M160 832A224 224 0 0 1 384 608h256a32 32 0 0 0 0-64H384A288 288 0 0 0 96 832v64a32 32 0 0 0 64 0v-64zM736 576a32 32 0 0 0-32 32V704H608a32 32 0 0 0 0 64H704v96a32 32 0 0 0 64 0V768h96a32 32 0 0 0 0-64H768V608a32 32 0 0 0-32-32z"
                ]}
                width="20"
                height="20"
                class="icon"
                fill="#dddddd"
              />
              <span class="tooltip">添加参与者</span>
            </div>
            <div
              class="operator-item"
              onClick={() => {
                const roomId = route.params.roomId as string;
                try {
                  const numericRoomId = $roomformat.roomIdToNumber(roomId);
                  controller.exitMeeting(numericRoomId);
                } catch (error: any) {
                  console.error('RoomId 转换失败:', error);
                  $message.error({
                    message: '会议ID格式错误: ' + (error?.message || '未知错误'),
                  });
                }
              }}
            >
              <Svg
                svgPath={[
                  "M918.4 489.6l-160-160c-12.8-12.8-32-12.8-44.8 0-12.8 12.8-12.8 32 0 44.8l105.6 105.6L512 480c-19.2 0-32 12.8-32 32s12.8 32 32 32l307.2 0-105.6 105.6c-12.8 12.8-12.8 32 0 44.8 6.4 6.4 12.8 9.6 22.4 9.6 9.6 0 16-3.2 22.4-9.6l160-163.2c0 0 0-3.2 3.2-3.2C931.2 518.4 931.2 499.2 918.4 489.6z",
                  "M832 736c-19.2 0-32 12.8-32 32l0 64c0 19.2-12.8 32-32 32L224 864c-19.2 0-32-12.8-32-32L192 192c0-19.2 12.8-32 32-32l544 0c19.2 0 32 12.8 32 32l0 64c0 19.2 12.8 32 32 32s32-12.8 32-32L864 192c0-54.4-41.6-96-96-96L224 96C169.6 96 128 137.6 128 192l0 640c0 54.4 41.6 96 96 96l544 0c54.4 0 96-41.6 96-96l0-64C864 748.8 851.2 736 832 736z"
                ]}
                width="20"
                height="20"
                class="icon"
                fill="#dddddd"
              />
              <span class="tooltip">退出会议</span>
            </div>
          </div>
        </div>
      </div>
    );
  },
});
