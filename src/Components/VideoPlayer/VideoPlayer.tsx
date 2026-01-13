import { defineComponent, ref, onMounted, onUnmounted } from 'vue';
import './VideoPlayer.scss';
import { motion } from 'motion-v';
import Hls from 'hls.js';

export default defineComponent({
    name: 'VideoPlayer',
    props: {
        videoUrl: {
            type: String,
            required: true
        },
        controls: {
            type: Boolean,
            default: false
        },
        loop: {
            type: Boolean,
            default: false
        },
        videoType: {
            type: String,
            required: true
        }
    },
    setup(props, { slots }) {
        const palyerStatus = ref(false);
        const videoRef = ref<HTMLVideoElement | null>(null);

        onMounted(() => {
            if (props.videoType === 'video') {
                if (videoRef.value) {
                    videoRef.value.src = props.videoUrl;
                    videoRef.value.play();
                    videoRef.value.addEventListener('play', () => {
                        palyerStatus.value = true;
                    });
                }
            } else if (props.videoType === 'stream') {
                const hls = new Hls();
                if (videoRef.value) {
                    hls.loadSource(props.videoUrl);
                    hls.attachMedia(videoRef.value);
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        if (videoRef.value) videoRef.value.play();
                    });
                    videoRef.value.addEventListener('play', () => {
                        palyerStatus.value = true;
                    });
                }
            } else {
                throw new Error('Video Type Is Unknow !');
            }
        });

        onUnmounted(() => {
            if (videoRef.value) {
                videoRef.value.pause();
                videoRef.value.currentTime = 0;
            }
        });

        return () => (
            <motion.div
                class="video-component"
                key={palyerStatus.value ? 'playing' : 'loading'}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            >
                <video
                    ref={videoRef}
                    controls={props.controls}
                    src={props.videoUrl}
                    autoPlay
                    muted
                    loop={props.loop}
                    disablePictureInPicture
                    controlsList="nodownload nofullscreen noremoteplayback"
                    onContextMenu={(e: MouseEvent) => e.preventDefault()}
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;"
                    v-show={palyerStatus.value}
                ></video>
                {palyerStatus.value && (
                    <div class="video-action">{slots.default?.()}</div>
                )}
                {!palyerStatus.value && (
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
                )}
            </motion.div>
        );
    }
});
