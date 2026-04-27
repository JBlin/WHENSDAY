const STORAGE_PREFIX = 'setdate:voted:'

function getStorageKey(meetingId) {
  return `${STORAGE_PREFIX}${meetingId}`
}

export function hasVotedForMeeting(meetingId) {
  if (!meetingId || typeof window === 'undefined') return false

  try {
    return window.localStorage.getItem(getStorageKey(meetingId)) === '1'
  } catch {
    return false
  }
}

export function markMeetingAsVoted(meetingId) {
  if (!meetingId || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getStorageKey(meetingId), '1')
  } catch {
    // Ignore storage failures and keep the core voting flow working.
  }
}
