import { addDays } from './meetingUtils.js'

function toCalendarStamp(dateStr) {
  return dateStr.replaceAll('-', '')
}

export function buildGoogleCalendarUrl({ title, date, details = '' }) {
  const startDate = toCalendarStamp(date)
  const endDate = toCalendarStamp(addDays(date, 1))
  const url = new URL('https://calendar.google.com/calendar/render')

  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', title)
  url.searchParams.set('dates', `${startDate}/${endDate}`)

  if (details) {
    url.searchParams.set('details', details)
  }

  return url.toString()
}
