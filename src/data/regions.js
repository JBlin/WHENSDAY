const CATEGORY_ORDER = ['전체', '수도권', '강원', '충청', '전라', '경상', '제주', '바다']

function createRegion(region) {
  const isSeaType = Boolean(region.seaAreaCode)
  return {
    type: isSeaType ? 'sea' : 'land',
    seaAreaCode: null,
    fishingPlaceName: null,
    fishingGubun: null,
    areaLabel: null,
    province: '',
    keywords: [],
    ...region,
  }
}

export const REGION_CATEGORIES = CATEGORY_ORDER

export const REGIONS = [
  createRegion({
    id: 'seoul',
    name: '서울',
    category: '수도권',
    province: '서울특별시',
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    keywords: ['강남', '종로', '홍대'],
  }),
  createRegion({
    id: 'incheon',
    name: '인천',
    category: '수도권',
    province: '인천광역시',
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
    keywords: ['송도', '월미도'],
  }),
  createRegion({
    id: 'suwon',
    name: '수원',
    category: '수도권',
    province: '경기도',
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    keywords: ['광교', '화성'],
  }),
  createRegion({
    id: 'paju',
    name: '파주',
    category: '수도권',
    province: '경기도',
    weatherRegionCode: '11B00000',
    // TODO: 파주 전용 중기기온 코드는 재검증 필요. 우선 서울권 대표 코드를 사용합니다.
    temperatureRegionCode: '11B10101',
    keywords: ['헤이리', '임진각'],
  }),
  createRegion({
    id: 'yeongheungdo',
    name: '영흥도',
    category: '바다',
    province: '인천광역시',
    areaLabel: '서해',
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
    seaAreaCode: 'west',
    fishingPlaceName: '영흥도',
    fishingGubun: '갯바위',
    keywords: ['선재도', '십리포'],
  }),
  createRegion({
    id: 'chuncheon',
    name: '춘천',
    category: '강원',
    province: '강원특별자치도',
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10301',
    keywords: ['의암호', '남이섬'],
  }),
  createRegion({
    id: 'gangneung',
    name: '강릉',
    category: '강원',
    province: '강원특별자치도',
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20501',
    keywords: ['경포대', '안목'],
  }),
  createRegion({
    id: 'sokcho-daejinhang',
    name: '속초 / 대진항',
    category: '강원',
    province: '강원특별자치도',
    areaLabel: '동해',
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    seaAreaCode: 'east',
    fishingPlaceName: '대진항',
    fishingGubun: '갯바위',
    keywords: ['속초', '대진항'],
  }),
  createRegion({
    id: 'uljin-hujeong',
    name: '울진 후정',
    category: '바다',
    province: '경상북도',
    areaLabel: '동해',
    // TODO: 울진 후정의 중기육상/기온 상세 코드는 재검증 필요. 인근 동해안 대표 코드를 사용합니다.
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    seaAreaCode: 'east',
    fishingPlaceName: '울진 후정',
    fishingGubun: '갯바위',
    keywords: ['후정해수욕장', '울진'],
  }),
  createRegion({
    id: 'daejeon',
    name: '대전',
    category: '충청',
    province: '대전광역시',
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
    keywords: ['유성', '대청호'],
  }),
  createRegion({
    id: 'sejong',
    name: '세종',
    category: '충청',
    province: '세종특별자치시',
    weatherRegionCode: '11C20000',
    // TODO: 세종 전용 중기기온 코드는 재검증 필요. 인근 대전권 대표 코드를 사용합니다.
    temperatureRegionCode: '11C20401',
    keywords: ['어진동', '호수공원'],
  }),
  createRegion({
    id: 'seosan',
    name: '서산',
    category: '충청',
    province: '충청남도',
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
    keywords: ['간월도', '태안'],
  }),
  createRegion({
    id: 'anheunghang-north',
    name: '안흥항 북측(30km)',
    category: '충청',
    province: '충청남도',
    areaLabel: '서해',
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
    seaAreaCode: 'west',
    fishingPlaceName: '안흥항 북측(30km)',
    fishingGubun: '선상',
    keywords: ['안흥항', '태안'],
  }),
  createRegion({
    id: 'gwangju',
    name: '광주',
    category: '전라',
    province: '광주광역시',
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20501',
    keywords: ['상무지구', '무등산'],
  }),
  createRegion({
    id: 'mokpo',
    name: '목포',
    category: '전라',
    province: '전라남도',
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    keywords: ['유달산', '평화광장'],
  }),
  createRegion({
    id: 'yeosu',
    name: '여수',
    category: '전라',
    province: '전라남도',
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    keywords: ['돌산', '오동도'],
  }),
  createRegion({
    id: 'gunsan',
    name: '군산',
    category: '전라',
    province: '전북특별자치도',
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10501',
    keywords: ['새만금', '고군산'],
  }),
  createRegion({
    id: 'geomundo',
    name: '거문도',
    category: '전라',
    province: '전라남도',
    areaLabel: '남해',
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    seaAreaCode: 'south',
    fishingPlaceName: '거문도',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'gageodo',
    name: '가거도',
    category: '바다',
    province: '전라남도',
    areaLabel: '서해',
    weatherRegionCode: '11F20000',
    // TODO: 가거도 상세 기온 코드는 재검증 필요. 목포권 대표 코드를 사용합니다.
    temperatureRegionCode: '21F20801',
    seaAreaCode: 'west',
    fishingPlaceName: '가거도',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'daegu',
    name: '대구',
    category: '경상',
    province: '대구광역시',
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10701',
    keywords: ['동성로', '수성못'],
  }),
  createRegion({
    id: 'busan',
    name: '부산',
    category: '경상',
    province: '부산광역시',
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
    keywords: ['해운대', '광안리'],
  }),
  createRegion({
    id: 'ulsan',
    name: '울산',
    category: '경상',
    province: '울산광역시',
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20101',
    keywords: ['장생포', '간절곶'],
  }),
  createRegion({
    id: 'changwon',
    name: '창원',
    category: '경상',
    province: '경상남도',
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20304',
    keywords: ['마산', '진해'],
  }),
  createRegion({
    id: 'pohang',
    name: '포항',
    category: '바다',
    province: '경상북도',
    areaLabel: '동해',
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    seaAreaCode: 'east',
    fishingPlaceName: '포항',
    fishingGubun: '갯바위',
    keywords: ['영일대', '구룡포'],
  }),
  createRegion({
    id: 'geoje',
    name: '거제도',
    category: '바다',
    province: '경상남도',
    areaLabel: '남해',
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20301',
    seaAreaCode: 'south',
    fishingPlaceName: '거제도',
    fishingGubun: '갯바위',
    keywords: ['장승포', '구조라'],
  }),
  createRegion({
    id: 'yokjido',
    name: '욕지도',
    category: '경상',
    province: '경상남도',
    areaLabel: '남해',
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20301',
    seaAreaCode: 'south',
    fishingPlaceName: '욕지도',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'jeju',
    name: '제주',
    category: '제주',
    province: '제주특별자치도',
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
    keywords: ['애월', '한림'],
  }),
  createRegion({
    id: 'seogwipo',
    name: '서귀포',
    category: '제주',
    province: '제주특별자치도',
    areaLabel: '제주',
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00401',
    seaAreaCode: 'south',
    fishingPlaceName: '서귀포',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'seongsanpo',
    name: '성산포',
    category: '제주',
    province: '제주특별자치도',
    areaLabel: '제주',
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00301',
    seaAreaCode: 'south',
    fishingPlaceName: '성산포',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'gimnyeong',
    name: '김녕',
    category: '제주',
    province: '제주특별자치도',
    areaLabel: '제주',
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
    seaAreaCode: 'south',
    fishingPlaceName: '김녕',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'biyangdo',
    name: '비양도',
    category: '제주',
    province: '제주특별자치도',
    areaLabel: '제주',
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
    seaAreaCode: 'south',
    fishingPlaceName: '비양도',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'chujado',
    name: '추자도',
    category: '제주',
    province: '제주특별자치도',
    areaLabel: '제주',
    weatherRegionCode: '11G00000',
    // TODO: 추자도 상세 기온 코드는 재검증 필요. 제주권 대표 코드를 사용합니다.
    temperatureRegionCode: '11G00401',
    seaAreaCode: 'south',
    fishingPlaceName: '추자도',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'ulleungdo',
    name: '울릉도',
    category: '바다',
    province: '경상북도',
    areaLabel: '동해',
    weatherRegionCode: '11H10000',
    // TODO: 울릉도 상세 기온 코드는 재검증 필요. 포항권 대표 코드를 사용합니다.
    temperatureRegionCode: '11H10201',
    seaAreaCode: 'east',
    fishingPlaceName: '울릉도',
    fishingGubun: '갯바위',
  }),
  createRegion({
    id: 'busan-east',
    name: '부산동부',
    category: '바다',
    province: '부산광역시',
    areaLabel: '남해',
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
    seaAreaCode: 'south',
    fishingPlaceName: '부산동부',
    fishingGubun: '갯바위',
  }),
]

