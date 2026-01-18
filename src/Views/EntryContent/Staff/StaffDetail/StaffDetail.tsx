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
                  svgPath={STAFF_DETAIL_CLOSE_PDF}
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
