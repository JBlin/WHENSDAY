<template>
  <Transition name="range-sheet">
    <div v-if="open" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="cancelSelection">
      <div class="absolute inset-0 bg-black/40" @click="cancelSelection" />

      <div class="range-panel relative bg-white rounded-t-2xl px-5 pt-4 pb-0 max-h-[85vh] flex flex-col">
        <div class="flex justify-center mb-4">
          <div class="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div class="flex items-start justify-between gap-3 mb-4">
          <div>
            <p class="text-xs font-semibold text-primary uppercase tracking-[0.2em]">Date Range</p>
            <h3 class="text-lg font-bold text-gray-900 mt-1">날짜 범위 선택</h3>
            <p class="text-sm text-gray-500 mt-1">{{ guideText }}</p>
          </div>

          <button
            type="button"
            class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600"
            @click="resetSelection"
          >
            다시 선택
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="rounded-btn border border-gray-200 bg-gray-50 px-3 py-3">
            <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Start</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ formattedStart }}</p>
          </div>

          <div class="rounded-btn border border-gray-200 bg-gray-50 px-3 py-3">
            <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">End</p>
            <p class="text-sm font-semibold text-gray-900 mt-1">{{ formattedEnd }}</p>
          </div>
        </div>

        <div class="flex items-center justify-between mb-4 px-1">
          <p class="text-xs text-gray-400">최대 {{ maxRangeDays }}일까지 선택할 수 있어요.</p>
          <p v-if="selectedDays" class="text-xs font-semibold text-primary">{{ selectedDays }}일 선택됨</p>
        </div>

        <div class="overflow-y-auto pr-1 -mr-1">
          <div v-for="month in months" :key="month.key" class="mb-6">
            <div class="flex items-center justify-between mb-3 px-1">
              <span class="text-sm font-semibold text-gray-700">{{ month.label }}</span>
            </div>

            <div class="grid grid-cols-7 mb-1">
              <div
                v-for="(weekday, index) in DAY_KO"
                :key="weekday"
                class="text-center text-xs font-medium py-1"
                :class="weekdayClass(index)"
              >
                {{ weekday }}
              </div>
            </div>

            <div class="grid grid-cols-7 gap-y-1">
              <div v-for="n in month.startOffset" :key="`empty-${month.key}-${n}`" />

              <button
                v-for="day in month.days"
                :key="day.date"
                type="button"
                :disabled="isDayDisabled(day.date)"
                class="relative flex h-10 w-full items-center justify-center"
                :class="dayButtonClass(day.date)"
                @click="selectDate(day.date)"
              >
                <span
                  v-if="isInRange(day.date)"
                  class="absolute inset-y-1 left-0 right-0 bg-primary/10"
                  :class="rangeFillClass(day.date)"
                />

                <span
                  class="relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-150"
                  :class="dayCellClass(day)"
                >
                  {{ day.num }}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div class="-mx-5 mt-4 flex gap-3 border-t border-gray-100 bg-white px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <button
            type="button"
            class="flex-1 h-12 border border-gray-200 text-gray-700 font-semibold rounded-btn text-sm active:scale-95 transition-all duration-150"
            @click="cancelSelection"
          >
            취소
          </button>
          <button
            type="button"
            :disabled="!canConfirm"
            class="flex-1 h-12 bg-primary text-white font-bold rounded-btn text-sm active:scale-95 transition-all duration-150 disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100 disabled:cursor-not-allowed"
            @click="confirmSelection"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  minDate: { type: String, required: true },
  maxDate: { type: String, required: true },
  maxRangeDays: { type: Number, default: 60 },
})

const emit = defineEmits(['update:open', 'update:startDate', 'update:endDate'])

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const draftStart = ref('')
const draftEnd = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    draftStart.value = props.startDate
    draftEnd.value = props.endDate
  }
)

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

