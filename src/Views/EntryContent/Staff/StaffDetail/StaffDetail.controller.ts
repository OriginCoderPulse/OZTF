import { ref } from "vue";

export class StaffDetailController {
  public isShowContract = ref(false);
  public isResignLoading = ref(false);
  public isConfirmationLoading = ref(false);

  constructor(private props: { staffDetail: StaffData }) {}

  /**
   * 切换PDF显示
   */
  public togglePDFByStaff() {
    if (this.isShowContract.value) {
      this.isShowContract.value = false;
      $timer.delay(
        "reviewPDF",
        () => {
          this.isShowContract.value = true;
        },
        500
      );
    } else {
      this.isShowContract.value = !this.isShowContract.value;
    }
  }

  /**
   * 关闭PDF
   */
  public closePDF() {
    this.isShowContract.value = false;
  }

  /**
   * 改变员工状态API
   */
  private changeStaffStatusApi(id: string, status: "Active" | "Inactive") {
    $network.request(
      "changeStaffStatus",
      { staffID: id, status },
      (_data: any) => {
        $event.emit("changeStaffStatus");
      },
      (error: any) => {
        this.isConfirmationLoading.value = false;
        this.isResignLoading.value = false;
        $message.error({ message: error });
      }
    );
  }

  /**
   * 改变员工状态
   */
  public changeStaffStatus(id: string, status: "Active" | "Inactive") {
    switch (status) {
      case "Active":
        this.isConfirmationLoading.value = true;

        $popup.alert("确定要这么操作么", {
          buttonCount: 2,
          onBtnRight: () => {
            this.changeStaffStatusApi(id, status);
          },
          onBtnLeft: () => {
            this.isConfirmationLoading.value = false;
          },
        });

        break;
      case "Inactive":
        this.isResignLoading.value = true;

        $popup.alert("确定要这么操作么", {
          buttonCount: 2,
          onBtnRight: () => {
            this.changeStaffStatusApi(id, status);
          },
          onBtnLeft: () => {
            this.isResignLoading.value = false;
          },
        });

        break;
    }
  }
}
