import { addDays, parseLocalDate } from './meetingUtils.js'
import {
  DEFAULT_FORECAST_REGION,
  DEFAULT_SEA_AREA,
  getForecastTypeLabel,
  getSeaAreaLabel,
} from './forecastConfig.js'

export const FORECAST_EMPTY_MESSAGE =
  '선택한 기간에 제공되는 예보 정보가 없어요. 중기예보는 발표 시각 기준 4~10일 후 날짜부터 제공돼요.'

export async function fetchForecast(options) {
  const {
    type,
    region = DEFAULT_FORECAST_REGION,
    seaArea = DEFAULT_SEA_AREA,
  } = options || {}

  if (!type) {
    throw new Error('참고 정보 타입이 필요해요.')
  }

  const params = new URLSearchParams({ type })

  if (type === 'sea') {
    params.set('seaArea', seaArea)
  } else {
    params.set('region', region)
  }

  const response = await fetch(`/api/forecast?${params.toString()}`)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error('참고 정보를 불러오지 못했어요.')
  }

  return normalizeForecastPayload(payload)
}

export function filterForecastItemsByRange(items, dateFrom, dateTo) {
  if (!Array.isArray(items) || !dateFrom || !dateTo) return []

  const start = parseLocalDate(dateFrom)
  const end = parseLocalDate(dateTo)

  return items.filter((item) => {
    if (!item?.date) return false

    const target = parseLocalDate(item.date)
    return target >= start && target <= end
  })
}

export function filterForecastDetailItemsByRange(items, dateFrom, dateTo) {
  return filterForecastItemsByRange(items, dateFrom, dateTo)
}

function getBaseDateFromTmFc(tmFc) {
  if (!tmFc || tmFc.length < 8) return ''
  return `${tmFc.slice(0, 4)}-${tmFc.slice(4, 6)}-${tmFc.slice(6, 8)}`
}

function buildDateFromOffset(tmFc, dayOffset) {
  const baseDate = getBaseDateFromTmFc(tmFc)
  if (!baseDate || dayOffset == null) return ''
  return addDays(baseDate, dayOffset)
}

function groupByDayOffset(items) {
  return items.reduce((map, item) => {
    const key = String(item.dayOffset)
    const current = map.get(key) || []
    current.push(item)
    map.set(key, current)
    return map
  }, new Map())
}

function pickPreferredPeriodItem(items) {
  return (
    items.find((item) => item.period === 'am') ||
    items.find((item) => item.period === 'pm') ||
    items.find((item) => item.period === 'all') ||
    items[0] ||
    null
  )
}

function normalizeWeatherItems(payload) {
  const grouped = groupByDayOffset(payload.items || [])

  return [...grouped.entries()]
    .map(([dayOffsetKey, items]) => {
      const dayOffset = Number(dayOffsetKey)
      const preferred = pickPreferredPeriodItem(items)
      const rainPercentValues = items
        .map((item) => item.rainPercent)
        .filter((value) => Number.isFinite(value))

      if (!preferred) return null

      return {
        date: buildDateFromOffset(payload.tmFc, dayOffset),
        weather: preferred.weather || '제공 전',
        rainPercent: rainPercentValues.length ? Math.max(...rainPercentValues) : 0,
      }
    })
    .filter((item) => item?.date)
    .sort((left, right) => left.date.localeCompare(right.date))
}

function normalizeTemperatureItems(payload) {
  return (payload.items || [])
    .map((item) => ({
      date: buildDateFromOffset(payload.tmFc, item.dayOffset),
      tempMin: item.tempMin,
      tempMax: item.tempMax,
    }))
    .filter((item) => item.date)
    .sort((left, right) => left.date.localeCompare(right.date))
}

