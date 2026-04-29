const BASE_URL =
  'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst'

const BASE_TIMES = [2, 5, 8, 11, 14, 17, 20, 23]

const SKY_LABEL = { 1: '맑음', 3: '구름많음', 4: '흐림' }
const PTY_LABEL = { 1: '비', 2: '비/눈', 3: '눈', 4: '소나기' }

function getKstParts() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  return Object.fromEntries(parts.map((p) => [p.type, p.value]))
}

function getBaseDateTime() {
  const p = getKstParts()
  const minuteOfDay = Number(p.hour) * 60 + Number(p.minute)

  let baseHour = null
  for (let i = BASE_TIMES.length - 1; i >= 0; i--) {
    if (minuteOfDay >= BASE_TIMES[i] * 60 + 10) {
      baseHour = BASE_TIMES[i]
      break
    }
  }

  if (baseHour !== null) {
    return {
      baseDate: `${p.year}${p.month}${p.day}`,
      baseTime: String(baseHour).padStart(2, '0') + '00',
    }
  }

  // Before 02:10 KST — use previous day 23:00
  const prev = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  prev.setDate(prev.getDate() - 1)
  return {
    baseDate: `${prev.getFullYear()}${String(prev.getMonth() + 1).padStart(2, '0')}${String(prev.getDate()).padStart(2, '0')}`,
    baseTime: '2300',
  }
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function toNum(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normDate(fcstDate) {
  return `${fcstDate.slice(0, 4)}-${fcstDate.slice(4, 6)}-${fcstDate.slice(6, 8)}`
}

function deriveWeather(sky, pty) {
  if (pty && PTY_LABEL[pty]) return PTY_LABEL[pty]
  return SKY_LABEL[sky] || '구름많음'
}

function processItems(rawItems) {
  const byDate = {}

  for (const item of rawItems) {
    const date = normDate(item.fcstDate)
    const time = item.fcstTime
    const cat = item.category
    const val = item.fcstValue

    if (!byDate[date]) byDate[date] = { tmp: [], pop: [], sky: {}, pty: {} }

    if (cat === 'TMP') {
      const n = toNum(val)
      if (n != null) byDate[date].tmp.push(n)
    } else if (cat === 'POP') {
      const n = toNum(val)
      if (n != null) byDate[date].pop.push(n)
    } else if (cat === 'SKY') {
      byDate[date].sky[time] = toNum(val)
    } else if (cat === 'PTY') {
      byDate[date].pty[time] = toNum(val)
    }
  }

  const p = getKstParts()
  const today = `${p.year}-${p.month}-${p.day}`

  return Object.entries(byDate)
    .filter(([date]) => date >= today)
    .map(([date, data]) => {
      const tempMin = data.tmp.length ? Math.min(...data.tmp) : null
      const tempMax = data.tmp.length ? Math.max(...data.tmp) : null
      const rainPercent = data.pop.length ? Math.max(...data.pop) : 0

      const repTime = ['1200', '1500', '1800', '0900'].find((t) => data.sky[t] != null)
      const sky = repTime != null ? data.sky[repTime] : 1
      const pty = repTime != null ? (data.pty[repTime] ?? 0) : 0

      return {
        date,
        tempMin,
        tempMax,
        weather: deriveWeather(sky, pty),
        rainPercent,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ ok: false, message: 'Method not allowed.' })
  }

  const nx = parseInt(req.query.nx, 10)
  const ny = parseInt(req.query.ny, 10)

  if (!Number.isInteger(nx) || !Number.isInteger(ny)) {
    return res.status(400).json({ ok: false, message: 'nx, ny 파라미터가 필요해요.' })
  }

  const serviceKey = process.env.KMA_SERVICE_KEY
  if (!serviceKey) {
    return res.status(500).json({ ok: false, message: '서비스 키가 없어요.' })
  }

  try {
    const { baseDate, baseTime } = getBaseDateTime()

    const params = new URLSearchParams({
      serviceKey,
      pageNo: '1',
      numOfRows: '1000',
      dataType: 'JSON',
      base_date: baseDate,
      base_time: baseTime,
      nx: String(nx),
      ny: String(ny),
    })

    const response = await fetch(`${BASE_URL}?${params}`)
    const text = await response.text()
    const payload = parseJsonSafely(text)

    const header = payload?.response?.header
    const resultCode = String(header?.resultCode || '')

    if (!response.ok || resultCode !== '00') {
      console.error('[WHENSDAY] shortforecast API error', {
        status: response.status,
        resultCode,
        resultMsg: header?.resultMsg,
      })
      return res.status(502).json({ ok: false, message: '단기예보를 불러오지 못했어요.' })
    }

    const raw = payload?.response?.body?.items?.item
    const items = Array.isArray(raw) ? raw : raw ? [raw] : []

    return res.status(200).json({
      ok: true,
      baseDate,
      baseTime,
      items: processItems(items),
    })
  } catch (error) {
    console.error('[WHENSDAY] shortforecast failed', error)
    return res.status(500).json({ ok: false, message: '단기예보를 불러오지 못했어요.' })
  }
}
