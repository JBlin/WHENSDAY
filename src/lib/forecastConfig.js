export const DEFAULT_FORECAST_REGION = 'seoul'
export const DEFAULT_SEA_AREA = 'west'

export const FORECAST_TYPE_OPTIONS = [
  { id: 'weather', label: '날씨' },
  { id: 'temperature', label: '온도' },
  { id: 'sea', label: '바다' },
]

export const LAND_REGION_MAP = {
  seoul: {
    id: 'seoul',
    label: '서울',
    landForecastCode: '11B00000',
    temperatureCode: '11B10101',
  },
}

export const SEA_AREA_MAP = {
  west: {
    id: 'west',
    label: '서해',
    forecastCode: '12A20000',
    zoneLabel: '서해중부',
  },
  south: {
    id: 'south',
    label: '남해',
    forecastCode: '12B20000',
    zoneLabel: '남해동부',
  },
  east: {
    id: 'east',
    label: '동해',
    forecastCode: '12C20000',
    zoneLabel: '동해남부',
  },
}

export function getForecastTypeLabel(type) {
  return FORECAST_TYPE_OPTIONS.find((option) => option.id === type)?.label || ''
}

export function getSeaAreaLabel(seaArea) {
  return SEA_AREA_MAP[seaArea]?.label || ''
}
