import {defineComponent, ref, computed, watch, onMounted, onUnmounted} from "vue";
import {Motion} from "motion-v";
import "./Date.scss"

export default defineComponent({
    name: "Date",
    props: {
        modelValue: {
            type: [String, Date, Number, Array],
            default: null
        },
        dateType: {
            type: String,
            default: 'single',
            validator: (value: string) => ['single', 'range'].includes(value)
        },
        placeholder: {
            type: String,
            default: "请选择日期"
        },
        rangePlaceholder: {
            type: Array,
            default: () => ["开始日期", "结束日期"]
        },
        disabled: {
            type: Boolean,
            default: false
        },
        readonly: {
            type: Boolean,
            default: false
        },
        format: {
            type: String,
            default: "YYYY-MM-DD"
        },
        separator: {
            type: String,
            default: " ~ "
        },
        minDate: {
            type: [String, Date, Number],
            default: null
        },
        maxDate: {
            type: [String, Date, Number],
            default: null
        },
        dropdownPlacement: {
            type: String,
            default: 'bottom',
            validator: (value: string) => ['top', 'bottom'].includes(value)
        },
        showTime: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue', 'change', 'focus', 'blur'],
    setup(props, { emit }) {
        const showDateSelect = ref(false)
        const currentMonth = ref(new Date().getMonth())
        const currentYear = ref(new Date().getFullYear())

        // 单日期模式
        const selectedDate = ref<Date | null>(null)
        
        // 时间选择（小时和分钟）
        const selectedHour = ref<number>(new Date().getHours())
        const selectedMinute = ref<number>(new Date().getMinutes())
        // 正在编辑的时间值（用于输入时显示原始值）
        const editingHour = ref<string>('')
        const editingMinute = ref<string>('')
        const isEditingHour = ref<boolean>(false)
        const isEditingMinute = ref<boolean>(false)

        // 周期日期模式
        const selectedRange = ref<{ start: Date | null, end: Date | null }>({
            start: null,
            end: null
        })
        const isSelectingStart = ref(true) // 当前是否在选择开始日期

        // 计算属性：当前选择模式
        const isSingleMode = computed(() => props.dateType === 'single')
        const isRangeMode = computed(() => props.dateType === 'range')

        // 解析传入的日期值
        const parseDateValue = (value: any): Date | null => {
            if (!value) return null
            if (value instanceof Date) return value
            if (typeof value === 'number') {
                const timestamp = value.toString().length === 10 ? value * 1000 : value
                return new Date(timestamp)
            }
            if (typeof value === 'string') {
                const parsed = new Date(value)
                return isNaN(parsed.getTime()) ? null : parsed
            }
            return null
        }

        // 格式化日期显示
        const formatDisplayValue = (date: Date | null): string => {
            if (!date) return ''
            return $date.format(date, props.format)
        }

        // 监听modelValue变化
        watch(() => props.modelValue, (newValue) => {
            if (isSingleMode.value) {
                selectedDate.value = parseDateValue(newValue)
                if (selectedDate.value) {
                    currentMonth.value = selectedDate.value.getMonth()
                    currentYear.value = selectedDate.value.getFullYear()
                    // 如果格式包含时间，提取小时和分钟
                    if (props.format.includes('HH') || props.format.includes('hh')) {
                        selectedHour.value = selectedDate.value.getHours()
                        selectedMinute.value = selectedDate.value.getMinutes()
                    }
                }
            } else if (isRangeMode.value) {
                if (Array.isArray(newValue) && newValue.length === 2) {
                    const start = parseDateValue(newValue[0])
                    const end = parseDateValue(newValue[1])
                    selectedRange.value = { start, end }

                    if (start) {
                        currentMonth.value = start.getMonth()
                        currentYear.value = start.getFullYear()
                    }
                } else {
                    selectedRange.value = { start: null, end: null }
                }
            }
        }, { immediate: true })

        // 显示值
        const displayValue = computed(() => {
            if (isSingleMode.value) {
                return selectedDate.value ? formatDisplayValue(selectedDate.value) : ''
            } else if (isRangeMode.value) {
                const start = selectedRange.value.start
                const end = selectedRange.value.end

                if (start && end) {
                    return formatDisplayValue(start) + props.separator + formatDisplayValue(end)
                } else if (start) {
                    return formatDisplayValue(start) + props.separator + props.rangePlaceholder[1]
                } else if (end) {
                    return props.rangePlaceholder[0] + props.separator + formatDisplayValue(end)
                } else {
                    return ''
                }
            }
            return ''
        })

        // 是否有值
        const hasValue = computed(() => {
            if (isSingleMode.value) {
                return !!selectedDate.value
            } else if (isRangeMode.value) {
                return !!selectedRange.value.start || !!selectedRange.value.end
            }
            return false
        })

        // 周期模式下的开始和结束值
        const startValue = computed(() => {
            if (isRangeMode.value && selectedRange.value.start) {
                return formatDisplayValue(selectedRange.value.start)
            }
            return props.rangePlaceholder[0]
        })

        const endValue = computed(() => {
            if (isRangeMode.value && selectedRange.value.end) {
                return formatDisplayValue(selectedRange.value.end)
            }
            return props.rangePlaceholder[1]
        })

        // 获取月份的天数
        const getDaysInMonth = (year: number, month: number): number => {
            return new Date(year, month + 1, 0).getDate()
        }

        // 获取月份第一天是星期几
        const getFirstDayOfMonth = (year: number, month: number): number => {
            return new Date(year, month, 1).getDay()
        }

        // 获取日历数据
        const calendarDays = computed(() => {
            const daysInMonth = getDaysInMonth(currentYear.value, currentMonth.value)
            const firstDay = getFirstDayOfMonth(currentYear.value, currentMonth.value)
            const days = []

            // 添加上个月的日期
            const prevMonthDays = firstDay === 0 ? 6 : firstDay - 1
            const prevMonth = new Date(currentYear.value, currentMonth.value - 1)
            const prevMonthDaysCount = getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth())

            for (let i = prevMonthDaysCount - prevMonthDays + 1; i <= prevMonthDaysCount; i++) {
                const prevDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i)
                let isPrevSelected = false
                let isPrevInRange = false

                if (isRangeMode.value) {
                    const start = selectedRange.value.start
                    const end = selectedRange.value.end

                    if (start && $date.isSameDay(prevDate, start)) {
                        isPrevSelected = true
                    }
                    if (end && $date.isSameDay(prevDate, end)) {
                        isPrevSelected = true
                    }

                    // 只有在选择了开始和结束日期后才显示范围高亮
                    if (start && end && prevDate >= start && prevDate <= end) {
                        isPrevInRange = true
                    }
                }

                days.push({
                    day: i,
                    month: 'prev',
                    date: prevDate,
                    isCurrentMonth: false,
                    isToday: false,
                    isSelected: isPrevSelected,
                    isInRange: isPrevInRange,
                    isDisabled: false
                })
            }

            // 添加本月的日期
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(currentYear.value, currentMonth.value, i)
                const isToday = $date.isToday(date)
                let isSelected = false
                let isInRange = false

                if (isSingleMode.value) {
                    isSelected = selectedDate.value ? $date.isSameDay(date, selectedDate.value) : false
                } else if (isRangeMode.value) {
                    const start = selectedRange.value.start
                    const end = selectedRange.value.end

                    if (start && $date.isSameDay(date, start)) {
                        isSelected = true
                    }
                    if (end && $date.isSameDay(date, end)) {
                        isSelected = true
                    }

                    // 检查是否在范围内
                    // 只有在选择了开始和结束日期后才显示范围高亮
                    if (start && end && date >= start && date <= end) {
                        isInRange = true
                    }
                }

                const isDisabled = isDateDisabled(date)

                days.push({
                    day: i,
                    month: 'current',
                    date: date,
                    isCurrentMonth: true,
                    isToday,
                    isSelected,
                    isInRange,
                    isDisabled
                })
            }

            // 添加下个月的日期
            const remainingDays = 42 - days.length // 6行7列的日历
            for (let i = 1; i <= remainingDays; i++) {
                const nextMonth = new Date(currentYear.value, currentMonth.value + 1, i)
                let isNextSelected = false
                let isNextInRange = false

                if (isRangeMode.value) {
                    const start = selectedRange.value.start
                    const end = selectedRange.value.end

                    if (start && $date.isSameDay(nextMonth, start)) {
                        isNextSelected = true
                    }
                    if (end && $date.isSameDay(nextMonth, end)) {
                        isNextSelected = true
                    }

                    // 只有在选择了开始和结束日期后才显示范围高亮
                    if (start && end && nextMonth >= start && nextMonth <= end) {
                        isNextInRange = true
                    }
                }

                days.push({
                    day: i,
                    month: 'next',
                    date: nextMonth,
                    isCurrentMonth: false,
                    isToday: false,
                    isSelected: isNextSelected,
                    isInRange: isNextInRange,
                    isDisabled: false
                })
            }

            return days
        })

        // 判断日期是否禁用
        const isDateDisabled = (date: Date): boolean => {
            if (props.disabled) return true

            let minDate: Date | null = null
            let maxDate: Date | null = null

            if (props.minDate) {
                minDate = parseDateValue(props.minDate)
            }

            if (props.maxDate) {
                maxDate = parseDateValue(props.maxDate)
            }

            if (minDate && date < minDate) return true
            return !!(maxDate && date > maxDate);


        }

        // 月份名称
        const monthNames = [
            '一月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '十一月', '十二月'
        ]

        // 星期名称
        const weekDays = ['日', '一', '二', '三', '四', '五', '六']

        // 切换月份
        const changeMonth = (delta: number) => {
            currentMonth.value += delta
            if (currentMonth.value > 11) {
                currentMonth.value = 0
                currentYear.value++
            } else if (currentMonth.value < 0) {
                currentMonth.value = 11
                currentYear.value--
            }
        }

        // 切换年份
        const changeYear = (delta: number) => {
            currentYear.value += delta
        }

        // 合并日期和时间
        const mergeDateTime = (date: Date): Date => {
            const merged = new Date(date)
            merged.setHours(selectedHour.value)
            merged.setMinutes(selectedMinute.value)
            merged.setSeconds(0)
            merged.setMilliseconds(0)
            return merged
        }

        const selectDate = (day: any) => {
            if (day.isDisabled || day.month !== 'current') {
                return;
            }

            if (isSingleMode.value) {
                const dateWithTime = mergeDateTime(day.date)
                selectedDate.value = dateWithTime
                emit('update:modelValue', formatDisplayValue(dateWithTime))
                emit('change', dateWithTime)
            } else if (isRangeMode.value) {
                if (isSelectingStart.value) {
                    selectedRange.value.start = day.date
                    selectedRange.value.end = null
                    isSelectingStart.value = false
                } else {
                    if (selectedRange.value.start && day.date < selectedRange.value.start) {
                        selectedRange.value.end = selectedRange.value.start
                        selectedRange.value.start = day.date
                    } else {
                        selectedRange.value.end = day.date
                    }
                    isSelectingStart.value = true

                    if (selectedRange.value.start && selectedRange.value.end) {
                        const rangeValue = [
                            formatDisplayValue(selectedRange.value.start),
                            formatDisplayValue(selectedRange.value.end)
                        ]
                        emit('update:modelValue', rangeValue)
                        emit('change', [selectedRange.value.start, selectedRange.value.end])
                    }
                }
            }
        }

        // 清除选择
        const clearSelection = () => {
            if (isSingleMode.value) {
                selectedDate.value = null
                emit('update:modelValue', '')
                emit('change', null)
            } else if (isRangeMode.value) {
                selectedRange.value = { start: null, end: null }
                isSelectingStart.value = true
                emit('update:modelValue', [])
                emit('change', [null, null])
            }
        }

        const handleInputClick = (e?: Event) => {
            if (e) {
                e.stopPropagation();
            }
            if (!props.disabled && !props.readonly) {
                // 总是先关闭其他组件，然后再处理当前组件的状态
                closeOtherFormComponents();

                const newState = !showDateSelect.value;
                showDateSelect.value = newState;

                if (newState) {
                    emit('focus');
                } else {
                    emit('blur');
                }
            }
        }

        const closeOtherFormComponents = () => {
            const closeEvent = new CustomEvent('closeFormComponents', {
                detail: { source: 'date' }
            });
            document.dispatchEvent(closeEvent);
        };

        const handleGlobalClose = (_event: any) => {
            // 关闭所有其他表单组件的下拉框，包括其他Selector和Date组件
            if (showDateSelect.value) {
                showDateSelect.value = false;
                emit('blur');
            }
        };

        const handleDocumentClick = (event: Event) => {
            if (!showDateSelect.value) return;

            const target = event.target as Element
            const dateSelector = document.querySelector('.date-selector')

            // 检查是否点击在日期选择器内部
            let isClickInside = false;
            if (dateSelector && typeof dateSelector.contains === 'function') {
                isClickInside = dateSelector.contains(target);
            }

            if (isClickInside) {
                return;
            }

            closeOtherFormComponents();
            showDateSelect.value = false
            emit('blur')
        }



        onMounted(() => {
            document.addEventListener('click', handleDocumentClick);
            document.addEventListener('closeFormComponents', handleGlobalClose);
        })

        onUnmounted(() => {
            document.removeEventListener('click', handleDocumentClick);
            document.removeEventListener('closeFormComponents', handleGlobalClose);
        })

        return () => (
            <div class="date-selector">
                <div class="date-input-wrapper">
                    {isSingleMode.value ? (
                        <input
                            type="text"
                            class={`date-input ${hasValue.value ? 'has-value' : ''} ${props.disabled ? 'disabled' : ''}`}
                            value={displayValue.value}
                            placeholder={props.placeholder}
                            disabled={props.disabled}
                            readonly

                            onFocus={(e: Event) => {
                                e.stopPropagation();
                                closeOtherFormComponents();
                                handleInputClick(e);
                            }}
                            onClick={(e: Event) => {
                                e.stopPropagation();
                                handleInputClick(e);
                            }}
                            onInput={() => {}} // 阻止输入
                        />
                    ) : (
                        <div class="range-input-unified">
                            <div class="range-input-item start-item">
                                <input
                                    type="text"
                                    class={`date-input range-input start-input ${selectedRange.value.start ? 'has-value' : ''} ${props.disabled ? 'disabled' : ''}`}
                                    value={startValue.value}
                                    placeholder={props.rangePlaceholder[0]}
                                    disabled={props.disabled}
                                    readonly
                                    onFocus={(e: Event) => {
                                        e.stopPropagation();
                                        closeOtherFormComponents();
                                        handleInputClick(e);
                                    }}
                                    onClick={(e: Event) => {
                                        e.stopPropagation();
                                        handleInputClick(e);
                                    }}
                                    onInput={() => {}} // 阻止输入
                                />
                            </div>
                            <div class="range-separator-icon">
                                <svg t="1756051387842" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1662" id="mx_n_1756051387843" width="14" height="14">
                                    <path d="M853.333333 170.666667h-128V123.733333a38.4 38.4 0 1 0-76.8 0V170.666667H375.466667V123.733333a38.4 38.4 0 0 0-76.8 0V170.666667H170.666667a85.333333 85.333333 0 0 0-85.333334 85.333333v597.333333a85.333333 85.333333 0 0 0 85.333334 85.333334h682.666666a85.333333 85.333333 0 0 0 85.333334-85.333334V256a85.333333 85.333333 0 0 0-85.333334-85.333333z m8.533334 682.666666a8.533333 8.533333 0 0 1-8.533334 8.533334H170.666667a8.533333 8.533333 0 0 1-8.533334-8.533334V422.4h699.733334z m0-507.733333H162.133333V256a8.533333 8.533333 0 0 1 8.533334-8.533333h128v12.8a38.4 38.4 0 0 0 76.8 0v-12.8h273.066666v12.8a38.4 38.4 0 0 0 76.8 0v-12.8h128a8.533333 8.533333 0 0 1 8.533334 8.533333z" p-id="1663" fill="#999"></path>
                                    <path d="M457.813333 827.306667h76.373334c5.546667-124.16 13.226667-183.893333 85.333333-270.933334V512H403.2v62.72h136.533333a421.973333 421.973333 0 0 0-81.92 252.586667z" p-id="1664" fill="#999"></path>
                                </svg>
                            </div>
                            <div class="range-input-item end-item">
                                <input
                                    type="text"
                                    class={`date-input range-input end-input ${selectedRange.value.end ? 'has-value' : ''} ${props.disabled ? 'disabled' : ''}`}
                                    value={endValue.value}
                                    placeholder={props.rangePlaceholder[1]}
                                    disabled={props.disabled}
                                    readonly
                                    onFocus={(e: Event) => {
                                        e.stopPropagation();
                                        closeOtherFormComponents();
                                        handleInputClick(e);
                                    }}
                                    onClick={(e: Event) => {
                                        e.stopPropagation();
                                        handleInputClick(e);
                                    }}
                                    onInput={() => {}} // 阻止输入
                                />
                            </div>
                        </div>
                    )}
                    <div class="date-input-actions">
                        {hasValue.value && !props.disabled && (
                            <button
                                type="button"
                                class="clear-btn"
                                onClick={(e: Event) => {
                                    e.stopPropagation();
                                    clearSelection();
                                }}
                                title="清除"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                {showDateSelect.value && (
                    <Motion
                        initial={{opacity: 0, scale: 0.9, y: props.dropdownPlacement === 'top' ? 10 : -10}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.9, y: props.dropdownPlacement === 'top' ? 10 : -10}}
                        transition={{duration: 0.2, ease: 'easeOut'}}
                        class={`date-dropdown ${props.dropdownPlacement === 'top' ? 'dropdown-top' : 'dropdown-bottom'}`}
                    >
                        <div class="date-header">
                            <button
                                type="button"
                                class="nav-btn"
                                onClick={(e: Event) => {
                                    e.stopPropagation();
                                    changeYear(-1);
                                }}
                            >
                                «
                            </button>
                            <button
                                type="button"
                                class="nav-btn"
                                onClick={(e: Event) => {
                                    e.stopPropagation();
                                    changeMonth(-1);
                                }}
                            >
                                ‹
                            </button>

                            <div class="date-title">
                                {currentYear.value}年{monthNames[currentMonth.value]}
                            </div>

                            <button
                                type="button"
                                class="nav-btn"
                                onClick={(e: Event) => {
                                    e.stopPropagation();
                                    changeMonth(1);
                                }}
                            >
                                ›
                            </button>
                            <button
                                type="button"
                                class="nav-btn"
                                onClick={(e: Event) => {
                                    e.stopPropagation();
                                    changeYear(1);
                                }}
                            >
                                »
                            </button>
                        </div>

                        <div class="date-weekdays">
                            {weekDays.map(day => (
                                <div key={day} class="weekday">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div class="date-grid">
                            {calendarDays.value.map((day, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    class={`date-cell ${day.month} ${day.isToday ? 'today' : ''} ${day.isSelected ? 'selected' : ''} ${day.isInRange ? 'in-range' : ''} ${day.isDisabled ? 'disabled' : ''}`}
                                    onClick={(e: Event) => {
                                        e.stopPropagation();
                                        selectDate(day);
                                    }}
                                    disabled={day.isDisabled}
                                >
                                    {day.day}
                                </button>
                            ))}
                        </div>

                        {isSingleMode.value && (
                            <div class="date-footer">
                                <button
                                    type="button"
                                    class="today-btn"
                                    onClick={(e: Event) => {
                                        e.stopPropagation();
                                        const today = new Date()
                                        selectedDate.value = mergeDateTime(today)
                                        currentMonth.value = today.getMonth()
                                        currentYear.value = today.getFullYear()
                                        selectedHour.value = today.getHours()
                                        selectedMinute.value = today.getMinutes()
                                        emit('update:modelValue', formatDisplayValue(selectedDate.value))
                                        emit('change', selectedDate.value)
                                        showDateSelect.value = false
                                    }}
                                >
                                    今天
                                </button>
                                {props.showTime && (
                                    <div class="time-picker">
                                        <div class="time-scroll-container">
                                            <input
                                                type="text"
                                                class="time-input"
                                                value={isEditingHour.value ? editingHour.value : String(selectedHour.value).padStart(2, '0')}
                                                maxLength={2}
                                                onFocus={(e: Event) => {
                                                    e.stopPropagation();
                                                    isEditingHour.value = true;
                                                    editingHour.value = String(selectedHour.value).padStart(2, '0');
                                                }}
                                                onInput={(e: Event) => {
                                                    const target = e.target as HTMLInputElement;
                                                    const value = target.value.replace(/[^0-9]/g, '');
                                                    editingHour.value = value;
                                                    
                                                    if (value === '') {
                                                        return;
                                                    }
                                                    
                                                    const num = parseInt(value);
                                                    if (!isNaN(num)) {
                                                        if (num >= 0 && num <= 23) {
                                                            selectedHour.value = num;
                                                            if (selectedDate.value) {
                                                                const updated = mergeDateTime(selectedDate.value);
                                                                selectedDate.value = updated;
                                                                emit('update:modelValue', formatDisplayValue(updated));
                                                                emit('change', updated);
                                                            }
                                                        } else if (num > 23) {
                                                            selectedHour.value = 23;
                                                            editingHour.value = '23';
                                                            if (selectedDate.value) {
                                                                const updated = mergeDateTime(selectedDate.value);
                                                                selectedDate.value = updated;
                                                                emit('update:modelValue', formatDisplayValue(updated));
                                                                emit('change', updated);
                                                            }
                                                        }
                                                    }
                                                }}
                                                onBlur={(e: Event) => {
                                                    const target = e.target as HTMLInputElement;
                                                    isEditingHour.value = false;
                                                    const value = target.value.replace(/[^0-9]/g, '');
                                                    if (value === '') {
                                                        selectedHour.value = 0;
                                                        editingHour.value = '';
                                                    } else {
                                                        const num = parseInt(value);
                                                        if (!isNaN(num)) {
                                                            if (num >= 0 && num <= 23) {
                                                                selectedHour.value = num;
                                                            } else if (num > 23) {
                                                                selectedHour.value = 23;
                                                            }
                                                        }
                                                    }
                                                    editingHour.value = '';
                                                    if (selectedDate.value) {
                                                        const updated = mergeDateTime(selectedDate.value);
                                                        selectedDate.value = updated;
                                                        emit('update:modelValue', formatDisplayValue(updated));
                                                        emit('change', updated);
                                                    }
                                                }}
                                                onClick={(e: Event) => {
                                                    e.stopPropagation();
                                                }}
                                            />
                                            <div class="time-separator">:</div>
                                            <input
                                                type="text"
                                                class="time-input"
                                                value={isEditingMinute.value ? editingMinute.value : String(selectedMinute.value).padStart(2, '0')}
                                                maxLength={2}
                                                onFocus={(e: Event) => {
                                                    e.stopPropagation();
                                                    isEditingMinute.value = true;
                                                    editingMinute.value = String(selectedMinute.value).padStart(2, '0');
                                                }}
                                                onInput={(e: Event) => {
                                                    const target = e.target as HTMLInputElement;
                                                    const value = target.value.replace(/[^0-9]/g, '');
                                                    editingMinute.value = value;
                                                    
                                                    if (value === '') {
                                                        return;
                                                    }
                                                    
                                                    const num = parseInt(value);
                                                    if (!isNaN(num)) {
                                                        if (num >= 0 && num <= 59) {
                                                            selectedMinute.value = num;
                                                            if (selectedDate.value) {
                                                                const updated = mergeDateTime(selectedDate.value);
                                                                selectedDate.value = updated;
                                                                emit('update:modelValue', formatDisplayValue(updated));
                                                                emit('change', updated);
                                                            }
                                                        } else if (num > 59) {
                                                            selectedMinute.value = 59;
                                                            editingMinute.value = '59';
                                                            if (selectedDate.value) {
                                                                const updated = mergeDateTime(selectedDate.value);
                                                                selectedDate.value = updated;
                                                                emit('update:modelValue', formatDisplayValue(updated));
                                                                emit('change', updated);
                                                            }
                                                        }
                                                    }
                                                }}
                                                onBlur={(e: Event) => {
                                                    const target = e.target as HTMLInputElement;
                                                    isEditingMinute.value = false;
                                                    const value = target.value.replace(/[^0-9]/g, '');
                                                    if (value === '') {
                                                        selectedMinute.value = 0;
                                                        editingMinute.value = '';
                                                    } else {
                                                        const num = parseInt(value);
                                                        if (!isNaN(num)) {
                                                            if (num >= 0 && num <= 59) {
                                                                selectedMinute.value = num;
                                                            } else if (num > 59) {
                                                                selectedMinute.value = 59;
                                                            }
                                                        }
                                                    }
                                                    editingMinute.value = '';
                                                    if (selectedDate.value) {
                                                        const updated = mergeDateTime(selectedDate.value);
                                                        selectedDate.value = updated;
                                                        emit('update:modelValue', formatDisplayValue(updated));
                                                        emit('change', updated);
                                                    }
                                                }}
                                                onClick={(e: Event) => {
                                                    e.stopPropagation();
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Motion>
                )}
            </div>
        )
    }
})