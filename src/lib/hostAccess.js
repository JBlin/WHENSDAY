const HOST_STORAGE_PREFIX = 'whensday_host_'

export function getHostStorageKey(meetingId) {
  return `${HOST_STORAGE_PREFIX}${meetingId}`
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

export function hasStoredHostAccess(meetingId, hostToken) {
  if (!meetingId) return false

  const storedToken = getStoredHostToken(meetingId)

  if (!storedToken) return false
  if (!hostToken) return true

  return storedToken === hostToken
}
