import { defineComponent, computed } from 'vue';
import './Paginition.scss';

export default defineComponent({
    name: 'Pagination',
    props: {
        total: {
            type: Number,
            required: true
        },
        maxShow: {
            type: Number,
            default: 10
        },
        pageQuantity: {
            type: Number,
            default: 15
        },
        modelValue: {
            type: Number,
            default: 1
        }
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
        const currentPage = computed({
            get: () => props.modelValue,
            set: (val: number) => emit('update:modelValue', val)
        });

        const pageArray = computed(() => {
            const pages = [];
            const total = Math.ceil(props.total / props.pageQuantity);
            const maxShow = props.maxShow;
            const cur = currentPage.value;
            
            // 如果总页数为0，显示第1页
            if (total <= 0) {
                pages.push(1);
                return pages;
            }
            
            if (total <= maxShow) {
                for (let i = 1; i <= total; i++) pages.push(i);
                return pages;
            }
            const left = Math.max(2, cur - 2);
            const right = Math.min(total - 1, cur + 2);
            pages.push(1);
            if (left > 2) pages.push('...');
            for (let i = left; i <= right; i++) pages.push(i);
            if (right < total - 1) pages.push('...');
            pages.push(total);
            return pages;
        });

        const selectPage = (page: number | string) => {
            if (page === '...') return;
            if (typeof page === 'number' && page !== currentPage.value) {
                currentPage.value = page;
            }
        }

        const prevPage = () => {
            if (currentPage.value > 1) selectPage(currentPage.value - 1);
        }

        const nextPage = () => {
            if (currentPage.value < Math.ceil(props.total / props.pageQuantity)) selectPage(currentPage.value + 1);
        }

        return () => {
            const totalPages = Math.ceil(props.total / props.pageQuantity);
            
            // 如果总页数为0或1，仍然显示页码组件
            return (
                <div class="page-main">
                    <div class="pages">
                        <div class={['page-btn', 'prev', { disabled: currentPage.value === 1 }]} onClick={prevPage}>
                            <svg t="1752417846277" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2348" width="16" height="16">
                                <path d="M572.16 512l140.8-140.373333a42.666667 42.666667 0 1 0-60.586667-60.586667l-170.666666 170.666667a42.666667 42.666667 0 0 0 0 60.586666l170.666666 170.666667a42.666667 42.666667 0 0 0 60.586667 0 42.666667 42.666667 0 0 0 0-60.586667zM341.333333 298.666667a42.666667 42.666667 0 0 0-42.666666 42.666666v341.333334a42.666667 42.666667 0 0 0 85.333333 0V341.333333a42.666667 42.666667 0 0 0-42.666667-42.666666z" p-id="2349" fill="#ffffff"></path>
                            </svg>
                        </div>
                        {pageArray.value.map((page, index) => (
                            <div key={index} class={['page-btn', { active: page === currentPage.value }]} onClick={() => selectPage(page)}>
                                {page === '...' ? '...' : page}
                            </div>
                        ))}
                        <div class={['page-btn', 'next', { disabled: currentPage.value === totalPages }]} onClick={nextPage}>
                            <svg t="1752418125860" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12709" width="16" height="16">
                                <path d="M371.626667 311.04a42.666667 42.666667 0 1 0-60.586667 60.586667l140.8 140.373333-140.8 140.373333a42.666667 42.666667 0 0 0 0 60.586667 42.666667 42.666667 0 0 0 60.586667 0l170.666666-170.666667a42.666667 42.666667 0 0 0 0-60.586666zM682.666667 298.666667a42.666667 42.666667 0 0 0-42.666667 42.666666v341.333334a42.666667 42.666667 0 0 0 85.333333 0V341.333333a42.666667 42.666667 0 0 0-42.666666-42.666666z" p-id="12710" fill="#ffffff"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            );
        };
    }
});
