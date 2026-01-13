import { defineComponent } from "vue";
import "./UI.scss";

export default defineComponent({
    name: "UI",
    props: {
        projectId: {
            type: [String, Number, null],
            required: true,
        },
        projectName: {
            type: String,
            required: true,
        },
        roleTitle: {
            type: String,
            default: "",
        },
    },
    setup(props) {
        return () => (
            <div class="ui">
            </div>
        );
    },
});
