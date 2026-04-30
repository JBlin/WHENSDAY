import {
  REGIONS,
  buildRegionRecord,
  DEFAULT_REGION,
  findRegionById,
} from '../data/regions.js'
import { findFishingRegionMapping } from '../data/fishingRegionMap.ts'

export type LegalDong = {
  code: string
  fullName: string
  sido: string
  sigungu: string
  dong: string
  searchText: string
}

export type RegionSelection = {
  id: string
  name: string
  displayName: string
  parentName: string
  province: string
  aliases: string[]
  regionName: string
  regionDisplayName: string
  regionParentName: string
  legalDongCode: string
  weatherRegionCode: string
  temperatureRegionCode: string
  fishingPlaceName: string | null
  fishingGubun: '갯바위' | '선상' | null
  supportsSeaInfo: boolean
  mappingNote: string
  codeNote: string
  seaAreaCode: string | null
  administrativeLevel: 'city' | 'district' | 'dong' | 'point'
}

const FRIENDLY_PARENT_NAME_MAP: Record<string, string> = {
  busan: '부산',
  'busan-dongbu': '부산',
  'busan-nambu': '부산',
  'busan-seobu': '부산',
}

const SIDO_REGION_FALLBACK_MAP = new Map<string, string>([
  ['서울특별시', 'seoul'],
  ['부산광역시', 'busan'],
  ['대구광역시', 'daegu'],
  ['인천광역시', 'incheon'],
  ['광주광역시', 'gwangju'],
  ['대전광역시', 'daejeon'],
  ['울산광역시', 'ulsan'],
  ['세종특별자치시', 'sejong'],
  ['경기도', 'suwon'],
  ['강원특별자치도', 'chuncheon'],
  ['충청북도', 'cheongju'],
  ['충청남도', 'cheonan'],
  ['전북특별자치도', 'jeonju'],
  ['전라남도', 'gwangju'],
  ['경상북도', 'daegu'],
  ['경상남도', 'changwon'],
  ['제주특별자치도', 'jeju'],
])

const SIGUNGU_REGION_ID_MAP = new Map<string, string>([
  ['경기도:수원시', 'suwon'],
  ['경기도:성남시', 'seongnam'],
  ['경기도:고양시', 'goyang'],
  ['경기도:용인시', 'yongin'],
  ['경기도:부천시', 'bucheon'],
  ['경기도:안양시', 'anyang'],
  ['경기도:안산시', 'ansan'],
  ['경기도:화성시', 'hwaseong'],
  ['경기도:평택시', 'pyeongtaek'],
  ['경기도:의정부시', 'uijeongbu'],
  ['경기도:남양주시', 'namyangju'],
  ['경기도:파주시', 'paju'],
  ['경기도:김포시', 'gimpo'],
  ['경기도:광명시', 'gwangmyeong'],
  ['경기도:시흥시', 'siheung'],
  ['경기도:하남시', 'hanam'],
  ['경기도:이천시', 'icheon'],
  ['경기도:양평군', 'yangpyeong'],
  ['강원특별자치도:춘천시', 'chuncheon'],
  ['강원특별자치도:원주시', 'wonju'],
  ['강원특별자치도:강릉시', 'gangneung'],
  ['강원특별자치도:속초시', 'sokcho'],
  ['강원특별자치도:동해시', 'donghae'],
  ['강원특별자치도:삼척시', 'samcheok'],
  ['강원특별자치도:양양군', 'yangyang'],
  ['강원특별자치도:고성군', 'goseong-gangwon'],
  ['강원특별자치도:홍천군', 'hongcheon'],
  ['강원특별자치도:평창군', 'pyeongchang'],
  ['강원특별자치도:정선군', 'jeongseon'],
  ['강원특별자치도:인제군', 'inje'],
  ['충청북도:청주시', 'cheongju'],
  ['충청북도:충주시', 'chungju'],
  ['충청북도:제천시', 'jecheon'],
  ['충청남도:천안시', 'cheonan'],
  ['충청남도:아산시', 'asan'],
  ['충청남도:서산시', 'seosan'],
  ['충청남도:당진시', 'dangjin'],
  ['충청남도:보령시', 'boryeong'],
  ['충청남도:공주시', 'gongju'],
  ['충청남도:논산시', 'nonsan'],
  ['충청남도:태안군', 'taean'],
  ['전북특별자치도:전주시', 'jeonju'],
  ['전북특별자치도:군산시', 'gunsan'],
  ['전북특별자치도:익산시', 'iksan'],
  ['전북특별자치도:정읍시', 'jeongeup'],
  ['전북특별자치도:남원시', 'namwon'],
  ['전라남도:목포시', 'mokpo'],
  ['전라남도:여수시', 'yeosu'],
  ['전라남도:순천시', 'suncheon'],
  ['전라남도:광양시', 'gwangyang'],
  ['전라남도:나주시', 'naju'],
  ['전라남도:해남군', 'haenam'],
  ['전라남도:완도군', 'wando'],
  ['전라남도:진도군', 'jindo'],
  ['경상북도:포항시', 'pohang'],
  ['경상북도:경주시', 'gyeongju'],
  ['경상북도:안동시', 'andong'],
  ['경상북도:구미시', 'gumi'],
  ['경상북도:영주시', 'yeongju'],
  ['부산광역시:해운대구', 'busan-dongbu'],
  ['부산광역시:기장군', 'busan-dongbu'],
  ['부산광역시:수영구', 'busan-nambu'],
  ['부산광역시:남구', 'busan-nambu'],
  ['부산광역시:중구', 'busan-seobu'],
  ['부산광역시:서구', 'busan-seobu'],
  ['부산광역시:영도구', 'busan-seobu'],
  ['부산광역시:사하구', 'busan-seobu'],
  ['부산광역시:강서구', 'busan-seobu'],
  ['경상남도:창원시', 'changwon'],
  ['경상남도:김해시', 'gimhae'],
  ['경상남도:양산시', 'yangsan'],
  ['경상남도:진주시', 'jinju'],
  ['경상남도:통영시', 'tongyeong'],
  ['경상남도:거제시', 'geoje'],
  ['경상남도:사천시', 'sacheon'],
  ['경상남도:밀양시', 'miryang'],
  ['제주특별자치도:제주시', 'jeju'],
  ['제주특별자치도:서귀포시', 'seogwipo'],
])

