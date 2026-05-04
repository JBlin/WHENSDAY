<template>
  <div class="min-h-screen flex flex-col" style="background: linear-gradient(160deg, #ede9fe 0%, #e0e7ff 45%, #f8f8ff 100%)">
    <div class="flex flex-col items-center px-6 pb-8 pt-10 text-center">
      <div class="flex items-center justify-center gap-2">
        <span class="font-brand text-[28px] font-black tracking-[0.24em] text-primary">WHENSDAY</span>
        <img src="../img/calendar.svg" class="h-6 w-6 -translate-y-1 uppercase" alt="" />
      </div>
      <p class="mt-3 text-[14px] text-gray-500 leading-[1.5]">
        "난 아무때나 돼" 금지❌, 진짜 되는 날만 찍으셈 🎯
      </p>
    </div>

    <div class="flex-1 rounded-t-3xl bg-white px-5 pb-8 pt-8 shadow-sm">
      <h2 class="mb-6 text-lg font-bold text-gray-900">약속 만들기</h2>

      <form class="flex flex-col gap-5" @submit.prevent="create">
        <div>
          <label class="mb-1.5 block text-sm font-semibold text-gray-700">약속 제목</label>
          <input
            v-model="title"
            type="text"
            maxlength="50"
            placeholder="예: 늘 가던 그곳, 늘 먹던 걸로"
            class="h-12 w-full rounded-btn border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-semibold text-gray-700">약속 지역</label>
          <p class="mb-2 text-xs text-gray-400">
            동네 이름을 입력하면 해당 지역 기준의 날씨 정보를 볼 수 있어요.
          </p>

          <div class="relative">
            <input
              v-model="regionQuery"
              type="text"
              placeholder="동, 시, 구 이름을 입력해 주세요"
              class="h-12 w-full rounded-btn border border-gray-200 bg-gray-50 px-4 pr-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              @input="handleRegionInput"
              @focus="handleRegionFocus"
              @keydown.enter.prevent
            />

            <button
              v-if="regionQuery || selectedRegion"
              type="button"
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition hover:text-gray-600"
              aria-label="지역 선택 초기화"
              @click="clearRegion"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div v-if="resolvedRegion" class="mt-2">
            <p class="text-xs font-semibold text-primary/80">
              약속 지역 · {{ getRegionDisplayName(resolvedRegion) }}
            </p>
            <p v-if="getRegionResultNote(resolvedRegion)" class="mt-1 text-[11px] text-gray-400">
              {{ getRegionResultNote(resolvedRegion) }}
            </p>
          </div>

          <div
            v-if="showRegionResults"
            class="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <p
              v-if="regionSearchLoading"
              class="px-4 py-4 text-center text-sm text-gray-500"
            >
              지역을 찾는 중이에요.
            </p>
            <button
              v-for="region in regionResults"
              :key="region.code"
              type="button"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
              :class="region.code === selectedRegion?.legalDongCode ? 'bg-primary/[0.04]' : ''"
              @click="handleRegionSelect(region)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900">
                  {{ region.fullName }}
                </p>
                <p v-if="getRegionResultNote(region.selection)" class="mt-1 text-xs text-gray-400">
                  {{ getRegionResultNote(region.selection) }}
                </p>
              </div>
            </button>

            <p
              v-if="!regionSearchLoading && !regionResults.length"
              class="px-4 py-4 text-center text-sm text-gray-500"
            >
              검색 결과가 없어요.
            </p>
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-semibold text-gray-700">날짜 범위</label>
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-btn border border-gray-200 bg-gray-50 px-4 py-3 text-left outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            @click="rangePickerVisible = true"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold" :class="hasDateRange ? 'text-gray-800' : 'text-gray-400'">
                {{ dateRangeLabel }}
              </p>
              <p class="mt-0.5 text-xs text-gray-400">{{ dateRangeHint }}</p>
            </div>
            <span class="shrink-0 rounded-[8px] bg-primary-light px-2.5 py-1.5 text-xs font-semibold text-primary">
              선택
            </span>
          </button>
          <p class="mt-1.5 text-xs text-gray-400">최대 60일 범위까지 설정할 수 있어요.</p>
        </div>

        <p v-if="errorMsg" class="whitespace-pre-line text-sm font-medium text-red-500">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="mt-2 h-12 w-full rounded-btn bg-primary text-base font-bold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span v-if="submitting">만드는 중...</span>
          <span v-else>약속 만들기</span>
        </button>
      </form>

      <div class="mt-10 border-t border-gray-100 pt-8">
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">How It Works</h3>
        <div class="flex flex-col gap-3">
          <div v-for="step in steps" :key="step.icon" class="flex items-start gap-3">
            <span class="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl font-semibold leading-none text-center">
              {{ step.icon }}
            </span>
            <div>
              <p class="text-sm font-semibold text-gray-800">{{ step.title }}</p>
              <p class="mt-0.5 text-xs text-gray-500">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Transition name="share-sheet">
    <div v-if="shareVisible" class="fixed inset-0 z-50 flex flex-col justify-end">
      <div class="absolute inset-0 bg-black/40" @click="closeShareSheet" />

      <div class="share-panel relative rounded-t-2xl bg-white px-5 pb-8 pt-4 safe-bottom">
        <div class="mb-4 flex justify-center">
          <div class="h-1 w-10 rounded-full bg-gray-200" />
        </div>

        <div class="mb-5">
          <h3 class="text-lg font-bold text-gray-900">약속 링크가 만들어졌어요</h3>
          <p class="mt-2 text-sm text-gray-500">
            먼저 방장님의 가능한 날짜를 체크해 주세요.
            <br />
            방장님도 참여자로 결과에 포함돼요.
          </p>
        </div>

        <div class="mb-4 rounded-card border border-gray-200 bg-gray-50 p-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">공유 링크</p>
          <p class="mt-2 truncate font-mono text-xs text-gray-600">{{ shareUrl }}</p>
        </div>

        <button
          type="button"
          class="mb-3 h-12 w-full rounded-btn bg-primary text-sm font-bold text-white transition-all duration-150 active:scale-95"
          @click="goToMeeting"
        >
          내 가능 날짜 체크하기
        </button>

        <button
          type="button"
          class="mb-5 h-12 w-full rounded-btn border border-gray-200 text-sm font-semibold text-gray-700 transition-all duration-150 active:scale-95"
          @click="copyShareLink"
        >
          {{ copiedShareLink ? '✅ 복사됐어요!' : '🔗 공유 링크 복사' }}
        </button>

        <div v-if="hostCode" class="rounded-card border border-gray-200 bg-gray-50 p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-gray-400">방장 권한 복구 안내</p>
          <p class="mt-2 text-sm font-semibold text-gray-700">방장 코드: {{ hostCode }}</p>
          <p class="mt-2 text-xs leading-5 text-gray-500">
            기기를 바꾸거나 권한이 사라진 경우 이 코드로 방장 권한을 복구할 수 있어요.
          </p>
        </div>
      </div>
    </div>
  </Transition>

  <DateRangeSheet
    :open="rangePickerVisible"
    :start-date="dateFrom"
    :end-date="dateTo"
    :min-date="today"
    :max-date="maxDate"
    :max-range-days="60"
    @update:open="rangePickerVisible = $event"
    @update:start-date="dateFrom = $event"
    @update:end-date="dateTo = $event"
  />

  <ToastMessage :visible="toastVisible" :message="toastMsg" :type="toastType" />
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import DateRangeSheet from '../components/DateRangeSheet.vue'
import ToastMessage from '../components/ToastMessage.vue'
import { DEFAULT_REGION } from '../data/regions.js'
import { storeHostToken } from '../lib/hostAccess.js'
import { formatDisplayDate, formatLocalDate, rangeDayCount } from '../lib/meetingUtils.js'
import { mapLegalDongToRegionSelection } from '../lib/regionMapping.ts'
import { buildKakaoShareText, buildMeetingUrl, copyText } from '../lib/share.js'
import { useMeetingStore } from '../stores/meeting.js'

