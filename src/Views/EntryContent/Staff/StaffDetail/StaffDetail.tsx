/// <refrenc path="./StaffDetail.d.ts"/>

import { defineComponent } from "vue";
import { Motion } from "motion-v";
import "./StaffDetail.scss";
import PreviewPDF from "@/Components/PreviewPDF/PreviewPDF";
import { staffConfig } from "../Staff.config";
import Svg from "@/Components/Svg/Svg.tsx";
import { StaffDetailController } from "./StaffDetail.controller.ts";

export default defineComponent({
  name: "StaffDetail",
  props: {
    staffDetail: {
      type: Object as () => StaffData,
      required: true,
    },
  },
  setup(props) {
    const controller = new StaffDetailController(props);

    return () => (
      <div class="staff-detail">
        <div class="staff-info">
          <div class="basic-info">
            <div class="avatar" onClick={() => controller.togglePDFByStaff()}>
              <Motion
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                class="img-motion"
              >
                <img src="http://otzf.top/otzf/api/resource/lijiahang.JPG" alt="员工头像" />
              </Motion>
              <div class="staff-id">
                <span>{props.staffDetail.id || ""}</span>
              </div>
            </div>

            <div class="basic-content">
              <div class="basic-item">
                <div class="title">姓名</div>
                <span>{props.staffDetail.name || ""}</span>
              </div>
              <div class="basic-item">
                <div class="title">在职状态</div>
                {props.staffDetail.status && (
                  <div class="staff-status">
                    <div
                      class="status-dot"
                      style={{
                        backgroundColor:
                          staffConfig.status[props.staffDetail.status]?.color || "#cbfed6ff",
                      }}
                    ></div>
                    <span>
                      {staffConfig.status[props.staffDetail.status]?.name ||
                        props.staffDetail.status}
                    </span>
                  </div>
                )}
              </div>
              <div class="basic-item"></div>
              <div class="basic-item">
                <div class="title">部门</div>
                {props.staffDetail.department && (
                  <div
                    class="department"
                    style={{
                      backgroundColor:
                        staffConfig.department[props.staffDetail.department]?.color || "#d4e6f156",
                    }}
                  >
                    {staffConfig.department[props.staffDetail.department]?.name ||
                      props.staffDetail.department}
                  </div>
                )}
              </div>
              <div class="basic-item">
                <div class="title">...</div>
                <span></span>
              </div>
              <div class="basic-item"></div>
              <div class="basic-item">
                <div class="title">职位</div>
                {props.staffDetail.occupation &&
                staffConfig.occupation[props.staffDetail.occupation] ? (
                  <div
                    class="occupation"
                    style={{
                      backgroundColor:
                        staffConfig.occupation[props.staffDetail.occupation]?.color || "#d4e6f156",
                    }}
                  >
                    {staffConfig.occupation[props.staffDetail.occupation]?.name ||
                      props.staffDetail.occupation}
                  </div>
                ) : (
                  <span>{props.staffDetail.occupation || ""}</span>
                )}
              </div>
              <div class="basic-item">
                <div class="title" onClick={() => controller.togglePDFByStaff()}>
                  入职时间
                </div>
                <span>{$date.format(props.staffDetail.service_date, "YYYY-MM-DD") || ""}</span>
              </div>
            </div>
          </div>
          <div class="more-info"></div>
          <div class="another-info"></div>

          <div class="actions">
            <Motion
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: props.staffDetail.status !== "Inactive" ? 1 : 0,
                scale: props.staffDetail.status !== "Inactive" ? 1 : 0,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {props.staffDetail.status !== "Inactive" && (
                <div
                  class="action-btn-resign"
                  onClick={() => controller.changeStaffStatus(props.staffDetail.id, "Inactive")}
                >
                  {controller.isResignLoading.value && (
                    <div class="loader">
                      <span class="bar"></span>
                      <span class="bar"></span>
                      <span class="bar"></span>
                    </div>
                  )}
                  离职
                </div>
              )}
            </Motion>

            <Motion
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {props.staffDetail.status === "Probation" && (
                <div
                  class="action-btn-confirmation"
                  onClick={() => controller.changeStaffStatus(props.staffDetail.id, "Active")}
                >
                  {controller.isConfirmationLoading.value && (
                    <div class="loader">
                      <span class="bar"></span>
                      <span class="bar"></span>
                      <span class="bar"></span>
                    </div>
                  )}
                  转正
                </div>
              )}
            </Motion>
          </div>
        </div>

        <Motion
          initial={{ width: 0, opacity: 0, marginLeft: 0, padding: 0 }}
          animate={{
            width: !controller.isShowContract.value ? 0 : "40%",
            opacity: !controller.isShowContract.value ? 0 : 1,
            marginLeft: !controller.isShowContract.value ? 0 : 15,
            padding: !controller.isShowContract.value ? 0 : 10,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          class="contract"
        >
          {controller.isShowContract.value && (
            <PreviewPDF pdfSource="http://otzf.top/otzf/api/resource/git.pdf">
              <Motion
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                class="close-pdf"
                onClick={() => controller.closePDF()}
              >
                <Svg
                  svgPath="M906.410667 493.994667a32.298667 32.298667 0 0 0 32.256-32.256v-109.653334C938.666667 187.434667 835.84 85.333333 672.128 85.333333h-320C187.434667 85.333333 85.333333 187.392 85.333333 352.256v320C85.333333 836.608 187.392 938.666667 352.128 938.666667h320.128c164.352 0 266.410667-102.058667 266.282667-266.538667a32.682667 32.682667 0 0 0-65.28 0c0 129.450667-71.253333 201.130667-201.130667 201.130667h-320c-129.834667 0-201.514667-71.68-201.514667-201.130667v-320c0-129.834667 71.68-201.514667 201.642667-201.514667h320c129.877333 0 201.130667 71.253333 201.130667 201.514667V460.672a32.64 32.64 0 0 0 32.64 32.554667v0.768h0.426666zM418.773333 560.853333l-29.184 29.184a32.981333 32.981333 0 0 0-1.621333 46.165334l0.938667 0.682666c12.458667 12.458667 32.512 12.8 45.354666 0.768l29.056-29.013333a32.682667 32.682667 0 0 0-44.544-47.786667z m227.328 70.741334a32.725333 32.725333 0 0 1-45.653333 0.512l-1.621333-1.578667L394.88 426.666667a34.858667 34.858667 0 0 1-0.554667-47.274667 32.213333 32.213333 0 0 1 45.610667-0.554667l0.341333 0.298667 79.573334 79.616 72.405333-72.448a33.408 33.408 0 0 1 46.421333 0.298667c2.304 2.304 4.266667 4.906667 5.76 7.808a32.725333 32.725333 0 0 1-5.205333 39.466666l-72.106667 72.106667 78.421334 78.421333a32.853333 32.853333 0 0 1 0.853333 46.933334l-0.298667 0.298666z"
                  width="16"
                  height="16"
                  class="icon"
                  fill="#dddddd"
                />
              </Motion>
            </PreviewPDF>
          )}
        </Motion>
      </div>
    );
  },
});
