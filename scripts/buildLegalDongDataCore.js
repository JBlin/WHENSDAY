import fs from 'node:fs'
import path from 'node:path'

const RAW_DIRECTORY_PATH = path.resolve('scripts/raw')
const OUTPUT_FILE_PATH = path.resolve('src/data/legalDongs.json')

const SIDO_ALIASES = {
  서울특별시: '서울',
  부산광역시: '부산',
  대구광역시: '대구',
  인천광역시: '인천',
  광주광역시: '광주',
  대전광역시: '대전',
  울산광역시: '울산',
  세종특별자치시: '세종',
  제주특별자치도: '제주',
  경기도: '경기',
  강원특별자치도: '강원',
  충청북도: '충북',
  충청남도: '충남',
  전북특별자치도: '전북',
  전라남도: '전남',
  경상북도: '경북',
  경상남도: '경남',
}

function readRawText(filePath) {
  const buffer = fs.readFileSync(filePath)
  const utf8Text = buffer.toString('utf8')

  if (utf8Text.includes('법정동코드')) {
    return utf8Text
  }

  return new TextDecoder('euc-kr').decode(buffer)
}

function normalizeAlias(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function stripAdministrativeSuffix(value) {
  const normalized = normalizeAlias(value)
  if (!normalized) return ''

  return normalized
    .replace(/(특별자치도|특별자치시|특별시|광역시)$/u, '')
    .replace(/(시|군|구)$/u, '')
    .replace(/(읍|면|동|리)$/u, '')
    .replace(/([0-9]+)가$/u, '')
    .trim()
}

function parseLegalDongName(fullName) {
  const parts = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!parts.length) return null

  const sido = parts[0]

  if (parts.length === 1) {
    return {
      sido,
      sigungu: '',
      dong: parts[0],
    }
  }

  if (sido === '세종특별자치시') {
    return {
      sido,
      sigungu: '',
      dong: parts.slice(1).join(' '),
    }
  }

  return {
    sido,
    sigungu: parts[1] || '',
    dong: parts.length > 2 ? parts.slice(2).join(' ') : parts[1] || '',
  }
}

function buildSearchText(entry) {
  const tokens = [
    entry.fullName,
    entry.sido,
    entry.sigungu,
    entry.dong,
    SIDO_ALIASES[entry.sido] || '',
    stripAdministrativeSuffix(entry.sigungu),
    stripAdministrativeSuffix(entry.dong),
  ]

  return [...new Set(tokens.map(normalizeAlias).filter(Boolean))].join(' ')
}

function main() {
  const rawFileName = fs
    .readdirSync(RAW_DIRECTORY_PATH)
    .find((fileName) => fileName.toLowerCase().endsWith('.txt'))

  if (!rawFileName) {
    throw new Error(`Raw legal dong TXT file not found in ${RAW_DIRECTORY_PATH}`)
  }

  const rawFilePath = path.join(RAW_DIRECTORY_PATH, rawFileName)
  const text = readRawText(rawFilePath)
  const lines = text.split(/\r?\n/)
  const legalDongs = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.includes('법정동코드')) continue

    const match = trimmedLine.match(/^(\d{10})\s+(.+?)\s+(존재|폐지)$/u)
    if (!match) {
      console.warn('[build:legal-dongs] skipped malformed row:', trimmedLine)
      continue
    }

    const [, code, fullName, status] = match
    if (status !== '존재') continue

    const parsedName = parseLegalDongName(fullName)
    if (!parsedName?.sido || !parsedName?.dong) {
      console.warn('[build:legal-dongs] skipped unparseable name:', fullName)
      continue
    }

    const entry = {
      code,
      fullName: normalizeAlias(fullName),
      sido: parsedName.sido,
      sigungu: parsedName.sigungu,
      dong: parsedName.dong,
      searchText: '',
    }

    entry.searchText = buildSearchText(entry)
    legalDongs.push(entry)
  }

  fs.mkdirSync(path.dirname(OUTPUT_FILE_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_FILE_PATH, `${JSON.stringify(legalDongs, null, 2)}\n`, 'utf8')

  console.log(`[build:legal-dongs] read ${rawFilePath}`)
  console.log(`[build:legal-dongs] wrote ${legalDongs.length} rows to ${OUTPUT_FILE_PATH}`)
}

main()
