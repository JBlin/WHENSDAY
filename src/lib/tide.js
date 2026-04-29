import { addDays, formatLocalDate, parseLocalDate, rangeDayCount } from './meetingUtils.js'

export const TIDE_BASE_DATE = '2026-04-29'

const WEST_TIDE_CYCLE = [...Array.from({ length: 13 }, (_, index) => `${index + 1}물`), '조금', '무시']
const SOUTH_EAST_TIDE_CYCLE = [
  ...Array.from({ length: 14 }, (_, index) => `${index + 1}물`),
  '조금',
]

export const TIDE_AREA_CONFIG = {
  west: {
    areaCode: 'west',
    baseDate: TIDE_BASE_DATE,
    startLabel: '4물',
    cycle: WEST_TIDE_CYCLE,
  },
  south: {
    areaCode: 'south',
    baseDate: TIDE_BASE_DATE,
    startLabel: '5물',
    cycle: SOUTH_EAST_TIDE_CYCLE,
  },
  east: {
    areaCode: 'east',
    baseDate: TIDE_BASE_DATE,
    startLabel: '5물',
    cycle: SOUTH_EAST_TIDE_CYCLE,
  },
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor
}

function parseTideNumber(label) {
  if (typeof label !== 'string' || !label.endsWith('물')) return null

  const value = Number(label.replace('물', ''))
  return Number.isFinite(value) ? value : null
}

export function formatTideNumber(tideNumber) {
  return `${tideNumber}물`
}

export function getTideAreaConfig(seaAreaCode) {
  return TIDE_AREA_CONFIG[seaAreaCode] || null
}

export function getTideCycleLabels(seaAreaCode) {
  const config = getTideAreaConfig(seaAreaCode)
  return config ? [...config.cycle] : []
}

export function getTideDayOffset(dateStr, baseDate = TIDE_BASE_DATE) {
  if (!dateStr || !baseDate) return null

  const target = parseLocalDate(dateStr)
  const anchor = parseLocalDate(baseDate)
  return Math.round((target - anchor) / 86400000)
}

export function getTideLabelByOffset(seaAreaCode, dayOffset) {
  const config = getTideAreaConfig(seaAreaCode)
  if (!config || !Number.isFinite(dayOffset)) return ''

  const startIndex = config.cycle.indexOf(config.startLabel)
  if (startIndex < 0 || !config.cycle.length) return ''

  return config.cycle[positiveModulo(startIndex + dayOffset, config.cycle.length)] || ''
}

export function getTideInfo(dateStr, seaAreaCode) {
  const config = getTideAreaConfig(seaAreaCode)
  if (!config || !dateStr) {
    return {
      date: dateStr,
      seaAreaCode: seaAreaCode || null,
      baseDate: config?.baseDate || TIDE_BASE_DATE,
      dayOffset: null,
      tideNumber: null,
      tideLabel: '',
    }
  }

  const dayOffset = getTideDayOffset(dateStr, config.baseDate)
  const tideLabel = getTideLabelByOffset(seaAreaCode, dayOffset)

  return {
    date: dateStr,
    seaAreaCode: config.areaCode,
    baseDate: config.baseDate,
    dayOffset,
    tideNumber: parseTideNumber(tideLabel),
    tideLabel,
  }
}

export function buildTideTable(dateFrom, dateTo, seaAreaCode) {
  if (!dateFrom || !dateTo || !seaAreaCode) return []

  const totalDays = rangeDayCount(dateFrom, dateTo)
  if (!Number.isFinite(totalDays) || totalDays <= 0) return []

  const rows = []

  for (let offset = 0; offset < totalDays; offset += 1) {
    const date = offset === 0 ? dateFrom : addDays(dateFrom, offset)
    rows.push(getTideInfo(date, seaAreaCode))
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

export function toTideTableRow(dateStr, seaAreaCode) {
  const tide = getTideInfo(dateStr, seaAreaCode)
  return {
    ...tide,
    date: formatLocalDate(parseLocalDate(dateStr)),
  }
}