export const DEFAULT_REGION_ID = 'seoul'
export const DEFAULT_REGION = REGIONS.find((region) => region.id === DEFAULT_REGION_ID) || REGIONS[0]

export const RECOMMENDED_REGION_IDS = [
  'seoul',
  'yeongheungdo',
  'gangneung',
  'seosan',
  'yeosu',
  'busan',
  'pohang',
  'seogwipo',
]

export function getRecommendedRegions() {
  return RECOMMENDED_REGION_IDS.map((id) => findRegionById(id)).filter(Boolean)
}

export function findRegionById(regionId) {
  if (!regionId) return null
  return REGIONS.find((region) => region.id === regionId) || null
}

export function normalizeRegion(regionOrId) {
  if (!regionOrId) return DEFAULT_REGION

  if (typeof regionOrId === 'string') {
    return findRegionById(regionOrId) || DEFAULT_REGION
  }

  return findRegionById(regionOrId.id) || DEFAULT_REGION
}

export function buildRegionMeetingFields(regionOrId) {
  const region = normalizeRegion(regionOrId)

  return {
    region_name: region.name,
    weather_region_code: region.weatherRegionCode,
    temperature_region_code: region.temperatureRegionCode,
    sea_area_code: region.seaAreaCode,
    fishing_place_name: region.fishingPlaceName,
    fishing_gubun: region.fishingGubun,
  }
}

