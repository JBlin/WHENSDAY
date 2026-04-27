<template>
  <div v-if="bestDates.length" class="mb-5">
    <h2 class="text-sm font-semibold text-gray-500 mb-3 px-1">추천 날짜</h2>
    <div class="flex flex-col gap-2">
      <div
        v-for="(item, i) in bestDates"
        :key="item.date"
        class="flex items-center gap-3 bg-white rounded-card px-4 py-3 shadow-sm border"
        :class="i === 0 ? 'border-primary' : 'border-transparent'"
      >
        <div
          class="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base shrink-0"
          :class="i === 0 ? 'bg-primary text-white' : 'bg-primary-light text-primary'"
        >
          {{ i + 1 }}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 text-sm">{{ formatDate(item.date) }}</p>
          <p class="text-xs text-gray-500 mt-0.5">
            {{ item.count }}명 / {{ totalParticipants }}명 가능
            <span v-if="item.count === totalParticipants" class="text-green-600 font-semibold">전원 가능</span>
          </p>
        </div>
        <div class="shrink-0">
          <div class="text-right">
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full"
              :class="item.count === totalParticipants ? 'bg-green-100 text-green-700' : 'bg-primary-light text-primary'"
            >
              {{ ratio(item.count) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  responses: { type: Array, default: () => [] },
  totalParticipants: { type: Number, default: 0 },
})

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const bestDates = computed(() => {
  const map = {}
  props.responses.forEach((response) => {
    response.available_dates?.forEach((date) => {
      map[date] = (map[date] || 0) + 1
    })
  })

  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
    .slice(0, 3)
})

function ratio(count) {
  if (!props.totalParticipants) return 0
  return Math.round((count / props.totalParticipants) * 100)
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = DAY_KO[date.getDay()]
  return `${month}월 ${day}일 (${weekday})`
}
</script>
