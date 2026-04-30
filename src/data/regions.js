function createRegion(region) {
  const fishingPlaceName = region.fishingPlaceName ?? null
  const fishingGubun = region.fishingGubun ?? null

  return {
    id: region.id,
    name: region.name,
    displayName: region.displayName || region.name,
    parentName: region.parentName || region.name,
    province: region.province,
    aliases: Array.isArray(region.aliases) ? region.aliases : [],
    weatherRegionCode: region.weatherRegionCode,
    temperatureRegionCode: region.temperatureRegionCode,
    fishingPlaceName,
    fishingGubun,
    supportsSeaInfo:
      typeof region.supportsSeaInfo === 'boolean'
        ? region.supportsSeaInfo
        : Boolean(fishingPlaceName && fishingGubun),
    codeNote: region.codeNote || '',
    seaAreaCode: region.seaAreaCode || null,
    administrativeLevel: region.administrativeLevel || 'city',
  }
}

function normalizeSearchText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}

function hasRegionText(value) {
  return typeof value === 'string' ? value.trim().length > 0 : false
}

function getRegionSearchScore(region, keyword) {
  const name = normalizeSearchText(region.name)
  const displayName = normalizeSearchText(region.displayName)
  const parentName = normalizeSearchText(region.parentName)
  const province = normalizeSearchText(region.province)
  const aliases = (region.aliases || []).map(normalizeSearchText).filter(Boolean)

  if (!keyword) return Number.POSITIVE_INFINITY
  if (name === keyword) return 0
  if (displayName === keyword) return 1
  if (aliases.includes(keyword)) return 2
  if (parentName === keyword) return 3
  if (province === keyword) return 4
  if (name.startsWith(keyword)) return 5
  if (displayName.startsWith(keyword)) return 6
  if (aliases.some((alias) => alias.startsWith(keyword))) return 7
  if (parentName.startsWith(keyword)) return 8
  if (province.startsWith(keyword)) return 9
  if (name.includes(keyword)) return 10
  if (displayName.includes(keyword)) return 11
  if (aliases.some((alias) => alias.includes(keyword))) return 12
  if (parentName.includes(keyword)) return 13
  if (province.includes(keyword)) return 14
  return Number.POSITIVE_INFINITY
}