let legalDongCache = null
let regionSearchTimeoutId = 0
let regionSearchRequestId = 0

const router = useRouter()
const store = useMeetingStore()

const title = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const regionQuery = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const rangePickerVisible = ref(false)
const selectedRegion = ref(null)
const showRegionResults = ref(false)
const regionResults = ref([])
const regionSearchLoading = ref(false)

const shareVisible = ref(false)
const shareUrl = ref('')
const shareText = ref('')
const copiedShareText = ref(false)
const copiedShareLink = ref(false)
const hostCode = ref('')
const createdId = ref('')
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref('success')

const today = formatLocalDate(new Date())
const resolvedRegion = computed(() => selectedRegion.value)

const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return formatLocalDate(date)
})

const hasDateRange = computed(() => Boolean(dateFrom.value && dateTo.value))

const dateRangeLabel = computed(() => {
  if (!hasDateRange.value) return '시작일과 종료일을 한 번에 선택해 주세요'
  return `${formatDisplayDate(dateFrom.value, { withWeekday: false })} ~ ${formatDisplayDate(dateTo.value, { withWeekday: false })}`
})

const dateRangeHint = computed(() => {
  if (!hasDateRange.value) return '달력을 열어서 범위를 고르고 완료하면 돼요.'
  return `${rangeDayCount(dateFrom.value, dateTo.value)}일 범위가 선택됐어요.`
})

