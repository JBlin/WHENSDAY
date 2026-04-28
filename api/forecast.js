import {
  DEFAULT_FORECAST_REGION,
  DEFAULT_SEA_AREA,
  LAND_REGION_MAP,
  SEA_AREA_MAP,
} from '../src/lib/forecastConfig.js'

const KMA_BASE_URL = 'https://apihub.kma.go.kr/api/typ02/openApi/MidFcstInfoService'
const FORECAST_DAY_RANGE = [4, 5, 6, 7, 8, 9, 10]

function getKstNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const partMap = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return new Date(
    Date.UTC(
      Number(partMap.year),
      Number(partMap.month) - 1,
      Number(partMap.day),
      Number(partMap.hour),
      Number(partMap.minute),
      0,
      0
    )
  )
}

function formatPseudoDate(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')

  return `${year}${month}${day}${hour}${minute}`
}

function formatIsoDate(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(baseYmd, days) {
  const year = Number(baseYmd.slice(0, 4))
  const month = Number(baseYmd.slice(4, 6))
  const day = Number(baseYmd.slice(6, 8))
  const target = new Date(Date.UTC(year, month - 1, day))
  target.setUTCDate(target.getUTCDate() + days)
  return formatIsoDate(target)
}

function getLatestTmFc() {
  const kstNow = getKstNow()
  const hour = kstNow.getUTCHours()

  if (hour < 6) {
    kstNow.setUTCDate(kstNow.getUTCDate() - 1)
    kstNow.setUTCHours(18, 0, 0, 0)
    return formatPseudoDate(kstNow)
  }

  if (hour < 18) {
    kstNow.setUTCHours(6, 0, 0, 0)
    return formatPseudoDate(kstNow)
  }

  kstNow.setUTCHours(18, 0, 0, 0)
  return formatPseudoDate(kstNow)
}

function toNumber(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function extractFirstItem(payload) {
  const items = payload?.response?.body?.items?.item

  if (Array.isArray(items)) {
    return items[0] || null
  }

  return items || null
}

function createApiError(status, message, details) {
  const error = new Error(message)
  error.status = status
  error.details = details
  return error
}

async function requestKma(endpoint, params) {
  const serviceKey = process.env.KMA_SERVICE_KEY

  if (!serviceKey) {
    throw createApiError(500, 'KMA service key is missing.')
  }

  const url = new URL(`${KMA_BASE_URL}/${endpoint}`)
  url.search = new URLSearchParams({
    pageNo: '1',
    numOfRows: '10',
    dataType: 'JSON',
    authKey: serviceKey,
    ...params,
  }).toString()

  const response = await fetch(url.toString())

  if (!response.ok) {
    throw createApiError(502, 'KMA API request failed.', {
      status: response.status,
      statusText: response.statusText,
    })
  }

  const payload = await response.json()
  const resultCode = String(payload?.response?.header?.resultCode || '')

  if (resultCode !== '00') {
    throw createApiError(502, 'KMA API returned an error response.', payload?.response?.header)
  }

  return extractFirstItem(payload)
}

function normalizeWeatherForecast(item, tmFc) {
  if (!item) return []

  const baseDate = tmFc.slice(0, 8)

  return FORECAST_DAY_RANGE.map((day) => {
    const weather = item[`wf${day}Pm`] || item[`wf${day}Am`] || item[`wf${day}`] || ''
    const rainProbability =
      toNumber(item[`rnSt${day}Pm`]) ??
      toNumber(item[`rnSt${day}Am`]) ??
      toNumber(item[`rnSt${day}`])

    if (!weather && rainProbability == null) {
      return null
    }

    return {
      date: addDays(baseDate, day),
      weather: weather || '제공 전',
      rainProbability: rainProbability ?? 0,
    }
  }).filter(Boolean)
}

function normalizeTemperatureForecast(item, tmFc) {
  if (!item) return []

  const baseDate = tmFc.slice(0, 8)

  return FORECAST_DAY_RANGE.map((day) => {
    const minTemp = toNumber(item[`taMin${day}`])
    const maxTemp = toNumber(item[`taMax${day}`])

    if (minTemp == null && maxTemp == null) {
      return null
    }

    return {
      date: addDays(baseDate, day),
      minTemp,
      maxTemp,
    }
  }).filter(Boolean)
}

function buildWaveHeight(item, day) {
  const minWaveHeight =
    toNumber(item[`wh${day}APm`]) ??
    toNumber(item[`wh${day}AAm`]) ??
    toNumber(item[`wh${day}A`])
  const maxWaveHeight =
    toNumber(item[`wh${day}BPm`]) ??
    toNumber(item[`wh${day}BAm`]) ??
    toNumber(item[`wh${day}B`])

  if (minWaveHeight == null && maxWaveHeight == null) {
    return ''
  }

  if (minWaveHeight != null && maxWaveHeight != null) {
    return `${minWaveHeight}~${maxWaveHeight}m`
  }

  const waveHeight = minWaveHeight ?? maxWaveHeight
  return `${waveHeight}m`
}

function normalizeSeaForecast(item, tmFc) {
  if (!item) return []

  const baseDate = tmFc.slice(0, 8)

  return FORECAST_DAY_RANGE.map((day) => {
    const weather = item[`wf${day}Pm`] || item[`wf${day}Am`] || item[`wf${day}`] || ''
    const waveHeight = buildWaveHeight(item, day)

    if (!weather && !waveHeight) {
      return null
    }

    return {
      date: addDays(baseDate, day),
      weather: weather || '제공 전',
      waveHeight: waveHeight || '제공 전',
    }
  }).filter(Boolean)
}

function resolveRequestConfig(query) {
  const type = String(query.type || '').trim()

  if (!['weather', 'temperature', 'sea'].includes(type)) {
    throw createApiError(400, 'Invalid forecast type.')
  }

  if (type === 'sea') {
    const seaAreaKey = String(query.seaArea || DEFAULT_SEA_AREA).trim().toLowerCase()
    const seaArea = SEA_AREA_MAP[seaAreaKey]

    if (!seaArea) {
      throw createApiError(400, 'Invalid sea area.')
    }

    return {
      type,
      area: seaArea,
      endpoint: 'getMidSeaFcst',
      params: {
        regId: seaArea.forecastCode,
      },
      normalize: normalizeSeaForecast,
    }
  }

  const regionKey = String(query.region || DEFAULT_FORECAST_REGION).trim().toLowerCase()
  const region = LAND_REGION_MAP[regionKey]

  if (!region) {
    throw createApiError(400, 'Invalid forecast region.')
  }

  return {
    type,
    area: region,
    endpoint: type === 'weather' ? 'getMidLandFcst' : 'getMidTa',
    params: {
      regId: type === 'weather' ? region.landForecastCode : region.temperatureCode,
    },
    normalize: type === 'weather' ? normalizeWeatherForecast : normalizeTemperatureForecast,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.',
    })
  }

  try {
    const config = resolveRequestConfig(req.query)
    const tmFc = getLatestTmFc()
    const item = await requestKma(config.endpoint, {
      ...config.params,
      tmFc,
    })

    return res.status(200).json({
      success: true,
      type: config.type,
      tmFc,
      items: config.normalize(item, tmFc),
    })
  } catch (error) {
    console.error('[WHENSDAY] forecast proxy failed', error)

    return res.status(error?.status || 500).json({
      success: false,
      message: 'Forecast proxy failed.',
    })
  }
}