export function buildRegionRecord(regionOrId) {
  const region = normalizeRegion(regionOrId)

  return {
    id: region.id,
    name: region.name,
    category: region.category,
    weatherRegionCode: region.weatherRegionCode,
    temperatureRegionCode: region.temperatureRegionCode,
    seaAreaCode: region.seaAreaCode,
    fishingPlaceName: region.fishingPlaceName,
    fishingGubun: region.fishingGubun,
  }
}

export function getRegionFromMeetingRecord(record) {
  if (!record) return buildRegionRecord(DEFAULT_REGION)

  const matchedRegion =
    REGIONS.find((region) => {
      if (record.fishing_place_name && region.fishingPlaceName === record.fishing_place_name) {
        return true
      }

      return (
        region.name === record.region_name &&
        region.weatherRegionCode === record.weather_region_code &&
        region.temperatureRegionCode === record.temperature_region_code
      )
    }) || null

  if (matchedRegion) {
    return buildRegionRecord(matchedRegion)
  }

  return {
    id: DEFAULT_REGION.id,
    name: record.region_name || DEFAULT_REGION.name,
    category: DEFAULT_REGION.category,
    weatherRegionCode: record.weather_region_code || DEFAULT_REGION.weatherRegionCode,
    temperatureRegionCode: record.temperature_region_code || DEFAULT_REGION.temperatureRegionCode,
    seaAreaCode: record.sea_area_code || null,
    fishingPlaceName: record.fishing_place_name || null,
    fishingGubun: record.fishing_gubun || null,
  }
}

export function isSeaRegion(regionOrId) {
  const region = normalizeRegion(regionOrId)
  return Boolean(region.seaAreaCode && region.fishingPlaceName && region.fishingGubun)
}