async function loadLegalDongs() {
  if (legalDongCache) return legalDongCache

  const module = await import('../data/legalDongs.json')
  legalDongCache = Array.isArray(module.default) ? module.default : []
  return legalDongCache
}

function normalizeRegionSearchText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function normalizeLooseRegionText(value) {
  return normalizeRegionSearchText(value).replace(/\s+/g, '')
}

function getCompactRegionText(value) {
  return normalizeLooseRegionText(value)
}

function getLegalDongSearchScore(legalDong, query, compactQuery) {
  const dong = normalizeRegionSearchText(legalDong.dong)
  const fullName = normalizeRegionSearchText(legalDong.fullName)
  const searchText = normalizeRegionSearchText(legalDong.searchText)
  const compactDong = getCompactRegionText(legalDong.dong)
  const compactFullName = getCompactRegionText(legalDong.fullName)
  const compactSearchText = getCompactRegionText(legalDong.searchText)

  if (
    dong.startsWith(query) ||
    fullName.startsWith(query) ||
    compactDong.startsWith(compactQuery) ||
    compactFullName.startsWith(compactQuery)
  ) {
    return 0
  }

  if (fullName.includes(query) || compactFullName.includes(compactQuery)) {
    return 1
  }

  if (searchText.includes(query) || compactSearchText.includes(compactQuery)) {
    return 2
  }

  return Number.POSITIVE_INFINITY
}

function buildRegionSearchResults(legalDongs, query) {
  const normalizedQuery = normalizeRegionSearchText(query)
  const compactQuery = getCompactRegionText(query)
  if (!normalizedQuery || !compactQuery) return []

  return legalDongs
    .map((legalDong, index) => ({
      legalDong,
      index,
      score: getLegalDongSearchScore(legalDong, normalizedQuery, compactQuery),
    }))
    .filter((item) => Number.isFinite(item.score))
    .sort((left, right) => {
      if (left.score !== right.score) return left.score - right.score
      if (left.legalDong.fullName.length !== right.legalDong.fullName.length) {
        return left.legalDong.fullName.length - right.legalDong.fullName.length
      }
      return left.index - right.index
    })
    .slice(0, 20)
    .map(({ legalDong }) => ({
      ...legalDong,
      selection: mapLegalDongToRegionSelection(legalDong),
    }))
}

function queueRegionSearch(query) {
  clearTimeout(regionSearchTimeoutId)

  if (!query) {
    regionSearchLoading.value = false
    regionResults.value = []
    return
  }

  regionSearchTimeoutId = setTimeout(async () => {
    const requestId = ++regionSearchRequestId
    regionSearchLoading.value = true

    try {
      const legalDongs = await loadLegalDongs()
      if (requestId !== regionSearchRequestId) return
      regionResults.value = buildRegionSearchResults(legalDongs, query)
    } catch (error) {
      console.error('[WHENSDAY] failed to load legal dong data', error)
      if (requestId !== regionSearchRequestId) return
      regionResults.value = []
    } finally {
      if (requestId === regionSearchRequestId) {
        regionSearchLoading.value = false
      }
    }
  }, 180)
}

function handleRegionInput() {
  const trimmedQuery = regionQuery.value.trim()
  showRegionResults.value = trimmedQuery.length > 0

  if (
    selectedRegion.value &&
    normalizeLooseRegionText(trimmedQuery) !==
      normalizeLooseRegionText(getRegionDisplayName(selectedRegion.value))
  ) {
    selectedRegion.value = null
  }

  queueRegionSearch(trimmedQuery)
}

function handleRegionFocus() {
  const trimmedQuery = regionQuery.value.trim()
  if (trimmedQuery) {
    showRegionResults.value = true
    queueRegionSearch(trimmedQuery)
  }
}

function handleRegionSelect(region) {
  selectedRegion.value = region.selection
  regionQuery.value = region.fullName
  showRegionResults.value = false
}

