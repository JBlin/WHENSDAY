import { addDays, formatLocalDate, parseLocalDate, rangeDayCount } from './meetingUtils.js'

const LUNAR_DAY_FORMATTER = new Intl.DateTimeFormat('ko-KR-u-ca-chinese', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'Asia/Seoul',
})

export function calculateTideNumberFromLunarDay(lunarDay) {
  // NOTE: Product requirement also mentions "음력 1일 = 8물" and "음력 15일 = 8물",
  // but the provided formula yields 6 for 음력 1일 and 5 for 음력 15일.
  // We intentionally follow the provided formula first and leave this mismatch visible for later verification.
  return ((lunarDay + 4) % 15) + 1
}

export function formatTideNumber(tideNumber) {
  return `${tideNumber}물`
}

export function getLunarDayFromSolarDate(dateStr) {
  if (!dateStr) return null

  const date = new Date(`${dateStr}T12:00:00+09:00`)
  const dayPart = LUNAR_DAY_FORMATTER.formatToParts(date).find((part) => part.type === 'day')
  const lunarDay = Number(dayPart?.value || '')

  return Number.isFinite(lunarDay) ? lunarDay : null
}

export function getTideInfo(dateStr) {
  const lunarDay = getLunarDayFromSolarDate(dateStr)

  if (!Number.isFinite(lunarDay)) {
    return {
      date: dateStr,
      lunarDay: null,
      tideNumber: null,
      tideLabel: '',
    }
  }

  const tideNumber = calculateTideNumberFromLunarDay(lunarDay)

  return {
    date: dateStr,
    lunarDay,
    tideNumber,
    tideLabel: formatTideNumber(tideNumber),
  }
}

export function buildTideTable(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return []

  const totalDays = rangeDayCount(dateFrom, dateTo)

  if (!Number.isFinite(totalDays) || totalDays <= 0) return []

  const rows = []

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = offset === 0 ? dateFrom : addDays(dateFrom, offset)
    rows.push(getTideInfo(date))
  }

  return rows
}

export function buildTideLabelMap(tideRows) {
  return (tideRows || []).reduce((map, row) => {
    if (!row?.date || !row?.tideLabel) return map
    map[row.date] = row.tideLabel
    return map
  }, {})
}

export function isTideRangeSupported(dateFrom, dateTo, maxDays = 60) {
  if (!dateFrom || !dateTo) return false
  return rangeDayCount(dateFrom, dateTo) <= maxDays
}

export function toTideTableRow(dateStr) {
  const tide = getTideInfo(dateStr)
  return {
    ...tide,
    date: formatLocalDate(parseLocalDate(dateStr)),
  }
}