function normalizeSeaItems(payload) {
  const detailGroups = (payload.detailItems || []).reduce((map, item) => {
    if (!item?.date) return map
    if (!map.has(item.date)) {
      map.set(item.date, item)
    }
    return map
  }, new Map())

  return [...detailGroups.values()]
    .map((item) => ({
      date: item.date,
      tideLabel: item.tideLabel || '',
      totalIndex: item.totalIndex || '',
      waterTempMin: item.waterTempMin,
      waterTempMax: item.waterTempMax,
      currentMin: item.currentMin,
      currentMax: item.currentMax,
      windMin: item.windMin,
      windMax: item.windMax,
      waveMin: item.waveMin,
      waveMax: item.waveMax,
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function normalizeForecastPayload(payload) {
  const normalized = {
    ok: Boolean(payload?.ok),
    type: payload?.type || '',
    tmFc: payload?.tmFc || '',
    noData: Boolean(payload?.noData),
    message: payload?.message || FORECAST_EMPTY_MESSAGE,
    items: [],
    detailItems: [],
  }

  if (normalized.type === 'weather') {
    normalized.items = normalizeWeatherItems(payload)
    return normalized
  }

  if (normalized.type === 'temperature') {
    normalized.items = normalizeTemperatureItems(payload)
    return normalized
  }

  if (normalized.type === 'sea') {
    normalized.items = normalizeSeaItems(payload)
    normalized.detailItems = Array.isArray(payload?.detailItems) ? payload.detailItems : []
    return normalized
  }

  return normalized
}

export function formatForecastDate(dateStr) {
  if (!dateStr) return ''

  const date = parseLocalDate(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]

  return `${month}/${day} ${weekday}`
}

export function formatForecastItem(item, type) {
  const dateLabel = formatForecastDate(item?.date)
  const summary = formatForecastSummary(item, type)

  return summary ? `${dateLabel} · ${summary}` : dateLabel
}

export function formatForecastSummary(item, type) {
  if (!item) return ''

  if (type === 'weather') {
    const weather = item.weather || '예보 제공 전'
    const rainPercent = Number.isFinite(item.rainPercent) ? `${item.rainPercent}%` : '제공 전'
    return `${weather} · 강수확률 ${rainPercent}`
  }

  if (type === 'temperature') {
    const min = Number.isFinite(item.tempMin) ? `${item.tempMin}°` : '제공 전'
    const max = Number.isFinite(item.tempMax) ? `${item.tempMax}°` : '제공 전'
    return `${min} / ${max}`
  }

  if (type === 'sea') {
    const indexLabel = item.totalIndex || '제공 전'
    const tideLabel = item.tideLabel || '예보 제공 전'
    const waterTempLabel = formatRange(item.waterTempMin, item.waterTempMax, '°')
    const currentLabel = formatRange(item.currentMin, item.currentMax, 'kn')
    const windLabel = formatRange(item.windMin, item.windMax, 'm/s')

    return `${indexLabel} · ${tideLabel} · 수온 ${waterTempLabel} · 유속 ${currentLabel} · 풍속 ${windLabel}`
  }

  return ''
}

function formatRange(min, max, unit) {
  const minLabel = Number.isFinite(min) ? `${min}` : ''
  const maxLabel = Number.isFinite(max) ? `${max}` : ''

  if (minLabel && maxLabel) {
    return `${minLabel}~${maxLabel}${unit}`
  }

  if (minLabel) {
    return `${minLabel}${unit}`
  }

  if (maxLabel) {
    return `${maxLabel}${unit}`
  }

  return '제공 전'
}

export function buildTideLabelMap(items) {
  return items.reduce((map, item) => {
    if (!item?.date || !item?.tideLabel || map[item.date]) return map
    map[item.date] = item.tideLabel
    return map
  }, {})
}

export function formatForecastPeriodLabel(period, periodLabel = '') {
  if (periodLabel) return periodLabel
  if (period === 'am') return '오전'
  if (period === 'pm') return '오후'
  return '일'
}

export function getForecastSelectionSummary(type, seaArea) {
  if (!type) return ''

  const typeLabel = getForecastTypeLabel(type)

  if (type !== 'sea') {
    return typeLabel
  }

  const seaAreaLabel = getSeaAreaLabel(seaArea)
  return seaAreaLabel ? `${typeLabel} · ${seaAreaLabel}` : typeLabel
}
