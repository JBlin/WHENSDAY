const HOST_STORAGE_PREFIX = 'whensday_host_'
const HOST_RESPONSE_STORAGE_PREFIX = 'whensday_host_response_'

export function getHostStorageKey(meetingId) {
  return `${HOST_STORAGE_PREFIX}${meetingId}`
}

export function getHostResponseStorageKey(meetingId) {
  return `${HOST_RESPONSE_STORAGE_PREFIX}${meetingId}`
}

export function getStoredHostToken(meetingId) {
  if (!meetingId || typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(getHostStorageKey(meetingId)) || ''
  } catch {
    return ''
  }
}

export function storeHostToken(meetingId, hostToken) {
  if (!meetingId || !hostToken || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getHostStorageKey(meetingId), hostToken)
  } catch {
    // Ignore storage failures to keep the core flow working.
  }
}

export function getStoredHostResponseName(meetingId) {
  if (!meetingId || typeof window === 'undefined') return ''

  try {
    return window.localStorage.getItem(getHostResponseStorageKey(meetingId)) || ''
  } catch {
    return ''
  }
}

export function storeHostResponseName(meetingId, name) {
  if (!meetingId || !name || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getHostResponseStorageKey(meetingId), name.trim())
  } catch {
    // Ignore storage failures to keep the core flow working.
  }
}

export function hasStoredHostAccess(meetingId, hostToken) {
  if (!meetingId) return false

  const storedToken = getStoredHostToken(meetingId)

  if (!storedToken) return false
  if (!hostToken) return true

  return storedToken === hostToken
}