function clearRegion() {
  clearTimeout(regionSearchTimeoutId)
  selectedRegion.value = null
  regionQuery.value = ''
  showRegionResults.value = false
  regionSearchLoading.value = false
  regionResults.value = []
}

async function create() {
  errorMsg.value = ''

  if (!title.value.trim()) {
    errorMsg.value = '약속 제목을 입력해 주세요.'
    return
  }

  if (!dateFrom.value || !dateTo.value) {
    errorMsg.value = '날짜 범위를 선택해 주세요.'
    return
  }

  if (dateTo.value < dateFrom.value || rangeDayCount(dateFrom.value, dateTo.value) > 60) {
    errorMsg.value = '날짜 범위를 다시 선택해 주세요.'
    return
  }

  if (regionQuery.value.trim() && !resolvedRegion.value) {
    errorMsg.value = '검색 결과에서 지역을 선택해 주세요.'
    return
  }

  const regionToSave = resolvedRegion.value || DEFAULT_REGION
  console.log('[Whensday] selectedRegion:', selectedRegion.value)
  console.log('[Whensday] resolvedRegion:', resolvedRegion.value)

  submitting.value = true

  try {
    const meeting = await store.createMeeting(
      title.value.trim(),
      dateFrom.value,
      dateTo.value,
      regionToSave
    )

    createdId.value = meeting.id
    shareUrl.value = buildMeetingUrl(meeting.id)
    shareText.value = buildKakaoShareText({
      title: meeting.title,
      participantUrl: shareUrl.value,
    })
    hostCode.value = meeting.host_code
    storeHostToken(meeting.id, meeting.host_token)
    shareVisible.value = true
  } catch (error) {
    console.error('[WHENSDAY] failed to create meeting', error)
    errorMsg.value = error?.message || '요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

async function copyShareText() {
  try {
    await copyText(shareText.value)
    copiedShareText.value = true
    showToast('공유 문구를 복사했어요.')
    setTimeout(() => {
      copiedShareText.value = false
    }, 2000)
  } catch (error) {
    console.error('[WHENSDAY] failed to copy share text', error)
    showToast('복사에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error')
  }
}

async function copyShareLink() {
  try {
    await copyText(shareUrl.value)
    copiedShareLink.value = true
    showToast('링크를 복사했어요.')
    setTimeout(() => {
      copiedShareLink.value = false
    }, 2000)
  } catch (error) {
    console.error('[WHENSDAY] failed to copy share link', error)
    showToast('복사에 실패했어요.', 'error')
  }
}

function closeShareSheet() {
  shareVisible.value = false
}

function goToMeeting() {
  router.push(`/meeting/${createdId.value}`)
}

function showToast(message, type = 'success') {
  toastMsg.value = message
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}

function getRegionDisplayName(region) {
  return region?.regionDisplayName || region?.displayName || region?.name || ''
}

function getRegionParentName(region) {
  return region?.regionParentName || region?.parentName || getRegionDisplayName(region)
}

function getRegionResultNote(region) {
  if (!region) return ''

  const displayName = getRegionDisplayName(region)
  const parentName = getRegionParentName(region)
  const mappingNote = region.mappingNote || region.codeNote || ''
  const showParentHint =
    region.administrativeLevel !== 'city' ||
    parentName !== displayName ||
    region.supportsSeaInfo ||
    Boolean(mappingNote)

  if (!showParentHint) return ''

  if (region.supportsSeaInfo) {
    return `${parentName} 기준 · 바다 정보 제공`
  }

  return `${parentName} 기준 날씨 제공`
}

const steps = [
  { icon: '1', title: '날짜 범위 설정', desc: '만날 수 있는 기간을 먼저 정해요.' },
  { icon: '2', title: '친구들에게 링크 공유', desc: '링크 하나만 보내서 가능한 날짜를 받아요.' },
  { icon: '3', title: '결과 확인 후 확정', desc: '결과 화면에서 추천 날짜를 보고 약속을 확정해요.' },
]
</script>

<style scoped>
.share-sheet-enter-active {
  transition: opacity 0.25s ease;
}

.share-sheet-leave-active {
  transition: opacity 0.2s ease;
}

.share-sheet-enter-from,
.share-sheet-leave-to {
  opacity: 0;
}

.share-sheet-enter-from .share-panel {
  transform: translateY(100%);
}

.share-sheet-enter-active .share-panel {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.share-sheet-leave-active .share-panel {
  transition: transform 0.2s ease-in;
}

.share-sheet-leave-to .share-panel {
  transform: translateY(100%);
}
</style>
