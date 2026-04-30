export type FishingRegionMapEntry = {
  matchKeywords: string[]
  fishingPlaceName: string
  fishingGubun: '갯바위' | '선상'
}

export const FISHING_REGION_MAP: FishingRegionMapEntry[] = [
  {
    matchKeywords: ['서귀포시', '서귀동', '법환동', '중문동'],
    fishingPlaceName: '서귀포',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['성산읍', '성산포'],
    fishingPlaceName: '성산포',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['김녕', '김녕리'],
    fishingPlaceName: '김녕',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['추자면', '추자도'],
    fishingPlaceName: '추자도',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['영흥면', '영흥도'],
    fishingPlaceName: '영흥도',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['거제시', '거제도', '거제면', '장승포동'],
    fishingPlaceName: '거제도',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['포항시', '구룡포읍'],
    fishingPlaceName: '포항',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['울릉군', '울릉읍'],
    fishingPlaceName: '울릉도',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['울진군', '후포면', '후포'],
    fishingPlaceName: '후포',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['해운대구', '해운대동', '기장군', '기장읍'],
    fishingPlaceName: '부산동부',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['수영구', '광안동', '남구', '대연동'],
    fishingPlaceName: '부산남부',
    fishingGubun: '갯바위',
  },
  {
    matchKeywords: ['중구', '남포동', '영도구', '사하구', '강서구'],
    fishingPlaceName: '부산서부',
    fishingGubun: '갯바위',
  },
]

export function findFishingRegionMapping(fullName: string) {
  const normalizedName = String(fullName || '').trim()
  if (!normalizedName) return null

  return (
    FISHING_REGION_MAP.find((entry) =>
      entry.matchKeywords.some((keyword) => normalizedName.includes(keyword))
    ) || null
  )
}
