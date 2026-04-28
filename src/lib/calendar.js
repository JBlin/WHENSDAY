import { addDays } from './meetingUtils.js'

function toCalendarStamp(dateStr) {
  return dateStr.replaceAll('-', '')
}

function escapeIcsValue(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
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

export function downloadIcsFile({ title, date, description = '', fileName = 'meeting.ics' }) {
  if (typeof document === 'undefined') {
    throw new Error('캘린더 파일을 지금은 만들 수 없어요. 잠시 후 다시 시도해 주세요.')
  }

  const uid = `${Date.now()}@whensday`
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const startDate = toCalendarStamp(date)
  const endDate = toCalendarStamp(addDays(date, 1))

  const content = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WHENSDAY//Meeting Calendar//KO',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${escapeIcsValue(title)}`,
    `DESCRIPTION:${escapeIcsValue(description)}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
