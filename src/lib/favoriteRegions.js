const FAVORITE_REGIONS_STORAGE_KEY = 'whensday_favorite_regions'

export function getFavoriteRegionIds() {
  if (typeof window === 'undefined') return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FAVORITE_REGIONS_STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed.filter(Boolean) : []
  } catch {
    return []
  }
}

export function setFavoriteRegionIds(regionIds) {
  if (typeof window === 'undefined') return []

  const nextIds = [...new Set((regionIds || []).filter(Boolean))]

  try {
    window.localStorage.setItem(FAVORITE_REGIONS_STORAGE_KEY, JSON.stringify(nextIds))
  } catch {
    // Ignore storage errors to avoid blocking the core meeting flow.
  }

  return nextIds
}

export function isFavoriteRegion(regionId) {
  return getFavoriteRegionIds().includes(regionId)
}

export function toggleFavoriteRegion(regionId) {
  if (!regionId) return getFavoriteRegionIds()

  const currentIds = getFavoriteRegionIds()

  if (currentIds.includes(regionId)) {
    return setFavoriteRegionIds(currentIds.filter((id) => id !== regionId))
  }

  return setFavoriteRegionIds([...currentIds, regionId])
}
