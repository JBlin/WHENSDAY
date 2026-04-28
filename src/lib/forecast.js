import { parseLocalDate } from './meetingUtils.js'
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

  if (!response.ok) {
    throw new Error('참고 정보를 불러오지 못했어요.')
  }

  const payload = await response.json()

  if (!payload?.success) {
    throw new Error('참고 정보를 불러오지 못했어요.')
  }

  return payload
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

  if (type === 'weather') {
    return `${dateLabel} · ${item.weather} · 강수확률 ${item.rainProbability}%`
  }

  if (type === 'temperature') {
    return `${dateLabel} · 최저 ${item.minTemp}° / 최고 ${item.maxTemp}°`
  }

  if (type === 'sea') {
    return `${dateLabel} · ${item.weather} · 파고 ${item.waveHeight}`
  }

  return dateLabel
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
