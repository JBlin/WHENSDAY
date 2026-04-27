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
        <div v-for="n in month.startOffset" :key="'e-' + n" />

        <button
          v-for="day in month.days"
          :key="day.date"
          type="button"
          :disabled="!day.inRange"
          @click="day.inRange && emit('select', day.date)"
          class="flex items-center justify-center h-10 w-full rounded-lg text-sm font-medium transition-all duration-150 relative"
          :class="day.inRange ? 'cursor-pointer' : 'cursor-default'"
        >
          <span
            v-if="day.inRange"
            class="w-9 h-9 rounded-lg flex flex-col items-center justify-center leading-none"
            :style="{ backgroundColor: heatColor(day.date) }"
          >
            <span :class="textColor(day.date)" class="text-xs font-semibold">{{ day.num }}</span>
            <span v-if="countMap[day.date]" :class="textColor(day.date)" class="text-[9px] opacity-80">
              {{ countMap[day.date] }}명
            </span>
          </span>
          <span v-else class="text-gray-300 text-xs">{{ day.num }}</span>
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
  responses: { type: Array, default: () => [] },
  totalParticipants: { type: Number, default: 0 },
})

const emit = defineEmits(['select'])

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const countMap = computed(() => {
  const map = {}
  props.responses.forEach((response) => {
    response.available_dates?.forEach((date) => {
      map[date] = (map[date] || 0) + 1
    })
  })
  return map
})

function heatColor(dateStr) {
  const count = countMap.value[dateStr] || 0
  const total = props.totalParticipants

  if (!total || count === 0) return '#f3f4f6'

  const pct = count / total
  if (pct === 1) return '#14532d'
  if (pct >= 0.67) return '#16a34a'
  if (pct >= 0.34) return '#4ade80'
  return '#bbf7d0'
}

function textColor(dateStr) {
  const count = countMap.value[dateStr] || 0
  const total = props.totalParticipants

  if (!total || count === 0) return 'text-gray-400'
  if (count / total >= 0.67) return 'text-white'
  return 'text-gray-700'
}

const rangeStart = computed(() => new Date(props.dateFrom + 'T00:00:00'))
const rangeEnd = computed(() => new Date(props.dateTo + 'T00:00:00'))

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const months = computed(() => {
  const result = []
  const start = rangeStart.value
  const end = rangeEnd.value

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
        inRange: date >= start && date <= end,
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