const BASE_REGIONS = [
  createRegion({
    id: 'seoul',
    name: '서울',
    province: '서울특별시',
    aliases: ['서울시', '강남', '종로', '홍대'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
  }),
  createRegion({
    id: 'incheon',
    name: '인천',
    province: '인천광역시',
    aliases: ['인천시', '송도', '월미도'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
  }),
  createRegion({
    id: 'suwon',
    name: '수원',
    province: '경기도',
    aliases: ['수원시', '광교'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
  }),
  createRegion({
    id: 'seongnam',
    name: '성남',
    province: '경기도',
    aliases: ['성남시', '분당', '판교'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '성남은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'goyang',
    name: '고양',
    province: '경기도',
    aliases: ['고양시', '일산'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    codeNote: '고양은 서울권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'yongin',
    name: '용인',
    province: '경기도',
    aliases: ['용인시', '기흥', '수지'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '용인은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'bucheon',
    name: '부천',
    province: '경기도',
    aliases: ['부천시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
    codeNote: '부천은 인천권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'anyang',
    name: '안양',
    province: '경기도',
    aliases: ['안양시', '평촌'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '안양은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'ansan',
    name: '안산',
    province: '경기도',
    aliases: ['안산시', '대부도'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '안산은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'hwaseong',
    name: '화성',
    province: '경기도',
    aliases: ['화성시', '동탄'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '화성은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'pyeongtaek',
    name: '평택',
    province: '경기도',
    aliases: ['평택시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '평택은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'uijeongbu',
    name: '의정부',
    province: '경기도',
    aliases: ['의정부시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    codeNote: '의정부는 서울권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'namyangju',
    name: '남양주',
    province: '경기도',
    aliases: ['남양주시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    codeNote: '남양주는 서울권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'paju',
    name: '파주',
    province: '경기도',
    aliases: ['파주시', '헤이리', '임진각'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    codeNote: '파주는 서울권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'gimpo',
    name: '김포',
    province: '경기도',
    aliases: ['김포시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
    codeNote: '김포는 인천권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'gwangmyeong',
    name: '광명',
    province: '경기도',
    aliases: ['광명시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    codeNote: '광명은 서울권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'siheung',
    name: '시흥',
    province: '경기도',
    aliases: ['시흥시', '오이도'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
    codeNote: '시흥은 인천권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'hanam',
    name: '하남',
    province: '경기도',
    aliases: ['하남시', '미사'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B10101',
    codeNote: '하남은 서울권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'icheon',
    name: '이천',
    province: '경기도',
    aliases: ['이천시'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '이천은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'yangpyeong',
    name: '양평',
    province: '경기도',
    aliases: ['양평군'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20601',
    codeNote: '양평은 수원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'yeongheungdo',
    name: '영흥도',
    province: '경기도',
    aliases: ['인천 영흥도', '선재도', '십리포'],
    weatherRegionCode: '11B00000',
    temperatureRegionCode: '11B20201',
    fishingPlaceName: '영흥도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    codeNote: '영흥도는 인천권 대표 기온 코드를 사용합니다.',
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'chuncheon',
    name: '춘천',
    province: '강원특별자치도',
    aliases: ['춘천시', '남이섬'],
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10301',
  }),
  createRegion({
    id: 'wonju',
    name: '원주',
    province: '강원특별자치도',
    aliases: ['원주시'],
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10401',
  }),
  createRegion({
    id: 'gangneung',
    name: '강릉',
    province: '강원특별자치도',
    aliases: ['강릉시', '경포대', '안목'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20501',
  }),
  createRegion({
    id: 'sokcho',
    name: '속초',
    province: '강원특별자치도',
    aliases: ['속초시', '영랑호'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
  }),
  createRegion({
    id: 'donghae',
    name: '동해',
    province: '강원특별자치도',
    aliases: ['동해시', '묵호'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20601',
  }),
  createRegion({
    id: 'samcheok',
    name: '삼척',
    province: '강원특별자치도',
    aliases: ['삼척시'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20601',
    codeNote: '삼척은 동해권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'yangyang',
    name: '양양',
    province: '강원특별자치도',
    aliases: ['양양군', '남애'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    codeNote: '양양은 속초권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'goseong-gangwon',
    name: '고성',
    province: '강원특별자치도',
    aliases: ['고성군', '강원 고성', '아야진'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    codeNote: '강원 고성은 속초권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'hongcheon',
    name: '홍천',
    province: '강원특별자치도',
    aliases: ['홍천군'],
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10301',
    codeNote: '홍천은 춘천권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'pyeongchang',
    name: '평창',
    province: '강원특별자치도',
    aliases: ['평창군'],
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10401',
    codeNote: '평창은 원주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'jeongseon',
    name: '정선',
    province: '강원특별자치도',
    aliases: ['정선군'],
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10401',
    codeNote: '정선은 원주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'inje',
    name: '인제',
    province: '강원특별자치도',
    aliases: ['인제군'],
    weatherRegionCode: '11D10000',
    temperatureRegionCode: '11D10301',
    codeNote: '인제는 춘천권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'daejinhang',
    name: '대진항',
    province: '강원특별자치도',
    aliases: ['속초 대진항', '대진'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    fishingPlaceName: '대진항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'ayajinhang',
    name: '아야진항',
    province: '강원특별자치도',
    aliases: ['아야진', '고성 아야진항'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    fishingPlaceName: '아야진항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'oeongchihang',
    name: '외옹치항',
    province: '강원특별자치도',
    aliases: ['외옹치', '속초 외옹치항'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    fishingPlaceName: '외옹치항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'daejeon',
    name: '대전',
    province: '대전광역시',
    aliases: ['대전시', '유성'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
  }),
  createRegion({
    id: 'sejong',
    name: '세종',
    province: '세종특별자치시',
    aliases: ['세종시', '어진동', '호수공원'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
    codeNote: '세종은 대전권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'cheongju',
    name: '청주',
    province: '충청북도',
    aliases: ['청주시'],
    weatherRegionCode: '11C10000',
    temperatureRegionCode: '11C10301',
  }),
  createRegion({
    id: 'chungju',
    name: '충주',
    province: '충청북도',
    aliases: ['충주시'],
    weatherRegionCode: '11C10000',
    temperatureRegionCode: '11C10401',
  }),
  createRegion({
    id: 'jecheon',
    name: '제천',
    province: '충청북도',
    aliases: ['제천시'],
    weatherRegionCode: '11C10000',
    temperatureRegionCode: '11C10401',
    codeNote: '제천은 충주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'cheonan',
    name: '천안',
    province: '충청남도',
    aliases: ['천안시'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
    codeNote: '천안은 대전권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'asan',
    name: '아산',
    province: '충청남도',
    aliases: ['아산시'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
    codeNote: '아산은 대전권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'seosan',
    name: '서산',
    province: '충청남도',
    aliases: ['서산시', '간월도'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
  }),
  createRegion({
    id: 'dangjin',
    name: '당진',
    province: '충청남도',
    aliases: ['당진시'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
    codeNote: '당진은 서산권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'boryeong',
    name: '보령',
    province: '충청남도',
    aliases: ['보령시', '대천'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
    codeNote: '보령은 서산권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'gongju',
    name: '공주',
    province: '충청남도',
    aliases: ['공주시'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
    codeNote: '공주는 대전권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'nonsan',
    name: '논산',
    province: '충청남도',
    aliases: ['논산시'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20401',
    codeNote: '논산은 대전권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'taean',
    name: '태안',
    province: '충청남도',
    aliases: ['태안군'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
    codeNote: '태안은 서산권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'anheunghang',
    name: '안흥항',
    province: '충청남도',
    aliases: ['태안 안흥항', '안흥항 북측'],
    weatherRegionCode: '11C20000',
    temperatureRegionCode: '11C20102',
    fishingPlaceName: '안흥항 북측(30km)',
    fishingGubun: '선상',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'sinsido',
    name: '신시도',
    province: '전북특별자치도',
    aliases: ['군산 신시도'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10501',
    fishingPlaceName: '신시도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'eocheongdo',
    name: '어청도',
    province: '전북특별자치도',
    aliases: ['군산 어청도'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10501',
    fishingPlaceName: '어청도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'jeonju',
    name: '전주',
    province: '전북특별자치도',
    aliases: ['전주시'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10201',
  }),
  createRegion({
    id: 'gunsan',
    name: '군산',
    province: '전북특별자치도',
    aliases: ['군산시', '새만금'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10501',
  }),
  createRegion({
    id: 'iksan',
    name: '익산',
    province: '전북특별자치도',
    aliases: ['익산시'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10201',
    codeNote: '익산은 전주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'jeongeup',
    name: '정읍',
    province: '전북특별자치도',
    aliases: ['정읍시'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10201',
    codeNote: '정읍은 전주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'namwon',
    name: '남원',
    province: '전북특별자치도',
    aliases: ['남원시'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10201',
    codeNote: '남원은 전주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'gwangju',
    name: '광주',
    province: '광주광역시',
    aliases: ['광주시', '상무지구'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20501',
  }),
  createRegion({
    id: 'mokpo',
    name: '목포',
    province: '전라남도',
    aliases: ['목포시', '유달산'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
  }),
  createRegion({
    id: 'yeosu',
    name: '여수',
    province: '전라남도',
    aliases: ['여수시', '오동도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
  }),
  createRegion({
    id: 'suncheon',
    name: '순천',
    province: '전라남도',
    aliases: ['순천시'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20501',
    codeNote: '순천은 광주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'gwangyang',
    name: '광양',
    province: '전라남도',
    aliases: ['광양시'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    codeNote: '광양은 여수권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'naju',
    name: '나주',
    province: '전라남도',
    aliases: ['나주시'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20501',
    codeNote: '나주는 광주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'haenam',
    name: '해남',
    province: '전라남도',
    aliases: ['해남군'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    codeNote: '해남은 목포권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'wando',
    name: '완도',
    province: '전라남도',
    aliases: ['완도군'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    codeNote: '완도는 여수권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'jindo',
    name: '진도',
    province: '전라남도',
    aliases: ['진도군'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    codeNote: '진도는 목포권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'geomundo',
    name: '거문도',
    province: '전라남도',
    aliases: ['여수 거문도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    fishingPlaceName: '거문도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'gageodo',
    name: '가거도',
    province: '전라남도',
    aliases: ['신안 가거도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    fishingPlaceName: '가거도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'bigeumdo',
    name: '비금도',
    province: '전라남도',
    aliases: ['신안 비금도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    fishingPlaceName: '비금도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'hajodo',
    name: '하조도',
    province: '전라남도',
    aliases: ['진도 하조도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    fishingPlaceName: '하조도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'sangwangdeungdo',
    name: '상왕등도',
    province: '전라남도',
    aliases: ['부안 상왕등도'],
    weatherRegionCode: '11F10000',
    temperatureRegionCode: '21F10501',
    fishingPlaceName: '상왕등도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'sangtaedo',
    name: '상태도',
    province: '전라남도',
    aliases: ['신안 상태도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '21F20801',
    fishingPlaceName: '상태도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'west',
  }),
  createRegion({
    id: 'sinjido',
    name: '신지도',
    province: '전라남도',
    aliases: ['완도 신지도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    fishingPlaceName: '신지도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'yeondo-jeonnam',
    name: '연도',
    province: '전라남도',
    aliases: ['여수 연도'],
    weatherRegionCode: '11F20000',
    temperatureRegionCode: '11F20601',
    fishingPlaceName: '연도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'daegu',
    name: '대구',
    province: '대구광역시',
    aliases: ['대구시', '동성로'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10701',
  }),
  createRegion({
    id: 'pohang',
    name: '포항',
    province: '경상북도',
    aliases: ['포항시', '영일대', '구룡포'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    fishingPlaceName: '포항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'gyeongju',
    name: '경주',
    province: '경상북도',
    aliases: ['경주시'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    codeNote: '경주는 포항권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'andong',
    name: '안동',
    province: '경상북도',
    aliases: ['안동시'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10501',
  }),
  createRegion({
    id: 'gumi',
    name: '구미',
    province: '경상북도',
    aliases: ['구미시'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10701',
    codeNote: '구미는 대구권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'yeongju',
    name: '영주',
    province: '경상북도',
    aliases: ['영주시'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10501',
    codeNote: '영주는 안동권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'busan',
    name: '부산',
    province: '부산광역시',
    aliases: ['부산시', '해운대', '광안리'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
  }),
  createRegion({
    id: 'busan-dongbu',
    name: '부산동부',
    province: '부산광역시',
    aliases: ['부산 동부', '기장'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
    fishingPlaceName: '부산동부',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'busan-nambu',
    name: '부산남부',
    province: '부산광역시',
    aliases: ['부산 남부', '영도'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
    fishingPlaceName: '부산남부',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'busan-seobu',
    name: '부산서부',
    province: '부산광역시',
    aliases: ['부산 서부', '다대포'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
    fishingPlaceName: '부산서부',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'ulsan',
    name: '울산',
    province: '울산광역시',
    aliases: ['울산시', '간절곶'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20101',
  }),
  createRegion({
    id: 'changwon',
    name: '창원',
    province: '경상남도',
    aliases: ['창원시', '마산', '진해'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20304',
  }),
  createRegion({
    id: 'gimhae',
    name: '김해',
    province: '경상남도',
    aliases: ['김해시'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20304',
    codeNote: '김해는 창원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'yangsan',
    name: '양산',
    province: '경상남도',
    aliases: ['양산시'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20201',
    codeNote: '양산은 부산권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'jinju',
    name: '진주',
    province: '경상남도',
    aliases: ['진주시'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20701',
  }),
  createRegion({
    id: 'tongyeong',
    name: '통영',
    province: '경상남도',
    aliases: ['통영시'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20401',
  }),
  createRegion({
    id: 'geoje',
    name: '거제',
    province: '경상남도',
    aliases: ['거제시', '장승포'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20401',
  }),
  createRegion({
    id: 'sacheon',
    name: '사천',
    province: '경상남도',
    aliases: ['사천시'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20701',
    codeNote: '사천은 진주권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'miryang',
    name: '밀양',
    province: '경상남도',
    aliases: ['밀양시'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20304',
    codeNote: '밀양은 창원권 대표 기온 코드를 사용합니다.',
  }),
  createRegion({
    id: 'geojedo',
    name: '거제도',
    province: '경상남도',
    aliases: ['거제 도', '구조라'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20401',
    fishingPlaceName: '거제도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'yokjido',
    name: '욕지도',
    province: '경상남도',
    aliases: ['통영 욕지도'],
    weatherRegionCode: '11H20000',
    temperatureRegionCode: '11H20401',
    fishingPlaceName: '욕지도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'ulleungdo',
    name: '울릉도',
    province: '경상북도',
    aliases: ['울릉'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    fishingPlaceName: '울릉도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    codeNote: '울릉도는 포항권 대표 기온 코드를 사용합니다.',
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'uljin-hujeong',
    name: '울진 후정',
    province: '경상북도',
    aliases: ['울진후정', '후정해수욕장'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    fishingPlaceName: '울진 후정',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    codeNote: '울진 후정은 포항권 대표 기온 코드를 사용합니다.',
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'hupo',
    name: '후포',
    province: '경상북도',
    aliases: ['후포항', '울진 후포'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    fishingPlaceName: '후포',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    codeNote: '후포는 포항권 대표 기온 코드를 사용합니다.',
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'namaehang',
    name: '남애항',
    province: '강원특별자치도',
    aliases: ['양양 남애항', '남애'],
    weatherRegionCode: '11D20000',
    temperatureRegionCode: '11D20401',
    fishingPlaceName: '남애항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'yangpohang',
    name: '양포항',
    province: '경상북도',
    aliases: ['포항 양포항', '양포'],
    weatherRegionCode: '11H10000',
    temperatureRegionCode: '11H10201',
    fishingPlaceName: '양포항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'east',
  }),
  createRegion({
    id: 'jeju',
    name: '제주',
    province: '제주특별자치도',
    aliases: ['제주시', '애월', '한림'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
  }),
  createRegion({
    id: 'seogwipo',
    name: '서귀포',
    province: '제주특별자치도',
    aliases: ['서귀포시'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00401',
    fishingPlaceName: '서귀포',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'seongsanpo',
    name: '성산포',
    province: '제주특별자치도',
    aliases: ['성산', '성산항'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00301',
    fishingPlaceName: '성산포',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'gimnyeong',
    name: '김녕',
    province: '제주특별자치도',
    aliases: ['김녕항'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
    fishingPlaceName: '김녕',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'biyangdo',
    name: '비양도',
    province: '제주특별자치도',
    aliases: ['한림 비양도'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
    fishingPlaceName: '비양도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'chujado',
    name: '추자도',
    province: '제주특별자치도',
    aliases: ['추자'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00401',
    fishingPlaceName: '추자도',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    codeNote: '추자도는 서귀포권 대표 기온 코드를 사용합니다.',
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'doduhang',
    name: '도두항',
    province: '제주특별자치도',
    aliases: ['도두', '제주 도두항'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00201',
    fishingPlaceName: '도두항',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'daejeong-jeju',
    name: '대정',
    province: '제주특별자치도',
    aliases: ['모슬포', '제주 대정'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00401',
    fishingPlaceName: '대정',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
  createRegion({
    id: 'pyoseon',
    name: '표선',
    province: '제주특별자치도',
    aliases: ['제주 표선'],
    weatherRegionCode: '11G00000',
    temperatureRegionCode: '11G00401',
    fishingPlaceName: '표선',
    fishingGubun: '갯바위',
    supportsSeaInfo: true,
    seaAreaCode: 'south',
  }),
]

const BASE_REGION_MAP = new Map(BASE_REGIONS.map((region) => [region.id, region]))

function createDerivedRegion(region) {
  const parentRegion = BASE_REGION_MAP.get(region.parentId)
  if (!parentRegion) {
    throw new Error(`Unknown parent region: ${region.parentId}`)
  }

  return createRegion({
    id: region.id,
    name: region.name,
    displayName: region.displayName || region.name,
    parentName: region.parentName || parentRegion.name,
    province: region.province || parentRegion.province,
    aliases: region.aliases || [],
    weatherRegionCode: region.weatherRegionCode || parentRegion.weatherRegionCode,
    temperatureRegionCode: region.temperatureRegionCode || parentRegion.temperatureRegionCode,
    fishingPlaceName:
      Object.prototype.hasOwnProperty.call(region, 'fishingPlaceName')
        ? region.fishingPlaceName
        : parentRegion.fishingPlaceName,
    fishingGubun:
      Object.prototype.hasOwnProperty.call(region, 'fishingGubun')
        ? region.fishingGubun
        : parentRegion.fishingGubun,
    supportsSeaInfo:
      Object.prototype.hasOwnProperty.call(region, 'supportsSeaInfo')
        ? region.supportsSeaInfo
        : parentRegion.supportsSeaInfo,
    codeNote: region.codeNote || parentRegion.codeNote || '',
    seaAreaCode:
      Object.prototype.hasOwnProperty.call(region, 'seaAreaCode')
        ? region.seaAreaCode
        : parentRegion.seaAreaCode,
    administrativeLevel: region.administrativeLevel || 'dong',
  })
}

const DONG_REGIONS = [
  createDerivedRegion({
    id: 'seongsu-dong',
    name: '성수동',
    parentId: 'seoul',
    aliases: ['성수', '서울 성수동'],
  }),
  createDerivedRegion({
    id: 'yeoksam-dong',
    name: '역삼동',
    parentId: 'seoul',
    aliases: ['역삼', '강남 역삼동'],
  }),
  createDerivedRegion({
    id: 'samseong-dong',
    name: '삼성동',
    parentId: 'seoul',
    aliases: ['삼성', '강남 삼성동', '코엑스'],
  }),
  createDerivedRegion({
    id: 'sinsa-dong-seoul',
    name: '신사동',
    parentId: 'seoul',
    aliases: ['신사', '가로수길'],
  }),
  createDerivedRegion({
    id: 'seogyo-dong',
    name: '서교동',
    parentId: 'seoul',
    aliases: ['홍대입구', '홍대', '홍대입구역', '홍대입구동'],
  }),
  createDerivedRegion({
    id: 'yeouido-dong',
    name: '여의도동',
    parentId: 'seoul',
    aliases: ['여의도', '여의도역'],
  }),
  createDerivedRegion({
    id: 'jamsil-dong',
    name: '잠실동',
    parentId: 'seoul',
    aliases: ['잠실', '잠실역'],
  }),
  createDerivedRegion({
    id: 'magok-dong',
    name: '마곡동',
    parentId: 'seoul',
    aliases: ['마곡', '마곡나루'],
  }),
  createDerivedRegion({
    id: 'hapjeong-dong',
    name: '합정동',
    parentId: 'seoul',
    aliases: ['합정', '합정역'],
  }),
  createDerivedRegion({
    id: 'yeonnam-dong',
    name: '연남동',
    parentId: 'seoul',
    aliases: ['연남', '연트럴파크'],
  }),
  createDerivedRegion({
    id: 'haeundae-dong',
    name: '해운대동',
    parentId: 'busan-dongbu',
    parentName: '부산',
    aliases: ['해운대', '부산 해운대동'],
  }),
  createDerivedRegion({
    id: 'gwangan-dong',
    name: '광안동',
    parentId: 'busan-nambu',
    parentName: '부산',
    aliases: ['광안리', '광안', '부산 광안동'],
  }),
  createDerivedRegion({
    id: 'daeyeon-dong',
    name: '대연동',
    parentId: 'busan-nambu',
    parentName: '부산',
    aliases: ['대연', '경성대', '부경대'],
  }),
  createDerivedRegion({
    id: 'nampo-dong',
    name: '남포동',
    parentId: 'busan-seobu',
    parentName: '부산',
    aliases: ['남포', '자갈치'],
  }),
  createDerivedRegion({
    id: 'bujeon-dong',
    name: '부전동',
    parentId: 'busan',
    aliases: ['서면', '부전', '서면역'],
    fishingPlaceName: null,
    fishingGubun: null,
    supportsSeaInfo: false,
    seaAreaCode: null,
  }),
  createDerivedRegion({
    id: 'gijang-eup',
    name: '기장읍',
    parentId: 'busan-dongbu',
    parentName: '부산',
    aliases: ['기장', '부산 기장'],
    administrativeLevel: 'district',
  }),
  createDerivedRegion({
    id: 'aewol-eup',
    name: '애월읍',
    parentId: 'jeju',
    aliases: ['애월', '제주 애월'],
  }),
  createDerivedRegion({
    id: 'hanlim-eup',
    name: '한림읍',
    parentId: 'jeju',
    aliases: ['한림', '제주 한림'],
  }),
  createDerivedRegion({
    id: 'gujwa-eup',
    name: '구좌읍',
    parentId: 'jeju',
    aliases: ['구좌', '제주 구좌'],
  }),
  createDerivedRegion({
    id: 'seongsan-eup',
    name: '성산읍',
    parentId: 'seongsanpo',
    aliases: ['성산', '성산일출봉', '제주 성산읍'],
  }),
  createDerivedRegion({
    id: 'pyoseon-myeon',
    name: '표선면',
    parentId: 'pyoseon',
    aliases: ['표선', '제주 표선면'],
  }),
  createDerivedRegion({
    id: 'daejeong-eup',
    name: '대정읍',
    parentId: 'daejeong-jeju',
    aliases: ['대정', '모슬포', '제주 대정읍'],
  }),
  createDerivedRegion({
    id: 'seogwi-dong',
    name: '서귀동',
    parentId: 'seogwipo',
    aliases: ['서귀동', '서귀포 서귀동'],
  }),
  createDerivedRegion({
    id: 'jungmun-dong',
    name: '중문동',
    parentId: 'seogwipo',
    aliases: ['중문', '중문관광단지'],
  }),
  createDerivedRegion({
    id: 'beophwan-dong',
    name: '법환동',
    parentId: 'seogwipo',
    aliases: ['법환', '서귀포 법환동'],
  }),
  createDerivedRegion({
    id: 'songdo-dong',
    name: '송도동',
    parentId: 'incheon',
    aliases: ['송도', '송도국제도시'],
  }),
  createDerivedRegion({
    id: 'cheongna-dong',
    name: '청라동',
    parentId: 'incheon',
    aliases: ['청라', '청라국제도시'],
  }),
  createDerivedRegion({
    id: 'yeongjong-dong',
    name: '영종동',
    parentId: 'incheon',
    aliases: ['영종', '영종도'],
  }),
  createDerivedRegion({
    id: 'jeongja-dong',
    name: '정자동',
    parentId: 'seongnam',
    aliases: ['정자', '분당 정자동'],
  }),
  createDerivedRegion({
    id: 'pangyo-dong',
    name: '판교동',
    parentId: 'seongnam',
    aliases: ['판교', '테크노밸리'],
  }),
  createDerivedRegion({
    id: 'gwanggyo-dong',
    name: '광교동',
    parentId: 'suwon',
    aliases: ['광교', '광교중앙역'],
  }),
  createDerivedRegion({
    id: 'dongtan',
    name: '동탄',
    parentId: 'hwaseong',
    aliases: ['동탄신도시', '동탄역'],
  }),
  createDerivedRegion({
    id: 'ilsan-dong',
    name: '일산동',
    parentId: 'goyang',
    aliases: ['일산', '일산호수공원'],
  }),
  createDerivedRegion({
    id: 'unjeong',
    name: '운정',
    parentId: 'paju',
    aliases: ['운정신도시', '파주 운정'],
  }),
  createDerivedRegion({
    id: 'gimpo-janggi-dong',
    name: '장기동',
    parentId: 'gimpo',
    aliases: ['김포 장기동', '장기'],
  }),
  createDerivedRegion({
    id: 'yeongheung-myeon',
    name: '영흥면',
    parentId: 'yeongheungdo',
    aliases: ['영흥도', '인천 영흥면'],
    administrativeLevel: 'district',
  }),
  createDerivedRegion({
    id: 'geoje-myeon',
    name: '거제면',
    parentId: 'geojedo',
    parentName: '거제도',
    aliases: ['거제면', '거제'],
    administrativeLevel: 'district',
  }),
  createDerivedRegion({
    id: 'jangseungpo-dong',
    name: '장승포동',
    parentId: 'geojedo',
    parentName: '거제도',
    aliases: ['장승포', '거제 장승포동'],
  }),
  createDerivedRegion({
    id: 'guryongpo-eup',
    name: '구룡포읍',
    parentId: 'pohang',
    aliases: ['구룡포', '포항 구룡포읍'],
    administrativeLevel: 'district',
  }),
  createDerivedRegion({
    id: 'hupo-myeon',
    name: '후포면',
    parentId: 'hupo',
    parentName: '후포',
    aliases: ['후포', '울진 후포면'],
    administrativeLevel: 'district',
  }),
  createDerivedRegion({
    id: 'ulleung-eup',
    name: '울릉읍',
    parentId: 'ulleungdo',
    parentName: '울릉도',
    aliases: ['울릉읍', '울릉'],
    administrativeLevel: 'district',
  }),
  createDerivedRegion({
    id: 'gimnyeong-ri',
    name: '김녕리',
    parentId: 'gimnyeong',
    parentName: '김녕',
    aliases: ['김녕', '제주 김녕리'],
  }),
  createDerivedRegion({
    id: 'chuja-myeon',
    name: '추자면',
    parentId: 'chujado',
    parentName: '추자도',
    aliases: ['추자도', '추자'],
    administrativeLevel: 'district',
  }),
]

export const REGIONS = [...BASE_REGIONS, ...DONG_REGIONS]

export const DEFAULT_REGION_ID = 'seoul'
export const DEFAULT_REGION = REGIONS.find((region) => region.id === DEFAULT_REGION_ID) || REGIONS[0]

const REGION_MAP = new Map(REGIONS.map((region) => [region.id, region]))

export function findRegionById(regionId) {
  if (!regionId) return null
  return REGION_MAP.get(regionId) || null
}

export function searchRegions(query) {
  const keyword = normalizeSearchText(query)
  if (!keyword) return []

  return REGIONS.map((region, index) => ({
    index,
    region,
    score: getRegionSearchScore(region, keyword),
  }))
    .filter((item) => Number.isFinite(item.score))
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score
      if (left.region.name.length !== right.region.name.length) {
        return left.region.name.length - right.region.name.length
      }
      return left.index - right.index
    })
    .map((item) => item.region)
}

export function normalizeRegion(regionOrId) {
  if (!regionOrId) return DEFAULT_REGION

  if (typeof regionOrId === 'string') {
    return findRegionById(regionOrId) || DEFAULT_REGION
  }

  const matchedRegion = findRegionById(regionOrId.id)
  if (matchedRegion) return matchedRegion

  if (
    hasRegionText(regionOrId.name) &&
    hasRegionText(regionOrId.weatherRegionCode) &&
    hasRegionText(regionOrId.temperatureRegionCode)
  ) {
    return createRegion(regionOrId)
  }

  return DEFAULT_REGION
}

export function buildRegionMeetingFields(regionOrId) {
  const region = normalizeRegion(regionOrId)

  return {
    region_name: region.displayName || region.name,
    region_display_name: region.displayName || region.name,
    region_parent_name: region.parentName || region.name,
    weather_region_code: region.weatherRegionCode,
    temperature_region_code: region.temperatureRegionCode,
    fishing_place_name: region.fishingPlaceName,
    fishing_gubun: region.fishingGubun,
  }
}

export function buildRegionRecord(regionOrId) {
  const region = normalizeRegion(regionOrId)

  return {
    id: region.id,
    name: region.name,
    displayName: region.displayName || region.name,
    parentName: region.parentName || region.name,
    province: region.province,
    aliases: region.aliases,
    weatherRegionCode: region.weatherRegionCode,
    temperatureRegionCode: region.temperatureRegionCode,
    fishingPlaceName: region.fishingPlaceName,
    fishingGubun: region.fishingGubun,
    supportsSeaInfo: region.supportsSeaInfo,
    codeNote: region.codeNote,
    seaAreaCode: region.seaAreaCode || null,
    administrativeLevel: region.administrativeLevel || 'city',
  }
}

export function getRegionFromMeetingRecord(record) {
  if (!record) return buildRegionRecord(DEFAULT_REGION)

  const regionName = hasRegionText(record.region_name) ? record.region_name.trim() : ''
  const regionDisplayName = hasRegionText(record.region_display_name)
    ? record.region_display_name.trim()
    : regionName
  const regionParentName = hasRegionText(record.region_parent_name)
    ? record.region_parent_name.trim()
    : ''
  const weatherRegionCode = hasRegionText(record.weather_region_code)
    ? record.weather_region_code.trim()
    : ''
  const temperatureRegionCode = hasRegionText(record.temperature_region_code)
    ? record.temperature_region_code.trim()
    : ''
  const fishingPlaceName = hasRegionText(record.fishing_place_name)
    ? record.fishing_place_name.trim()
    : ''

  const matchedRegion =
    REGIONS.find((region) => {
      return (
        regionDisplayName &&
        (region.name === regionDisplayName || region.displayName === regionDisplayName) &&
        weatherRegionCode &&
        temperatureRegionCode &&
        region.weatherRegionCode === weatherRegionCode &&
        region.temperatureRegionCode === temperatureRegionCode
      )
    }) ||
    REGIONS.find((region) => {
      if (!regionDisplayName) return false
      if (region.name !== regionDisplayName && region.displayName !== regionDisplayName) {
        return false
      }
      if (weatherRegionCode && region.weatherRegionCode !== weatherRegionCode) return false
      if (temperatureRegionCode && region.temperatureRegionCode !== temperatureRegionCode) {
        return false
      }

      return true
    }) ||
    REGIONS.find((region) => {
      return (
        weatherRegionCode &&
        temperatureRegionCode &&
        region.weatherRegionCode === weatherRegionCode &&
        region.temperatureRegionCode === temperatureRegionCode &&
        (!regionParentName || region.parentName === regionParentName || region.name === regionParentName)
      )
    }) ||
    REGIONS.find((region) => {
      return !regionDisplayName && fishingPlaceName && region.fishingPlaceName === fishingPlaceName
    }) ||
    null

  if (matchedRegion) {
    return buildRegionRecord(matchedRegion)
  }

  return {
    id: regionDisplayName ? `custom-${normalizeSearchText(regionDisplayName)}` : DEFAULT_REGION.id,
    name: regionDisplayName || regionName || DEFAULT_REGION.name,
    displayName: regionDisplayName || regionName || DEFAULT_REGION.displayName,
    parentName: regionParentName || regionName || DEFAULT_REGION.parentName,
    province: '',
    aliases: [],
    weatherRegionCode: weatherRegionCode || null,
    temperatureRegionCode: temperatureRegionCode || null,
    fishingPlaceName: fishingPlaceName || null,
    fishingGubun: record.fishing_gubun || null,
    supportsSeaInfo: Boolean(fishingPlaceName && record.fishing_gubun),
    codeNote: '',
    seaAreaCode: null,
    administrativeLevel: 'city',
  }
}

export function isSeaRegion(regionOrId) {
  const region = normalizeRegion(regionOrId)
  return Boolean(region.fishingPlaceName && region.fishingGubun)
}
