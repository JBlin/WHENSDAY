const STORAGE_PREFIX = 'setdate:voted:'
const votedMeetings = new Set()

function getStorageKey(meetingId) {
  return `${STORAGE_PREFIX}${meetingId}`
}

export function hasVotedForMeeting(meetingId) {
  if (!meetingId || typeof window === 'undefined') return false
  if (votedMeetings.has(meetingId)) return true

  try {
    if (window.sessionStorage.getItem(getStorageKey(meetingId)) === '1') {
      votedMeetings.add(meetingId)
      return true
    }

    return window.localStorage.getItem(getStorageKey(meetingId)) === '1'
  } catch {
    return false
  }
}

export function markMeetingAsVoted(meetingId) {
  if (!meetingId || typeof window === 'undefined') return

  votedMeetings.add(meetingId)

  try {
    window.sessionStorage.setItem(getStorageKey(meetingId), '1')
    window.localStorage.setItem(getStorageKey(meetingId), '1')
  } catch {
    // Ignore storage failures and keep the core voting flow working.
  }
}
