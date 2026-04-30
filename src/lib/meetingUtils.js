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

export function hasNoOverlap(responses) {
  if (!Array.isArray(responses) || responses.length <= 1) return false

  return !Object.values(getAvailabilityMap(responses)).some((count) => count >= 2)
}

export function getClosestRecommendedDate(responses) {
  if (!Array.isArray(responses) || responses.length <= 1) return null

  const uniqueDates = [
    ...new Set(
      responses.flatMap((response) =>
        Array.isArray(response.available_dates) ? response.available_dates : []
      )
    ),
  ].sort((left, right) => left.localeCompare(right))

  if (!uniqueDates.length) return null

  return uniqueDates
    .map((candidateDate) => {
      let totalDistance = 0
      let maxDistance = 0
      let exactMatchCount = 0

      responses.forEach((response) => {
        const dates = Array.isArray(response.available_dates) ? response.available_dates : []
        if (!dates.length) return

        let nearestDistance = Infinity

        dates.forEach((date) => {
          const distance = Math.abs(
            (parseLocalDate(candidateDate) - parseLocalDate(date)) / 86400000
          )

          if (distance < nearestDistance) {
            nearestDistance = distance
          }

          if (date === candidateDate) {
            exactMatchCount += 1
          }
        })

        totalDistance += nearestDistance
        maxDistance = Math.max(maxDistance, nearestDistance)
      })

      return {
        date: candidateDate,
        count: exactMatchCount,
        totalDistance,
        maxDistance,
      }
    })
    .sort((left, right) => {
      return (
        right.count - left.count ||
        left.totalDistance - right.totalDistance ||
        left.maxDistance - right.maxDistance ||
        left.date.localeCompare(right.date)
      )
    })[0]
}
