import weatherSunnyIcon from '../img/weather-sunny.svg'
import weatherPartlyCloudyIcon from '../img/weather-partly-cloudy.svg'
import weatherCloudyIcon from '../img/cloudweather-cloudy 1.svg'
import weatherRainIcon from '../img/weather-rain.svg'
import weatherSnowIcon from '../img/weather-snow.svg'

export function resolveWeatherIconSrc(weather) {
  const text = typeof weather === 'string' ? weather.trim() : ''

  if (!text) return null
  if (text.includes('\uB208')) return weatherSnowIcon
  if (text.includes('\uBE44') || text.includes('\uC18C\uB098\uAE30')) return weatherRainIcon
  if (text.includes('\uD750')) return weatherCloudyIcon
  if (text.includes('\uAD6C\uB984')) return weatherPartlyCloudyIcon
  if (text.includes('\uB9D1')) return weatherSunnyIcon

  return null
}

export function buildWeatherIconMap(items) {
  return (items || []).reduce((map, item) => {
    if (!item?.date) return map

    const iconSrc = resolveWeatherIconSrc(item.weather)
    if (!iconSrc) return map

    map[item.date] = iconSrc
    return map
  }, {})
}
