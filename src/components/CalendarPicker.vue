<template>
  <div class="select-none">
    <div v-for="month in months" :key="month.key" class="mb-6">
      <div class="flex items-center justify-between mb-3 px-1">
        <span class="text-sm font-semibold text-gray-700">{{ month.label }}</span>
      </div>

      <div class="grid grid-cols-7 mb-1">
        <div
          v-for="weekday in DAY_KO"
          :key="weekday"
          class="text-center text-xs font-medium py-1"
          :class="weekday === '일' ? 'text-red-400' : weekday === '토' ? 'text-blue-400' : 'text-gray-400'"
        >
          {{ weekday }}
        </div>
      </div>

      <div class="grid grid-cols-7 gap-y-1">
        <div v-for="n in month.startOffset" :key="'empty-' + n" />

        <button
          v-for="day in month.days"
          :key="day.date"
          type="button"
          :disabled="!day.inRange"
          @click="toggleDate(day.date)"
          class="flex items-center justify-center h-10 w-full rounded-lg text-sm font-medium transition-all duration-150 relative"
          :class="dayClass(day)"
        >
          <span v-if="isSelected(day.date) && day.inRange" class="absolute inset-0 flex items-center justify-center">
            <span class="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center text-white font-semibold text-sm">
              {{ day.num }}
            </span>
          </span>
          <span v-else :class="day.inRange ? '' : 'opacity-25'">{{ day.num }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dateFrom: { type: String, required: true },
  dateTo: { type: String, required: true },
  modelValue: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const rangeStart = computed(() => new Date(props.dateFrom + 'T00:00:00'))
const rangeEnd = computed(() => new Date(props.dateTo + 'T00:00:00'))

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSelected(dateStr) {
  return props.modelValue.includes(dateStr)
}

function toggleDate(dateStr) {
  const next = isSelected(dateStr)
    ? props.modelValue.filter((date) => date !== dateStr)
    : [...props.modelValue, dateStr]

  emit('update:modelValue', next)
}

function dayClass(day) {
  if (!day.inRange) return 'cursor-default text-gray-300'
  if (isSelected(day.date)) return 'cursor-pointer'
  return 'cursor-pointer text-gray-800 hover:bg-gray-100 active:bg-gray-200'
}

const months = computed(() => {
  const result = []
  const start = new Date(rangeStart.value)
  const end = new Date(rangeEnd.value)

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
        inRange: date >= rangeStart.value && date <= rangeEnd.value,
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
</script>
