<template>
  <div class="bg-white rounded-card p-4 shadow-sm">
    <div v-if="title || description" class="mb-4">
      <h2 v-if="title" class="text-base font-bold text-gray-900">{{ title }}</h2>
      <p v-if="description" class="text-sm text-gray-500 mt-1 whitespace-pre-line">{{ description }}</p>
    </div>

    <div v-if="bestDates.length" class="flex flex-col gap-3">
      <div
        v-for="(item, index) in bestDates"
        :key="item.date"
        class="flex items-start gap-3 rounded-card border px-4 py-3"
        :class="index === 0 ? 'border-primary bg-primary/[0.03]' : 'border-gray-100 bg-white'"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold"
          :class="index === 0 ? 'bg-primary text-white' : 'bg-primary-light text-primary'"
        >
          {{ index + 1 }}
        </div>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold text-gray-900">{{ formatDisplayDate(item.date) }}</p>
            <span
              v-if="item.count === totalParticipants"
              class="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700"
            >
              모두 가능
            </span>
          </div>
          <p class="mt-1 text-xs text-gray-500">
            {{ item.count }}명 / {{ totalParticipants }}명 가능
          </p>
        </div>

        <div class="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
          {{ getAvailabilityRatio(item.count, totalParticipants) }}%
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-gray-400">아직 추천할 날짜가 없어요.</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  formatDisplayDate,
  getAvailabilityRatio,
  getTopRecommendedDates,
} from '../lib/meetingUtils.js'

const props = defineProps({
  responses: { type: Array, default: () => [] },
  totalParticipants: { type: Number, default: 0 },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
})

const bestDates = computed(() => getTopRecommendedDates(props.responses, 3))
</script>
