<template>
  <div class="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p v-if="!selectedType" class="text-sm text-gray-500">
      참고 정보를 선택하면 날짜별 정보를 볼 수 있어요.
    </p>

    <div v-else-if="selectedType === 'sea'" class="space-y-4">
      <section class="space-y-2">
        <div>
          <p class="text-sm font-semibold text-gray-900">낚시지수</p>
          <p class="mt-1 text-xs text-gray-500">
            <span v-if="regionName">{{ regionName }}의 </span>낚시지수와 파고, 수온, 기온, 풍속을
            날짜별로 확인해 보세요.
          </p>
        </div>

        <div
          v-if="!seaAvailable"
          class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
        >
          이 지역은 바다 정보를 제공하지 않아요.
          <br />
          바다 정보를 보려면 바다 정보가 제공되는 지역을 선택해 주세요.
        </div>

        <template v-else>
          <p v-if="loading" class="text-sm text-gray-500">참고 정보를 불러오는 중이에요...</p>

          <p v-else-if="error" class="text-sm font-medium text-red-500">
            참고 정보를 불러오지 못했어요.
          </p>

          <template v-else>
            <div
              v-if="showTideLimitMessage"
              class="rounded-xl border border-dashed border-gray-200 bg-white px-3 py-3 text-sm text-gray-500"
            >
              캘린더의 물때 표시는 최대 60일 범위까지만 제공돼요.
            </div>

            <div v-if="seaSelectedRows.length" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">선택한 날짜</p>
              <div class="space-y-2">
                <div
                  v-for="row in seaSelectedRows"
                  :key="row.key"
                  class="overflow-hidden rounded-xl border border-white bg-white"
                >
                  <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-2">
                    <span class="text-xs font-semibold text-gray-500">{{ row.dateLabel }}</span>
                  </div>
                  <div v-if="row.fields && row.fields.length">
                    <div
                      v-for="(field, fi) in row.fields"
                      :key="field.label"
                      class="flex items-center justify-between px-3 py-2 text-sm"
                      :class="fi < row.fields.length - 1 ? 'border-b border-gray-100' : ''"
                    >
                      <span class="text-gray-500">{{ field.label }}</span>
                      <span class="font-medium text-gray-800">{{ field.value }}</span>
                    </div>
                  </div>
                  <div v-else class="px-3 py-2.5 text-sm font-medium text-gray-400">
                    낚시지수 데이터 없음
                  </div>
                </div>
              </div>
            </div>

            <div v-if="seaForecastRows.length" class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">
                일자별 낚시지수
              </p>
              <div class="space-y-2">
                <div
                  v-for="row in seaForecastRows"
                  :key="row.key"
                  class="overflow-hidden rounded-xl border border-white bg-white"
                >
                  <div class="border-b border-gray-100 bg-gray-50/80 px-3 py-2">
                    <span class="text-xs font-semibold text-gray-500">{{ row.dateLabel }}</span>
                  </div>
                  <div>
                    <div
                      v-for="(field, fi) in row.fields"
                      :key="field.label"
                      class="flex items-center justify-between px-3 py-2 text-sm"
                      :class="fi < row.fields.length - 1 ? 'border-b border-gray-100' : ''"
                    >
                      <span class="text-gray-500">{{ field.label }}</span>
                      <span class="font-medium text-gray-800">{{ field.value }}</span>
                    </div>
                  </div>
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
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">날짜별 예보</p>
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
  FISHING_MISSING_SUMMARY,
  formatFishingPeriodLabel,
  formatFishingSummary,
} from '../lib/fishing.js'
import {
  FORECAST_EMPTY_MESSAGE,
  formatForecastDate,
  formatForecastSummary,
} from '../lib/forecast.js'
import { getForecastTypeLabel } from '../lib/forecastConfig.js'

const PROVIDING_LATER_MESSAGE = '제공 전'
const FORECAST_SECONDARY_MESSAGE =
  '중기예보는 보통 4~10일 뒤 날짜부터 확인할 수 있어요.'
const SEA_SECONDARY_MESSAGE =
  '낚시지수 API 제공 시점에 따라 일부 날짜는 데이터가 없을 수 있어요.'

const props = defineProps({
  selectedType: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  detailItems: { type: Array, default: () => [] },
  selectedDates: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  emptyMessage: { type: String, default: '' },
  showTideLimitMessage: { type: Boolean, default: false },
  seaAvailable: { type: Boolean, default: true },
  regionName: { type: String, default: '' },
})

const infoTitle = computed(() => {
  const typeLabel = getForecastTypeLabel(props.selectedType)
  return typeLabel ? `${typeLabel} 정보` : '참고 정보'
})

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
                key: `selected-${date}-missing`,
                dateLabel: formatForecastDate(date),
                summary: FISHING_MISSING_SUMMARY,
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
  return !props.detailItems.length && !props.selectedDates.length
})

const seaSelectedRows = computed(() => {
  if (props.selectedType !== 'sea' || !props.selectedDates.length) return []

  return props.selectedDates.slice().sort().flatMap((date) => {
    const dateItems = detailMap.value.get(date) || []
    if (!dateItems.length) {
      return [{ key: `sea-s-${date}-missing`, dateLabel: formatForecastDate(date), fields: null }]
    }
    return dateItems.map((item, idx) => ({
      key: `sea-s-${date}-${item.period || 'all'}-${idx}`,
      dateLabel: formatPeriodDateLabel(date, item),
      fields: buildSeaFields(item),
    }))
  })
})

const seaForecastRows = computed(() => {
  if (props.selectedType !== 'sea') return []
  const selectedDateSet = new Set(props.selectedDates)
  return props.detailItems
    .filter((item) => !selectedDateSet.has(item.date))
    .map((item, idx) => ({
      key: `sea-f-${item.date}-${item.period || 'all'}-${idx}`,
      dateLabel: formatPeriodDateLabel(item.date, item),
      fields: buildSeaFields(item),
    }))
})

function formatPeriodDateLabel(date, item) {
  const periodStr = formatFishingPeriodLabel(item.period, item.periodLabel)
  const dateStr = formatForecastDate(date)
  return periodStr ? `${dateStr} ${periodStr}` : dateStr
}

function buildSeaFields(item) {
  const rows = []
  if (item.fishingIndex) rows.push({ label: '바다낚시지수', value: item.fishingIndex })
  const wave = formatMinMax(item.waveMin, item.waveMax, 'm')
  if (wave) rows.push({ label: '파고', value: wave })
  const waterTemp = formatMinMax(item.waterTempMin, item.waterTempMax, '°')
  if (waterTemp) rows.push({ label: '수온', value: waterTemp })
  const airTemp = formatMinMax(item.airTempMin, item.airTempMax, '°')
  if (airTemp) rows.push({ label: '기온', value: airTemp })
  const wind = formatMinMax(item.windSpeedMin, item.windSpeedMax, 'm/s')
  if (wind) rows.push({ label: '풍속', value: wind })
  return rows
}

function formatMinMax(min, max, unit) {
  const hasMin = min != null && Number.isFinite(min)
  const hasMax = max != null && Number.isFinite(max)
  if (!hasMin && !hasMax) return ''
  if (hasMin && hasMax) return `최저 ${min}${unit} · 최고 ${max}${unit}`
  return hasMin ? `${min}${unit}` : `${max}${unit}`
}

function withLastFlag(rows) {
  return rows.map((row, index) => ({
    ...row,
    isLast: index === rows.length - 1,
  }))
}
</script>