const SPECIAL_REGION_RULES = [
  { matchKeywords: ['성산읍', '성산포'], regionId: 'seongsanpo' },
  { matchKeywords: ['김녕리', '김녕'], regionId: 'gimnyeong' },
  { matchKeywords: ['추자면', '추자도'], regionId: 'chujado' },
  { matchKeywords: ['영흥면', '영흥도'], regionId: 'yeongheungdo' },
  { matchKeywords: ['거제면', '장승포동', '거제도'], regionId: 'geojedo' },
  { matchKeywords: ['구룡포읍'], regionId: 'pohang' },
  { matchKeywords: ['후포면', '후포'], regionId: 'hupo' },
  { matchKeywords: ['울릉읍', '울릉군'], regionId: 'ulleungdo' },
  { matchKeywords: ['서귀동', '중문동', '법환동'], regionId: 'seogwipo' },
]

function getRegionRecordById(regionId: string) {
  return buildRegionRecord(findRegionById(regionId) || DEFAULT_REGION)
}

function findRegionByFishingPlaceName(fishingPlaceName: string | null) {
  if (!fishingPlaceName) return null

  return (
    REGIONS.find((region) => region.fishingPlaceName === fishingPlaceName) || null
  )
}

function resolveRepresentativeRegionId(legalDong: LegalDong) {
  const fullName = String(legalDong.fullName || '').trim()

  for (const rule of SPECIAL_REGION_RULES) {
    if (rule.matchKeywords.some((keyword) => fullName.includes(keyword))) {
      return rule.regionId
    }
  }

  const sigunguKey = legalDong.sigungu ? `${legalDong.sido}:${legalDong.sigungu}` : ''
  if (sigunguKey && SIGUNGU_REGION_ID_MAP.has(sigunguKey)) {
    return SIGUNGU_REGION_ID_MAP.get(sigunguKey) || DEFAULT_REGION.id
  }

  return SIDO_REGION_FALLBACK_MAP.get(legalDong.sido) || DEFAULT_REGION.id
}

function getFriendlyParentName(regionId: string, regionName: string) {
  return FRIENDLY_PARENT_NAME_MAP[regionId] || regionName
}

function buildMappingNote(fullName: string, parentName: string, codeNote: string) {
  if (codeNote) return codeNote
  if (fullName && parentName && fullName !== parentName) {
    return `${parentName} 기준 대표 지역 코드를 사용합니다.`
  }
  return ''
}

export function mapLegalDongToRegionSelection(legalDong: LegalDong): RegionSelection {
  const representativeRegionId = resolveRepresentativeRegionId(legalDong)
  const representativeRegion = getRegionRecordById(representativeRegionId)
  const fishingMapping = findFishingRegionMapping(legalDong.fullName)
  const seaRegion = findRegionByFishingPlaceName(
    fishingMapping?.fishingPlaceName || representativeRegion.fishingPlaceName
  )
  const regionDisplayName = legalDong.fullName
  const regionParentName = getFriendlyParentName(
    representativeRegionId,
    representativeRegion.displayName || representativeRegion.name
  )
  const fishingPlaceName =
    fishingMapping?.fishingPlaceName || representativeRegion.fishingPlaceName || null
  const fishingGubun =
    fishingMapping?.fishingGubun || representativeRegion.fishingGubun || null
  const supportsSeaInfo = Boolean(fishingPlaceName && fishingGubun)
  const codeNote = buildMappingNote(
    regionDisplayName,
    regionParentName,
    representativeRegion.codeNote || ''
  )

  return {
    id: `legal-dong-${legalDong.code}`,
    name: regionDisplayName,
    displayName: regionDisplayName,
    parentName: regionParentName,
    province: legalDong.sido,
    aliases: [legalDong.sigungu, legalDong.dong].filter(Boolean),
    regionName: regionDisplayName,
    regionDisplayName,
    regionParentName,
    legalDongCode: legalDong.code,
    weatherRegionCode: representativeRegion.weatherRegionCode,
    temperatureRegionCode: representativeRegion.temperatureRegionCode,
    fishingPlaceName,
    fishingGubun,
    supportsSeaInfo,
    mappingNote: codeNote,
    codeNote,
    seaAreaCode: seaRegion?.seaAreaCode || representativeRegion.seaAreaCode || null,
    administrativeLevel: 'dong',
  }
}
