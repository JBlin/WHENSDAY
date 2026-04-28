<template>
  <div class="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p v-if="!selectedType" class="text-sm text-gray-500">
      참고 정보를 선택하면 날짜별 정보를 볼 수 있어요.
    </p>

    <div v-else-if="selectedType === 'sea'" class="space-y-5">
      <section class="space-y-2">
        <div>
          <p class="text-sm font-semibold text-gray-900">물때표</p>
          <p class="mt-1 text-xs text-gray-500">선택한 약속 기간의 물때를 확인해 보세요.</p>
        </div>

        <div
          v-if="showTideLimitMessage"
          class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
        >
          물때표는 최대 60일 범위까지만 제공돼요.
        </div>

        <div v-else-if="tideRows.length" class="overflow-hidden rounded-xl border border-white bg-white">
          <div
            v-for="row in tideRowsWithLast"
            :key="row.date"
            class="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
            :class="row.isLast ? '' : 'border-b border-gray-100'"
          >
            <span class="font-medium text-gray-700">{{ row.dateLabel }}</span>
            <span class="text-gray-600">{{ row.tideLabel }}</span>
          </div>
        </div>
      </section>

      <section class="space-y-2">
        <div>
          <p class="text-sm font-semibold text-gray-900">{{ seaDetailTitle }}</p>
          <p class="mt-1 text-xs text-gray-500">낚시지수, 수온, 유속, 풍속, 파고를 함께 보여드려요.</p>
        </div>

        <div
          v-if="!seaAvailable"
          class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
        >
          이 지역은 바다 정보를 제공하지 않아요.
          <br />
          바다 정보를 보려면 약속 지역을 바다 포인트로 선택해 주세요.
        </div>

        <template v-else>
          <p v-if="loading" class="text-sm text-gray-500">참고 정보를 불러오는 중이에요...</p>

          <p v-else-if="error" class="text-sm font-medium text-red-500">참고 정보를 불러오지 못했어요.</p>

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
              v-if="showSeaEmptyNote"
              class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
            >
              <p>{{ primaryEmptyMessage }}</p>
              <p class="mt-1">{{ seaSecondaryMessage }}</p>
            </div>
          </template>
        </template>
      </section>
    </div>

    <div v-else class="space-y-4">
      <p class="text-sm font-semibold text-gray-900">{{ infoTitle }}</p>

      <p v-if="loading" class="text-sm text-gray-500">참고 정보를 불러오는 중이에요...</p>

      <p v-else-if="error" class="text-sm font-medium text-red-500">참고 정보를 불러오지 못했어요.</p>

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
          v-if="showForecastEmptyNote"
          class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
        >
          <p>{{ primaryEmptyMessage }}</p>
          <p class="mt-1">{{ forecastSecondaryMessage }}</p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  FISHING_EMPTY_MESSAGE,
  formatFishingDetailTitle,
  formatFishingPeriodLabel,
  formatFishingSummary,
} from '../lib/fishing.js'
import {
  FORECAST_EMPTY_MESSAGE,
  formatForecastDate,
  formatForecastSummary,
} from '../lib/forecast.js'
import { getForecastTypeLabel } from '../lib/forecastConfig.js'

const PROVIDING_LATER_MESSAGE = '예보 제공 전'
const FORECAST_SECONDARY_MESSAGE = '중기예보는 보통 4~10일 후 날짜부터 확인할 수 있어요.'
const SEA_SECONDARY_MESSAGE = '바다 상세 정보는 제공 시점과 포인트에 따라 일부 날짜가 비어 있을 수 있어요.'

const props = defineProps({
  selectedType: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  detailItems: { type: Array, default: () => [] },
  selectedDates: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '' },
  tideRows: { type: Array, default: () => [] },
  showTideLimitMessage: { type: Boolean, default: false },
  seaAvailable: { type: Boolean, default: true },
  fishingGubun: { type: String, default: '' },
  fishingPlaceName: { type: String, default: '' },
})

const infoTitle = computed(() => {
  const typeLabel = getForecastTypeLabel(props.selectedType)
  return typeLabel ? `${typeLabel} 정보` : '참고 정보'
})

const seaDetailTitle = computed(() => formatFishingDetailTitle(props.fishingGubun, props.fishingPlaceName))

const tideRowsWithLast = computed(() =>
  props.tideRows.map((row, index) => ({
    ...row,
    isLast: index === props.tideRows.length - 1,
  }))
)

const itemMap = computed(() => {
  return props.items.reduce((map, item) => {
    map.set(item.date, item)
    return map
  }, new Map())
})

const detailMap = computed(() => {
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
    return withLastFlag(
      props.selectedDates
        .slice()
        .sort()
        .flatMap((date) => {
          const dateItems = detailMap.value.get(date) || []

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
            dateLabel: `${formatForecastDate(date)} ${formatFishingPeriodLabel(
              item.period,
              item.periodLabel
            )}`,
            summary: formatFishingSummary(item),
            isProvided: true,
          }))
        })
    )
  }

  return withLastFlag(
    props.selectedDates
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
  )
})

const forecastRows = computed(() => {
  const selectedDateSet = new Set(props.selectedDates)

  if (props.selectedType === 'sea') {
    return withLastFlag(
      props.detailItems
        .filter((item) => !selectedDateSet.has(item.date))
        .map((item, index) => ({
          key: `forecast-${item.date}-${item.period || 'all'}-${index}`,
          dateLabel: `${formatForecastDate(item.date)} ${formatFishingPeriodLabel(
            item.period,
            item.periodLabel
          )}`,
          summary: formatFishingSummary(item),
        }))
    )
  }

  return withLastFlag(
    props.items
      .filter((item) => !selectedDateSet.has(item.date))
      .map((item) => ({
        key: `forecast-${item.date}`,
        dateLabel: formatForecastDate(item.date),
        summary: formatForecastSummary(item, props.selectedType),
      }))
  )
})

const primaryEmptyMessage = computed(() => {
  if (props.emptyMessage) return props.emptyMessage
  return props.selectedType === 'sea' ? FISHING_EMPTY_MESSAGE : FORECAST_EMPTY_MESSAGE
})

const forecastSecondaryMessage = computed(() => FORECAST_SECONDARY_MESSAGE)
const seaSecondaryMessage = computed(() => SEA_SECONDARY_MESSAGE)

const showForecastEmptyNote = computed(() => {
  if (!props.selectedType || props.selectedType === 'sea' || props.loading || props.error) return false
  return !props.items.length
})

const showSeaEmptyNote = computed(() => {
  if (props.selectedType !== 'sea' || props.loading || props.error || !props.seaAvailable) return false
  return !props.detailItems.length
})

function withLastFlag(rows) {
  return rows.map((row, index) => ({
    ...row,
    isLast: index === rows.length - 1,
  }))
}
</script>
