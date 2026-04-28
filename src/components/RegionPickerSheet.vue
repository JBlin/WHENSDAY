<template>
  <Transition name="region-sheet">
    <div v-if="open" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="closeSheet">
      <div class="absolute inset-0 bg-black/40" @click="closeSheet" />

      <div class="region-panel relative flex max-h-[88vh] flex-col rounded-t-2xl bg-white px-5 pt-4 pb-0">
        <div class="mb-4 flex justify-center">
          <div class="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div class="mb-4">
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Region</p>
          <h3 class="mt-1 text-lg font-bold text-gray-900">약속 지역 선택</h3>
          <p class="mt-1 text-sm text-gray-500">지역명, 바다 포인트를 검색해보세요</p>
        </div>

        <div class="mb-4">
          <input
            v-model="query"
            type="text"
            placeholder="지역명, 바다 포인트를 검색해보세요"
            class="h-12 w-full rounded-btn border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="overflow-y-auto pr-1 -mr-1 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <div v-if="query.trim()" class="space-y-3">
            <section class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">검색 결과</p>
              <p v-if="!searchedRegions.length" class="rounded-btn bg-gray-50 px-3 py-3 text-sm text-gray-500">
                검색 결과가 없어요. 다른 이름으로 다시 찾아보세요.
              </p>
              <div v-else class="flex flex-col gap-2">
                <button
                  v-for="region in searchedRegions"
                  :key="region.id"
                  type="button"
                  class="rounded-card border px-4 py-3 text-left transition-all"
                  :class="regionCardClass(region.id)"
                  @click="selectRegion(region.id)"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-gray-900">{{ region.name }}</p>
                      <p class="mt-1 text-xs text-gray-500">{{ buildRegionMeta(region) }}</p>
                    </div>
                    <span
                      v-if="isFavorite(region.id)"
                      class="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700"
                    >
                      즐겨찾기
                    </span>
                  </div>
                </button>
              </div>
            </section>
          </div>

          <div v-else class="space-y-5">
            <section class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">자주 가는 지역</p>
              <p
                v-if="!favoriteRegions.length"
                class="rounded-btn border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500"
              >
                자주 가는 지역을 저장해두면 다음에 빠르게 선택할 수 있어요.
              </p>
              <div v-else class="flex flex-wrap gap-2">
                <button
                  v-for="region in favoriteRegions"
                  :key="region.id"
                  type="button"
                  class="rounded-full border px-3 py-2 text-xs font-semibold transition-all"
                  :class="regionChipClass(region.id)"
                  @click="selectRegion(region.id)"
                >
                  {{ region.name }}
                </button>
              </div>
            </section>

            <section class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">추천 지역</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="region in recommendedRegions"
                  :key="region.id"
                  type="button"
                  class="rounded-full border px-3 py-2 text-xs font-semibold transition-all"
                  :class="regionChipClass(region.id)"
                  @click="selectRegion(region.id)"
                >
                  {{ region.name }}
                </button>
              </div>
            </section>

            <section class="space-y-3">
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  v-for="category in REGION_CATEGORIES"
                  :key="category"
                  type="button"
                  class="shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all"
                  :class="
                    activeCategory === category
                      ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
                      : 'border-gray-200 bg-white text-gray-500'
                  "
                  @click="activeCategory = category"
                >
                  {{ category }}
                </button>
              </div>

              <div class="flex flex-col gap-2">
                <button
                  v-for="region in filteredRegions"
                  :key="region.id"
                  type="button"
                  class="rounded-card border px-4 py-3 text-left transition-all"
                  :class="regionCardClass(region.id)"
                  @click="selectRegion(region.id)"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-gray-900">{{ region.name }}</p>
                      <p class="mt-1 text-xs text-gray-500">{{ buildRegionMeta(region) }}</p>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <span
                        v-if="region.seaAreaCode"
                        class="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700"
                      >
                        바다
                      </span>
                      <span
                        v-if="isFavorite(region.id)"
                        class="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700"
                      >
                        즐겨찾기
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  findRegionById,
  getRecommendedRegions,
  REGIONS,
  REGION_CATEGORIES,
} from '../data/regions.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  selectedRegionId: { type: String, default: '' },
  favoriteRegionIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'select'])

const query = ref('')
const activeCategory = ref('전체')

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    query.value = ''
    activeCategory.value = '전체'
  }
)

const favoriteRegions = computed(() =>
  props.favoriteRegionIds.map((regionId) => findRegionById(regionId)).filter(Boolean)
)

const recommendedRegions = computed(() => getRecommendedRegions())

const searchedRegions = computed(() => {
  const keyword = query.value.trim().toLowerCase()

  if (!keyword) return []

  return REGIONS.filter((region) => {
    const haystack = [
      region.name,
      region.category,
      region.fishingPlaceName,
      ...(region.keywords || []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(keyword)
  })
})

const filteredRegions = computed(() => {
  if (activeCategory.value === '전체') return REGIONS
  if (activeCategory.value === '바다') {
    return REGIONS.filter((region) => Boolean(region.seaAreaCode && region.fishingPlaceName))
  }
  return REGIONS.filter((region) => region.category === activeCategory.value)
})

function closeSheet() {
  emit('update:open', false)
}

function selectRegion(regionId) {
  emit('select', regionId)
  emit('update:open', false)
}

function isFavorite(regionId) {
  return props.favoriteRegionIds.includes(regionId)
}

function buildRegionMeta(region) {
  return [region.category, region.fishingPlaceName ? `바다 포인트 · ${region.fishingPlaceName}` : '도시 정보']
    .filter(Boolean)
    .join(' · ')
}

function regionCardClass(regionId) {
  return regionId === props.selectedRegionId
    ? 'border-primary bg-primary/[0.04] shadow-sm'
    : 'border-gray-200 bg-white'
}

function regionChipClass(regionId) {
  return regionId === props.selectedRegionId
    ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
    : 'border-gray-200 bg-white text-gray-600'
}
</script>

<style scoped>
.region-sheet-enter-active {
  transition: opacity 0.25s ease;
}

.region-sheet-leave-active {
  transition: opacity 0.2s ease;
}

.region-sheet-enter-from,
.region-sheet-leave-to {
  opacity: 0;
}

.region-sheet-enter-from .region-panel {
  transform: translateY(100%);
}

.region-sheet-enter-active .region-panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.region-sheet-leave-active .region-panel {
  transition: transform 0.2s ease-in;
}

.region-sheet-leave-to .region-panel {
  transform: translateY(100%);
}
</style>
