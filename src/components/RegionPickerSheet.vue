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
          <h3 class="mt-1 text-lg font-bold text-gray-900">지역 선택</h3>
        </div>

        <div class="mb-3">
          <input
            ref="searchInputRef"
            v-model="query"
            type="text"
            placeholder="지역명, 도시, 바다 포인트 검색"
            class="h-12 w-full rounded-btn border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="mb-3 flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="tab in PICKER_TABS"
            :key="tab"
            type="button"
            class="shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all"
            :class="
              activeTab === tab
                ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
                : 'border-gray-200 bg-white text-gray-500'
            "
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="overflow-y-auto pr-1 -mr-1 pb-[calc(env(safe-area-inset-bottom,0px)+24px)]">
          <!-- 검색 결과 -->
          <div v-if="query.trim()" class="flex flex-col gap-1.5">
            <p
              v-if="!searchedRegions.length"
              class="rounded-btn bg-gray-50 px-3 py-4 text-sm text-gray-500 text-center"
            >
              검색 결과가 없어요.
            </p>
            <template v-else>
              <div
                v-for="region in searchedRegions"
                :key="region.id"
                class="flex cursor-pointer items-center gap-3 rounded-card border px-4 py-3 transition-all"
                :class="region.id === selectedRegionId ? 'border-primary bg-primary/[0.04]' : 'border-gray-100 bg-white'"
                @click="selectRegion(region.id)"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ region.name }}</p>
                  <p class="mt-0.5 text-xs text-gray-400">{{ buildSubLabel(region) }}</p>
                </div>
                <button
                  type="button"
                  class="shrink-0 text-lg leading-none transition-colors"
                  :class="isFavorite(region.id) ? 'text-amber-400' : 'text-gray-300'"
                  @click.stop="handleToggleFavorite(region.id)"
                >
                  {{ isFavorite(region.id) ? '★' : '☆' }}
                </button>
              </div>
            </template>
          </div>

          <!-- 자주 가는 지역 탭 -->
          <div v-else-if="activeTab === '자주 가는 지역'" class="flex flex-col gap-1.5">
            <p
              v-if="!favoriteRegions.length"
              class="rounded-btn border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500 text-center"
            >
              자주 가는 지역을 저장해두면 다음에 빠르게 선택할 수 있어요.
            </p>
            <template v-else>
              <div
                v-for="region in favoriteRegions"
                :key="region.id"
                class="flex cursor-pointer items-center gap-3 rounded-card border px-4 py-3 transition-all"
                :class="region.id === selectedRegionId ? 'border-primary bg-primary/[0.04]' : 'border-gray-100 bg-white'"
                @click="selectRegion(region.id)"
              >
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ region.name }}</p>
                  <p class="mt-0.5 text-xs text-gray-400">{{ buildSubLabel(region) }}</p>
                </div>
                <button
                  type="button"
                  class="shrink-0 text-lg leading-none text-amber-400 transition-colors"
                  @click.stop="handleToggleFavorite(region.id)"
                >
                  ★
                </button>
              </div>
            </template>
          </div>

          <!-- 전체 / 일반 지역 / 바다 포인트 탭 -->
          <div v-else class="flex flex-col gap-1.5">
            <div
              v-for="region in filteredRegions"
              :key="region.id"
              class="flex cursor-pointer items-center gap-3 rounded-card border px-4 py-3 transition-all"
              :class="region.id === selectedRegionId ? 'border-primary bg-primary/[0.04]' : 'border-gray-100 bg-white'"
              @click="selectRegion(region.id)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900">{{ region.name }}</p>
                <p class="mt-0.5 text-xs text-gray-400">{{ buildSubLabel(region) }}</p>
              </div>
              <button
                type="button"
                class="shrink-0 text-lg leading-none transition-colors"
                :class="isFavorite(region.id) ? 'text-amber-400' : 'text-gray-300'"
                @click.stop="handleToggleFavorite(region.id)"
              >
                {{ isFavorite(region.id) ? '★' : '☆' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { findRegionById, REGIONS } from '../data/regions.js'

const PICKER_TABS = ['전체', '일반 지역', '바다 포인트', '자주 가는 지역']

const props = defineProps({
  open: { type: Boolean, default: false },
  selectedRegionId: { type: String, default: null },
  favoriteRegionIds: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:open', 'select', 'toggle-favorite'])

const query = ref('')
const activeTab = ref('전체')
const searchInputRef = ref(null)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    query.value = ''
    activeTab.value = '전체'
    await nextTick()
    searchInputRef.value?.focus()
  }
)

const favoriteRegions = computed(() =>
  props.favoriteRegionIds.map((regionId) => findRegionById(regionId)).filter(Boolean)
)

const searchedRegions = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return []

  return REGIONS.filter((region) => {
    const haystack = [
      region.name,
      region.province,
      region.category,
      region.areaLabel,
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
  if (activeTab.value === '일반 지역') return REGIONS.filter((r) => r.type === 'land')
  if (activeTab.value === '바다 포인트') return REGIONS.filter((r) => r.type === 'sea')
  return REGIONS
})

function buildSubLabel(region) {
  if (region.type === 'sea') {
    return region.areaLabel ? `${region.areaLabel} · 바다 포인트` : '바다 포인트'
  }
  return region.province || region.category
}

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

function handleToggleFavorite(regionId) {
  emit('toggle-favorite', regionId)
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
