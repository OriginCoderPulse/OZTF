import { createApp } from "vue";
import App from "./App.tsx";
import router from "./router";
import "./global-no-select.css";
import PopupHook from "./Utils/PopupHook";
import Network from "./Utils/Network";
import Event from "./Utils/EventBus";
import GlobalConfig from "./Utils/GlobalConfig";
import Timer from "./Utils/Timer";
import Message from "./Utils/MessageHook";
import Date from "./Utils/Date";
import Storage from "./Utils/Storage";
import HighFrequencyControl from "./Utils/HighFrequencyControl";
import Nfc from "./Utils/NFC/Nfc.ts";
import TRTC from "./Utils/Meet/TRTC.ts";
import LibGenerateTestUserSig from "./Utils/Meet/LibGenerateTestUserSig.ts";

const app = createApp(App);

app
  .use(router)
  .use(GlobalConfig)
  .use(PopupHook)
  .use(Network)
  .use(Event)
  .use(Timer)
  .use(Message)
  .use(Date)
  .use(Storage)
  .use(HighFrequencyControl)
  .use(Nfc)
  .use(LibGenerateTestUserSig)
  .use(TRTC)
  .mount("#app");
