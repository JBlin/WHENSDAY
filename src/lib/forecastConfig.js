export const DEFAULT_WEATHER_REGION_CODE = '11B00000'
export const DEFAULT_TEMPERATURE_REGION_CODE = '11B10101'

export const FORECAST_TYPE_OPTIONS = [
  { id: 'weather', label: '날씨' },
  { id: 'temperature', label: '온도' },
  { id: 'sea', label: '바다' },
]

const SEA_AREA_LABELS = {
  west: '서해',
  south: '남해',
  east: '동해',
}

export function getForecastTypeLabel(type) {
  return FORECAST_TYPE_OPTIONS.find((option) => option.id === type)?.label || ''
}

export function getSeaAreaLabel(seaAreaCode) {
  return SEA_AREA_LABELS[seaAreaCode] || ''
}
