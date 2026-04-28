import {
  DEFAULT_FORECAST_REGION,
  DEFAULT_SEA_AREA,
  LAND_REGION_MAP,
  SEA_AREA_MAP,
} from '../src/lib/forecastConfig.js'

const KMA_BASE_URL = 'https://apis.data.go.kr/1360000/MidFcstInfoService'
const FISHING_BASE_URL = 'https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2'
const FORECAST_DAY_RANGE = [4, 5, 6, 7, 8, 9, 10]
const KMA_NO_DATA_CODE = '03'
const KMA_INVALID_KEY_CODE = '30'
const FISHING_INVALID_KEY_CODE = '22'

function getKstParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

function formatTmFc(year, month, day, hour) {
  return `${year}${month}${day}${hour}`
}

function getLatestTmFc(now = new Date()) {
  const parts = getKstParts(now)
  const currentHour = Number(parts.hour)

  if (currentHour < 6) {
    const previousDate = new Date(
      Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
    )
    previousDate.setUTCDate(previousDate.getUTCDate() - 1)

    return formatTmFc(
      String(previousDate.getUTCFullYear()),
      String(previousDate.getUTCMonth() + 1).padStart(2, '0'),
      String(previousDate.getUTCDate()).padStart(2, '0'),
      '1800'
    )
  }

  if (currentHour < 18) {
    return formatTmFc(parts.year, parts.month, parts.day, '0600')
  }

  return formatTmFc(parts.year, parts.month, parts.day, '1800')
}

function getPreviousTmFc(tmFc) {
  const year = Number(tmFc.slice(0, 4))
  const month = Number(tmFc.slice(4, 6))
  const day = Number(tmFc.slice(6, 8))
  const time = tmFc.slice(8, 12)

  if (time === '1800') {
    return formatTmFc(String(year), String(month).padStart(2, '0'), String(day).padStart(2, '0'), '0600')
  }

  const previousDate = new Date(Date.UTC(year, month - 1, day))
  previousDate.setUTCDate(previousDate.getUTCDate() - 1)

  return formatTmFc(
    String(previousDate.getUTCFullYear()),
    String(previousDate.getUTCMonth() + 1).padStart(2, '0'),
    String(previousDate.getUTCDate()).padStart(2, '0'),
    '1800'
  )
}

function getKstDateCompact(now = new Date()) {
  const parts = getKstParts(now)
  return `${parts.year}${parts.month}${parts.day}`
}

