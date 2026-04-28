<template>
  <div class="mt-4 rounded-card border border-gray-100 bg-gray-50 p-4">
    <div class="flex flex-wrap items-center gap-2">
      <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">참고 정보</p>
      <span
        v-if="summaryLabel"
        class="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600"
      >
        {{ summaryLabel }}
      </span>
    </div>

    <p v-if="!selectedType" class="mt-3 text-sm text-gray-500">
      참고 정보를 선택하면 날짜별 정보를 볼 수 있어요.
    </p>

    <p v-else-if="loading" class="mt-3 text-sm text-gray-500">
      참고 정보를 불러오는 중이에요...
    </p>

    <p v-else-if="error" class="mt-3 text-sm font-medium text-red-500">
      참고 정보를 불러오지 못했어요.
    </p>

    <p v-else-if="!items.length" class="mt-3 text-sm text-gray-500">
      {{ resolvedEmptyMessage }}
    </p>

    <ul v-else class="mt-3 flex flex-col gap-2">
      <li
        v-for="item in items"
        :key="item.date"
        class="rounded-btn border border-white bg-white px-3 py-2 text-sm text-gray-700"
      >
        {{ formatForecastItem(item, selectedType) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  FORECAST_EMPTY_MESSAGE,
  formatForecastItem,
  getForecastSelectionSummary,
} from '../lib/forecast.js'

const props = defineProps({
  selectedType: { type: String, default: '' },
  seaArea: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '' },
})

const summaryLabel = computed(() =>
  getForecastSelectionSummary(props.selectedType, props.seaArea)
)

const resolvedEmptyMessage = computed(() => props.emptyMessage || FORECAST_EMPTY_MESSAGE)
</script>
