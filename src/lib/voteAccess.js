const STORAGE_PREFIX = 'setdate:voted:'
const NAME_STORAGE_PREFIX = 'setdate:name:'
const votedMeetings = new Set()

function getStorageKey(meetingId) {
  return `${STORAGE_PREFIX}${meetingId}`
}

function getNameStorageKey(meetingId) {
  return `${NAME_STORAGE_PREFIX}${meetingId}`
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

export function getStoredParticipantName(meetingId) {
  if (!meetingId || typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(getNameStorageKey(meetingId)) || ''
  } catch {
    return ''
  }
}

export function storeParticipantName(meetingId, name) {
  if (!meetingId || !name || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getNameStorageKey(meetingId), name.trim())
  } catch {
    // Ignore storage failures and keep the core flow working.
  }
}
