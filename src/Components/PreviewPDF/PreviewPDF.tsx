import { defineComponent } from 'vue';
import { Motion } from 'motion-v';
import './PreviewPDF.scss';
import VuePdfEmbed from 'vue-pdf-embed';

export default defineComponent({
    name: 'PreviewPDF',
    props: {
        pdfSource: {
            type: String,
            required: true
        }
    },
    setup(props, { slots }) {
        return () => (
            <Motion
                class="preview-pdf"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <VuePdfEmbed source={props.pdfSource} class="pdf-viewer" />
                
                <div class="pdf-close-btn">
                    {slots.default?.()}
                </div>
            </Motion>
        );
    }
});
