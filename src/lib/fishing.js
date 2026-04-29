import { parseLocalDate } from './meetingUtils.js'

export const FISHING_EMPTY_MESSAGE = '선택한 기간에 제공되는 바다 상세 정보가 없어요.'
export const SEA_UNAVAILABLE_MESSAGE =
  '이 지역은 바다 정보를 제공하지 않아요.\n바다 정보를 보려면 바다 정보가 제공되는 지역을 선택해 주세요.'

export async function fetchFishingForecast(options) {
  const { placeName, gubun } = options || {}

  if (!placeName || !gubun) {
    throw new Error(SEA_UNAVAILABLE_MESSAGE)
  }

  const params = new URLSearchParams({
    placeName,
    gubun,
  })

  const response = await fetch(`/api/fishing?${params.toString()}`)
  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.ok) {
    throw new Error('참고 정보를 불러오지 못했어요.')
  }

  return normalizeFishingPayload(payload)
}

export function filterFishingItemsByRange(items, dateFrom, dateTo) {
  if (!Array.isArray(items) || !dateFrom || !dateTo) return []

  const start = parseLocalDate(dateFrom)
  const end = parseLocalDate(dateTo)

  return items.filter((item) => {
    if (!item?.date) return false

    const target = parseLocalDate(item.date)
    return target >= start && target <= end
  })
}

export function normalizeFishingPayload(payload) {
  return {
    ok: Boolean(payload?.ok),
    placeName: payload?.placeName || '',
    gubun: payload?.gubun || '',
    message: payload?.message || FISHING_EMPTY_MESSAGE,
    items: Array.isArray(payload?.items) ? payload.items : [],
  }
}

export function formatFishingSummary(item) {
  if (!item) return ''

  const fishingIndex = normalizeText(item.fishingIndex) || '제공 전'
  const references = [
    formatNamedRange('풍속', item.windSpeedMin, item.windSpeedMax, 'm/s'),
    formatNamedRange('파고', item.waveMin, item.waveMax, 'm'),
    formatNamedRange('수온', item.waterTempMin, item.waterTempMax, '°'),
    formatNamedRange('유속', item.currentSpeedMin, item.currentSpeedMax, 'kn'),
  ].filter(Boolean)

  return [`낚시지수 ${fishingIndex}`, ...references].join(' / ')
}

export function formatFishingPeriodLabel(period, periodLabel = '') {
  if (periodLabel) return periodLabel
  if (period === 'am') return '오전'
  if (period === 'pm') return '오후'
  return '종일'
}

function normalizeText(value) {
  if (value == null) return ''

  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '-') return ''
  return trimmed
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

function formatNamedRange(label, min, max, unit) {
  const range = formatRange(min, max, unit)
  if (!range || range === '제공 전') return ''
  return `${label} ${range}`
}