function toNumber(value) {
  if (value === '' || value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeDateString(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
  }
  return ''
}

function createApiError(status, message, details = {}) {
  const error = new Error(message)
  error.status = status
  error.details = details
  return error
}

function extractKmaItems(payload) {
  const items = payload?.response?.body?.items?.item

  if (Array.isArray(items)) return items
  if (items) return [items]
  return []
}

function logKmaError(endpoint, tmFc, header, extra = {}) {
  const resultCode = String(header?.resultCode || '')
  const resultMsg = header?.resultMsg || 'UNKNOWN'

  console.error('[WHENSDAY] KMA API error', {
    endpoint,
    tmFc,
    resultCode,
    resultMsg,
    ...extra,
  })

  if (resultCode === KMA_INVALID_KEY_CODE) {
    console.error('[WHENSDAY] SERVICE_KEY_IS_NOT_REGISTERED', {
      endpoint,
      tmFc,
    })
  }
}

function logFishingError(placeName, reqDate, header, extra = {}) {
  const resultCode = String(header?.resultCode || '')
  const resultMsg = header?.resultMsg || 'UNKNOWN'

  console.error('[WHENSDAY] fishing API error', {
    placeName,
    reqDate,
    resultCode,
    resultMsg,
    ...extra,
  })

  if (resultCode === FISHING_INVALID_KEY_CODE || resultMsg.includes('SERVICE KEY')) {
    console.error('[WHENSDAY] SERVICE_KEY_IS_NOT_REGISTERED', {
      placeName,
      reqDate,
    })
  }
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function requestKma(endpoint, params, tmFc) {
  const serviceKey = process.env.KMA_SERVICE_KEY

  if (!serviceKey) {
    throw createApiError(500, 'KMA service key is missing.')
  }

  const url = new URL(`${KMA_BASE_URL}/${endpoint}`)
  url.search = new URLSearchParams({
    serviceKey,
    numOfRows: '10',
    pageNo: '1',
    dataType: 'JSON',
    tmFc,
    ...params,
  }).toString()

  const response = await fetch(url.toString())
  const text = await response.text()
  const payload = parseJsonSafely(text)
  const header = payload?.response?.header
  const resultCode = String(header?.resultCode || '')
  const resultMsg = header?.resultMsg || ''

  if (header && resultCode !== '00') {
    logKmaError(endpoint, tmFc, header)
  }

  if (!response.ok) {
    throw createApiError(502, 'KMA API request failed.', {
      status: response.status,
      statusText: response.statusText,
      resultCode,
      resultMsg,
      rawText: text.slice(0, 300),
      isInvalidKey: response.status === 401 || resultCode === KMA_INVALID_KEY_CODE,
    })
  }

  if (!payload || !header) {
    throw createApiError(502, 'KMA API returned an unexpected response.', {
      rawText: text.slice(0, 300),
    })
  }

  if (resultCode === KMA_NO_DATA_CODE) {
    throw createApiError(200, 'No forecast data available.', {
      resultCode,
      resultMsg,
      isNoData: true,
    })
  }

  if (resultCode === KMA_INVALID_KEY_CODE) {
    throw createApiError(502, 'Invalid KMA service key.', {
      resultCode,
      resultMsg,
      isInvalidKey: true,
    })
  }

  if (resultCode !== '00') {
    throw createApiError(502, 'KMA API returned an error response.', {
      resultCode,
      resultMsg,
    })
  }

  return {
    header,
    items: extractKmaItems(payload),
  }
}

async function requestFishingForecast(placeName, reqDate) {
  const serviceKey = process.env.KMA_SERVICE_KEY

  if (!serviceKey) {
    throw createApiError(500, 'KMA service key is missing.')
  }

  const url = new URL(FISHING_BASE_URL)
  url.search = new URLSearchParams({
    serviceKey,
    type: 'json',
    numOfRows: '200',
    pageNo: '1',
    reqDate,
    gubun: '선상',
    placeName,
  }).toString()

  const response = await fetch(url.toString())
  const text = await response.text()
  const payload = parseJsonSafely(text)
  const header = payload?.header
  const resultCode = String(header?.resultCode || '')
  const resultMsg = header?.resultMsg || ''

  if (header && resultCode !== '00') {
    logFishingError(placeName, reqDate, header)
  }

  if (!response.ok) {
    throw createApiError(502, 'Fishing forecast API request failed.', {
      status: response.status,
      statusText: response.statusText,
      resultCode,
      resultMsg,
      rawText: text.slice(0, 300),
    })
  }

  if (!payload || !header) {
    throw createApiError(502, 'Fishing forecast API returned an unexpected response.', {
      rawText: text.slice(0, 300),
    })
  }

  if (resultCode === KMA_NO_DATA_CODE) {
    throw createApiError(200, 'No fishing forecast data available.', {
      resultCode,
      resultMsg,
      isNoData: true,
    })
  }

  if (resultCode === FISHING_INVALID_KEY_CODE) {
    throw createApiError(502, 'Invalid service key for fishing forecast.', {
      resultCode,
      resultMsg,
      isInvalidKey: true,
    })
  }

  if (resultCode !== '00') {
    throw createApiError(502, 'Fishing forecast API returned an error response.', {
      resultCode,
      resultMsg,
    })
  }

  return {
    header,
    items: payload?.body?.items?.item || [],
  }
}

function normalizeWeatherForecast(items) {
  const source = items[0]

  if (!source) return []

  const normalized = []

  FORECAST_DAY_RANGE.forEach((dayOffset) => {
    const periods = [
      {
        period: 'am',
        weather: source[`wf${dayOffset}Am`],
        rainPercent: toNumber(source[`rnSt${dayOffset}Am`]),
      },
      {
        period: 'pm',
        weather: source[`wf${dayOffset}Pm`],
        rainPercent: toNumber(source[`rnSt${dayOffset}Pm`]),
      },
    ]

    periods.forEach((item) => {
      if (!item.weather && item.rainPercent == null) return

      normalized.push({
        dayOffset,
        period: item.period,
        weather: item.weather || '제공 전',
        rainPercent: item.rainPercent ?? 0,
      })
    })

    if (dayOffset >= 8) {
      const weather = source[`wf${dayOffset}`]
      const rainPercent = toNumber(source[`rnSt${dayOffset}`])

      if (!weather && rainPercent == null) return

      normalized.push({
        dayOffset,
        period: 'all',
        weather: weather || '제공 전',
        rainPercent: rainPercent ?? 0,
      })
    }
  })

  return normalized
}

function normalizeTemperatureForecast(items) {
  const source = items[0]

  if (!source) return []

  return FORECAST_DAY_RANGE.map((dayOffset) => {
    const tempMin = toNumber(source[`taMin${dayOffset}`])
    const tempMax = toNumber(source[`taMax${dayOffset}`])

    if (tempMin == null && tempMax == null) {
      return null
    }

    return {
      dayOffset,
      tempMin,
      tempMax,
    }
  }).filter(Boolean)
}

function normalizeSeaForecast(items) {
  const source = items[0]

  if (!source) return []

  const normalized = []

  FORECAST_DAY_RANGE.forEach((dayOffset) => {
    const periods = [
      {
        period: 'am',
        weather: source[`wf${dayOffset}Am`],
        waveMin: toNumber(source[`wh${dayOffset}AAm`]) ?? toNumber(source[`wh${dayOffset}A`]),
        waveMax: toNumber(source[`wh${dayOffset}BAm`]) ?? toNumber(source[`wh${dayOffset}B`]),
      },
      {
        period: 'pm',
        weather: source[`wf${dayOffset}Pm`],
        waveMin: toNumber(source[`wh${dayOffset}APm`]) ?? toNumber(source[`wh${dayOffset}A`]),
        waveMax: toNumber(source[`wh${dayOffset}BPm`]) ?? toNumber(source[`wh${dayOffset}B`]),
      },
    ]

    periods.forEach((item) => {
      if (!item.weather && item.waveMin == null && item.waveMax == null) return

      normalized.push({
        dayOffset,
        period: item.period,
        weather: item.weather || '제공 전',
        waveMin: item.waveMin,
        waveMax: item.waveMax,
      })
    })

    if (dayOffset >= 8) {
      const weather = source[`wf${dayOffset}`]
      const waveMin = toNumber(source[`wh${dayOffset}A`])
      const waveMax = toNumber(source[`wh${dayOffset}B`])

      if (!weather && waveMin == null && waveMax == null) return

      normalized.push({
        dayOffset,
        period: 'all',
        weather: weather || '제공 전',
        waveMin,
        waveMax,
      })
    }
  })

  return normalized
}

function createSeaDetailPeriod(value) {
  if (value === '오전') return 'am'
  if (value === '오후') return 'pm'
  return 'all'
}

function pickFirstByDateAndPeriod(items) {
  const seen = new Set()

  return items.filter((item) => {
    const key = `${item.predcYmd}|${item.predcNoonSeCd || '일'}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeSeaFishingDetails(items) {
  return pickFirstByDateAndPeriod(items)
    .map((item) => ({
      date: normalizeDateString(item.predcYmd),
      period: createSeaDetailPeriod(item.predcNoonSeCd),
      periodLabel: item.predcNoonSeCd || '일',
      tideLabel: item.tdlvHrCn || '',
      totalIndex: item.totalIndex || '',
      waveMin: toNumber(item.minWvhgt),
      waveMax: toNumber(item.maxWvhgt),
      waterTempMin: toNumber(item.minWtem),
      waterTempMax: toNumber(item.maxWtem),
      currentMin: toNumber(item.minCrsp),
      currentMax: toNumber(item.maxCrsp),
      windMin: toNumber(item.minWspd),
      windMax: toNumber(item.maxWspd),
    }))
    .filter((item) => item.date)
    .sort((left, right) => {
      const byDate = left.date.localeCompare(right.date)
      if (byDate !== 0) return byDate

      const order = { am: 0, pm: 1, all: 2 }
      return order[left.period] - order[right.period]
    })
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
      endpoint: 'getMidSeaFcst',
      params: {
        regId: seaArea.forecastCode,
      },
      normalize: normalizeSeaForecast,
      extraPayload: { seaArea: seaArea.id },
      fishingPlaceName: seaArea.fishingPlaceName,
    }
  }

  const regionKey = String(query.region || DEFAULT_FORECAST_REGION).trim().toLowerCase()
  const region = LAND_REGION_MAP[regionKey]

  if (!region) {
    throw createApiError(400, 'Invalid forecast region.')
  }

  return {
    type,
    endpoint: type === 'weather' ? 'getMidLandFcst' : 'getMidTa',
    params: {
      regId: type === 'weather' ? region.landForecastCode : region.temperatureCode,
    },
    normalize: type === 'weather' ? normalizeWeatherForecast : normalizeTemperatureForecast,
    extraPayload: {},
  }
}

async function fetchForecastWithFallback(config) {
  const primaryTmFc = getLatestTmFc()
  const fallbackTmFc = getPreviousTmFc(primaryTmFc)
  const candidates = [primaryTmFc, fallbackTmFc]
  let noDataError = null
  let lastError = null

  for (const tmFc of candidates) {
    try {
      const result = await requestKma(config.endpoint, config.params, tmFc)
      return {
        ok: true,
        type: config.type,
        tmFc,
        items: config.normalize(result.items),
        ...config.extraPayload,
      }
    } catch (error) {
      if (error?.details?.isInvalidKey) {
        throw error
      }

      if (error?.details?.isNoData) {
        noDataError = error
        lastError = error
        continue
      }

      lastError = error
      continue
    }
  }

  if (noDataError) {
    return {
      ok: true,
      type: config.type,
      tmFc: primaryTmFc,
      items: [],
      message: '선택한 기간에 제공되는 예보 정보가 없어요.',
      noData: true,
      ...config.extraPayload,
    }
  }

  throw lastError || createApiError(502, 'Failed to fetch forecast data.')
}

async function fetchSeaPayload(config) {
  const [kmaPayload, fishingResult] = await Promise.allSettled([
    fetchForecastWithFallback(config),
    requestFishingForecast(config.fishingPlaceName, getKstDateCompact()),
  ])

  if (kmaPayload.status === 'rejected' && fishingResult.status === 'rejected') {
    throw kmaPayload.reason || fishingResult.reason
  }

  const basePayload =
    kmaPayload.status === 'fulfilled'
      ? kmaPayload.value
      : {
          ok: true,
          type: config.type,
          tmFc: getLatestTmFc(),
          items: [],
          seaArea: config.extraPayload.seaArea,
          message: '선택한 기간에 제공되는 예보 정보가 없어요.',
          noData: true,
        }

  let detailItems = []

  if (fishingResult.status === 'fulfilled') {
    detailItems = normalizeSeaFishingDetails(fishingResult.value.items)
  } else if (!fishingResult.reason?.details?.isNoData) {
    console.error('[WHENSDAY] fishing detail fetch failed', fishingResult.reason)
  }

  return {
    ...basePayload,
    detailItems,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({
      ok: false,
      message: 'Method not allowed.',
    })
  }

  try {
    const config = resolveRequestConfig(req.query)
    const payload =
      config.type === 'sea'
        ? await fetchSeaPayload(config)
        : await fetchForecastWithFallback(config)
    return res.status(200).json(payload)
  } catch (error) {
    console.error('[WHENSDAY] forecast proxy failed', error)

    return res.status(error?.status || 500).json({
      ok: false,
      message: '참고 정보를 불러오지 못했어요.',
    })
  }
}