function dayDiff(start, end) {
  const diff = parseLocalDate(end) - parseLocalDate(start)
  return Math.round(diff / 86400000)
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '선택 전'
  const date = parseLocalDate(dateStr)
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_KO[date.getDay()]})`
}

const today = formatLocalDate(new Date())

const maxSelectableEnd = computed(() => {
  if (!draftStart.value) return props.maxDate
  const limitedEnd = addDays(draftStart.value, props.maxRangeDays - 1)
  return limitedEnd < props.maxDate ? limitedEnd : props.maxDate
})

const canConfirm = computed(() => Boolean(draftStart.value && draftEnd.value))

const selectedDays = computed(() => {
  if (!canConfirm.value) return 0
  return dayDiff(draftStart.value, draftEnd.value) + 1
})

const formattedStart = computed(() => formatDisplayDate(draftStart.value))
const formattedEnd = computed(() => formatDisplayDate(draftEnd.value))

const guideText = computed(() => {
  if (!draftStart.value || draftEnd.value) {
    return '시작일과 종료일을 차례로 눌러 주세요.'
  }

  return `${formattedStart.value} 이후의 종료일을 선택해 주세요.`
})

const months = computed(() => {
  const result = []
  const start = parseLocalDate(props.minDate)
  const end = parseLocalDate(props.maxDate)

  let current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (current <= endMonth) {
    const year = current.getFullYear()
    const month = current.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const startOffset = new Date(year, month, 1).getDay()

    const days = []
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day)
      const dateStr = formatLocalDate(date)
      days.push({
        num: day,
        date: dateStr,
        isToday: dateStr === today,
      })
    }

    result.push({
      key: `${year}-${month}`,
      label: `${year}년 ${month + 1}월`,
      startOffset,
      days,
    })

    current = new Date(year, month + 1, 1)
  }

  return result
})

function weekdayClass(index) {
  if (index === 0) return 'text-red-400'
  if (index === 6) return 'text-blue-400'
  return 'text-gray-400'
}

function isDayDisabled(dateStr) {
  if (dateStr < props.minDate || dateStr > props.maxDate) return true
  if (draftStart.value && !draftEnd.value && dateStr > maxSelectableEnd.value) return true
  return false
}

function isRangeStart(dateStr) {
  return draftStart.value === dateStr
}

function isRangeEnd(dateStr) {
  return draftEnd.value === dateStr
}

function isInRange(dateStr) {
  return canConfirm.value && dateStr >= draftStart.value && dateStr <= draftEnd.value
}

function rangeFillClass(dateStr) {
  if (isRangeStart(dateStr) && isRangeEnd(dateStr)) return 'rounded-full'
  if (isRangeStart(dateStr)) return 'rounded-l-full'
  if (isRangeEnd(dateStr)) return 'rounded-r-full'
  return ''
}

function dayButtonClass(dateStr) {
  if (isDayDisabled(dateStr)) return 'cursor-default'
  return 'cursor-pointer active:scale-[0.98]'
}

function dayCellClass(day) {
  if (isRangeStart(day.date) || isRangeEnd(day.date)) {
    return 'bg-primary text-white shadow-sm'
  }

  if (isInRange(day.date)) {
    return 'bg-primary-light text-primary'
  }

  if (isDayDisabled(day.date)) {
    return 'text-gray-300'
  }

  if (day.isToday) {
    return 'border border-primary/30 text-primary'
  }

  return 'text-gray-800 hover:bg-gray-100 active:bg-gray-100'
}

function selectDate(dateStr) {
  if (isDayDisabled(dateStr)) return

  if (!draftStart.value || draftEnd.value) {
    draftStart.value = dateStr
    draftEnd.value = ''
    return
  }

  if (dateStr < draftStart.value) {
    draftStart.value = dateStr
    draftEnd.value = ''
    return
  }

  draftEnd.value = dateStr
}

function resetSelection() {
  draftStart.value = ''
  draftEnd.value = ''
}

function cancelSelection() {
  draftStart.value = props.startDate
  draftEnd.value = props.endDate
  emit('update:open', false)
}

function confirmSelection() {
  if (!canConfirm.value) return
  emit('update:startDate', draftStart.value)
  emit('update:endDate', draftEnd.value)
  emit('update:open', false)
}
</script>

<style scoped>
.range-sheet-enter-active {
  transition: opacity 0.25s ease;
}

.range-sheet-leave-active {
  transition: opacity 0.2s ease;
}

.range-sheet-enter-from,
.range-sheet-leave-to {
  opacity: 0;
}

.range-sheet-enter-from .range-panel {
  transform: translateY(100%);
}

.range-sheet-enter-active .range-panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.range-sheet-leave-active .range-panel {
  transition: transform 0.2s ease-in;
}

.range-sheet-leave-to .range-panel {
  transform: translateY(100%);
}
</style>
