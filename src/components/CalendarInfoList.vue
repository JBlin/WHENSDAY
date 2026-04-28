<template>
  <div class="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p v-if="!selectedType" class="text-sm text-gray-500">
      참고 정보를 선택하면 날짜별 정보를 볼 수 있어요.
    </p>

    <div v-else class="space-y-4">
      <p class="text-sm font-semibold text-gray-900">{{ infoTitle }}</p>

      <p v-if="loading" class="text-sm text-gray-500">참고 정보를 불러오는 중이에요...</p>

      <p v-else-if="error" class="text-sm font-medium text-red-500">
        참고 정보를 불러오지 못했어요.
      </p>

      <template v-else>
        <div v-if="selectedDateRows.length" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">선택한 날짜</p>
          <div class="overflow-hidden rounded-xl border border-white bg-white">
            <div
              v-for="row in selectedDateRows"
              :key="row.key"
              class="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
              :class="row.isLast ? '' : 'border-b border-gray-100'"
            >
              <span class="shrink-0 font-medium text-gray-700">{{ row.dateLabel }}</span>
              <span
                class="min-w-0 text-right"
                :class="row.isProvided ? 'text-gray-600' : 'font-medium text-gray-400'"
              >
                {{ row.summary }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="forecastRows.length" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">예보 제공 날짜</p>
          <div class="overflow-hidden rounded-xl border border-white bg-white">
            <div
              v-for="row in forecastRows"
              :key="row.key"
              class="flex items-start justify-between gap-3 px-3 py-2.5 text-sm"
              :class="row.isLast ? '' : 'border-b border-gray-100'"
            >
              <span class="shrink-0 font-medium text-gray-700">{{ row.dateLabel }}</span>
              <span class="min-w-0 text-right text-gray-600">{{ row.summary }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="showNoForecastNote"
          class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
        >
          <p>{{ primaryEmptyMessage }}</p>
          <p class="mt-1">{{ secondaryEmptyMessage }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  FORECAST_EMPTY_MESSAGE,
  formatForecastDate,
  formatForecastPeriodLabel,
  formatForecastSummary,
} from '../lib/forecast.js'
import { getForecastTypeLabel, getSeaAreaLabel } from '../lib/forecastConfig.js'

const PROVIDING_LATER_MESSAGE = '예보 제공 전'
const SECONDARY_EMPTY_MESSAGE = '중기예보는 보통 4~10일 후 날짜부터 확인할 수 있어요.'

const props = defineProps({
  selectedType: { type: String, default: '' },
  seaArea: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  detailItems: { type: Array, default: () => [] },
  selectedDates: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '' },
})

const infoTitle = computed(() => {
  if (props.selectedType === 'sea') {
    const areaLabel = getSeaAreaLabel(props.seaArea)
    return areaLabel ? `바다 정보 · ${areaLabel}` : '바다 정보'
  }

  const typeLabel = getForecastTypeLabel(props.selectedType)
  return typeLabel ? `${typeLabel} 정보` : '참고 정보'
})

const itemMap = computed(() => {
  return props.items.reduce((map, item) => {
    map.set(item.date, item)
    return map
  }, new Map())
})

const seaDetailMap = computed(() => {
  return props.detailItems.reduce((map, item) => {
    if (!item?.date) return map

    const current = map.get(item.date) || []
    current.push(item)
    map.set(item.date, current)
    return map
  }, new Map())
})

const selectedDateRows = computed(() => {
  if (!props.selectedDates.length) return []

  if (props.selectedType === 'sea') {
    const rows = props.selectedDates
      .slice()
      .sort()
      .flatMap((date) => {
        const dateItems = seaDetailMap.value.get(date) || []

        if (!dateItems.length) {
          return [
            {
              key: `selected-${date}-pending`,
              dateLabel: formatForecastDate(date),
              summary: PROVIDING_LATER_MESSAGE,
              isProvided: false,
            },
          ]
        }

        return dateItems.map((item, index) => ({
          key: `selected-${date}-${item.period || 'all'}-${index}`,
          dateLabel: `${formatForecastDate(date)} ${formatForecastPeriodLabel(
            item.period,
            item.periodLabel
          )}`,
          summary: formatForecastSummary(item, props.selectedType),
          isProvided: true,
        }))
      })

    return withLastFlag(rows)
  }

  const rows = props.selectedDates
    .slice()
    .sort()
    .map((date) => {
      const item = itemMap.value.get(date)

      return {
        key: `selected-${date}`,
        dateLabel: formatForecastDate(date),
        summary: item ? formatForecastSummary(item, props.selectedType) : PROVIDING_LATER_MESSAGE,
        isProvided: Boolean(item),
      }
    })

  return withLastFlag(rows)
})

const forecastRows = computed(() => {
  const selectedDateSet = new Set(props.selectedDates)

  if (props.selectedType === 'sea') {
    const rows = props.detailItems
      .filter((item) => !selectedDateSet.has(item.date))
      .map((item, index) => ({
        key: `forecast-${item.date}-${item.period || 'all'}-${index}`,
        dateLabel: `${formatForecastDate(item.date)} ${formatForecastPeriodLabel(
          item.period,
          item.periodLabel
        )}`,
        summary: formatForecastSummary(item, props.selectedType),
      }))

    return withLastFlag(rows)
  }

  const rows = props.items
    .filter((item) => !selectedDateSet.has(item.date))
    .map((item) => ({
      key: `forecast-${item.date}`,
      dateLabel: formatForecastDate(item.date),
      summary: formatForecastSummary(item, props.selectedType),
    }))

  return withLastFlag(rows)
})

const primaryEmptyMessage = computed(() => props.emptyMessage || FORECAST_EMPTY_MESSAGE)
const secondaryEmptyMessage = computed(() => SECONDARY_EMPTY_MESSAGE)
const showNoForecastNote = computed(() => {
  if (!props.selectedType || props.loading || props.error) return false

  if (props.selectedType === 'sea') {
    return !props.detailItems.length
  }

  return !props.items.length
})

function withLastFlag(rows) {
  return rows.map((row, index) => ({
    ...row,
    isLast: index === rows.length - 1,
  }))
}
</script>
