const FISHING_BASE_URL = 'https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2'
const FISHING_NO_DATA_CODE = '03'
const FISHING_INVALID_KEY_CODE = '30'

function createApiError(status, message, details = {}) {
  const error = new Error(message)
  error.status = status
  error.details = details
  return error
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function toNumber(value) {
  if (value === '' || value == null || value === '-') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeText(value) {
  if (value == null) return ''

  const trimmed = String(value).trim()
  if (!trimmed || trimmed === '-') return ''
  return trimmed
}

function normalizeDateString(value) {
  const raw = normalizeText(value)

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  }

  return ''
}

function normalizeFishingItems(items) {
  return items
    .map((item) => ({
      placeName: normalizeText(item.seafsPstnNm),
      date: normalizeDateString(item.predcYmd),
      period: normalizePeriod(item.predcNoonSeCd),
      periodLabel: normalizeText(item.predcNoonSeCd) || '종일',
      targetFish: normalizeText(item.seafsTgfshNm),
      apiTideText: normalizeText(item.tdlvHrCn),
      waveMin: toNumber(item.minWvhgt),
      waveMax: toNumber(item.maxWvhgt),
      waterTempMin: toNumber(item.minWtem),
      waterTempMax: toNumber(item.maxWtem),
      airTempMin: toNumber(item.minArtmp),
      airTempMax: toNumber(item.maxArtmp),
      currentSpeedMin: toNumber(item.minCrsp),
      currentSpeedMax: toNumber(item.maxCrsp),
      windSpeedMin: toNumber(item.minWspd),
      windSpeedMax: toNumber(item.maxWspd),
      fishingIndex: normalizeText(item.totalIndex),
      lat: toNumber(item.lat),
      lon: toNumber(item.lot),
    }))
    .filter((item) => item.date)
    .sort((left, right) => {
      const byDate = left.date.localeCompare(right.date)
      if (byDate !== 0) return byDate

      const order = { am: 0, pm: 1, all: 2 }
      return order[left.period] - order[right.period]
    })
}

function normalizePeriod(value) {
  const label = normalizeText(value)
  if (label === '오전') return 'am'
  if (label === '오후') return 'pm'
  return 'all'
}

function extractItems(payload) {
  const rawItems = payload?.body?.items?.item
  return Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []
}

function logFishingError(placeName, gubun, header) {
  const resultCode = String(header?.resultCode || '')
  const resultMsg = header?.resultMsg || 'UNKNOWN'

  console.error('[WHENSDAY] fishing API error', {
    placeName,
    gubun,
    resultCode,
    resultMsg,
  })

  if (resultCode === FISHING_INVALID_KEY_CODE) {
    console.error('[WHENSDAY] SERVICE_KEY_IS_NOT_REGISTERED', {
      placeName,
      gubun,
    })
  }
}

async function requestFishingForecast(placeName, gubun) {
  const serviceKey = process.env.FISHING_SERVICE_KEY || process.env.KMA_SERVICE_KEY

  if (!serviceKey) {
    throw createApiError(500, 'Fishing service key is missing.')
  }

  const url = new URL(FISHING_BASE_URL)
  url.search = new URLSearchParams({
    serviceKey,
    type: 'json',
    pageNo: '1',
    numOfRows: '300',
    placeName,
    gubun,
  }).toString()

  const response = await fetch(url.toString())
  const text = await response.text()
  const payload = parseJsonSafely(text)
  const header = payload?.header
  const resultCode = String(header?.resultCode || '')
  const resultMsg = header?.resultMsg || ''

  if (header && resultCode !== '00') {
    logFishingError(placeName, gubun, header)
  }

  if (!response.ok) {
    throw createApiError(502, 'Fishing API request failed.', {
      status: response.status,
      statusText: response.statusText,
      resultCode,
      resultMsg,
      rawText: text.slice(0, 300),
    })
  }

  if (!payload || !header) {
    throw createApiError(502, 'Fishing API returned an unexpected response.', {
      rawText: text.slice(0, 300),
    })
  }

  if (resultCode === FISHING_NO_DATA_CODE) {
    return {
      ok: true,
      items: [],
      message: '선택한 기간에 제공되는 바다 상세 정보가 없어요.',
    }
  }

  if (resultCode !== '00') {
    throw createApiError(502, 'Fishing API returned an error response.', {
      resultCode,
      resultMsg,
    })
  }

  return {
    ok: true,
    items: extractItems(payload),
    message: '',
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

  const placeName = normalizeText(req.query.placeName)
  const gubun = normalizeText(req.query.gubun)

  if (!placeName || !gubun) {
    return res.status(400).json({
      ok: false,
      message: 'Missing fishing params.',
    })
  }

  try {
    const payload = await requestFishingForecast(placeName, gubun)

    return res.status(200).json({
      ok: true,
      placeName,
      gubun,
      message: payload.message,
      items: normalizeFishingItems(payload.items),
    })
  } catch (error) {
    console.error('[WHENSDAY] fishing proxy failed', error)

    return res.status(error?.status || 500).json({
      ok: false,
      message: '참고 정보를 불러오지 못했어요.',
    })
  }
}
