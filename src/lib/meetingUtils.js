const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatLocalDate(date)
}

export function rangeDayCount(start, end) {
  const diff = parseLocalDate(end) - parseLocalDate(start)
  return Math.round(diff / 86400000) + 1
}

export function formatDisplayDate(dateStr, options = {}) {
  if (!dateStr) return ''

  const { withWeekday = true } = options
  const date = parseLocalDate(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (!withWeekday) return `${month}월 ${day}일`

  return `${month}월 ${day}일 (${DAY_KO[date.getDay()]})`
}

export function getAvailabilityMap(responses) {
  const map = {}

  responses.forEach((response) => {
    response.available_dates?.forEach((date) => {
      map[date] = (map[date] || 0) + 1
    })
  })

  return map
}

export function getRecommendedDates(responses) {
  return Object.entries(getAvailabilityMap(responses))
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
}

export function getTopRecommendedDates(responses, limit = 3) {
  return getRecommendedDates(responses).slice(0, limit)
}

export function getPerfectMatchDates(responses, totalParticipants) {
  if (!totalParticipants) return []
  return getRecommendedDates(responses).filter((item) => item.count === totalParticipants)
}

export function getAvailabilityRatio(count, totalParticipants) {
  if (!totalParticipants) return 0
  return Math.round((count / totalParticipants) * 100)
}
