<template>
  <div class="min-h-screen flex flex-col" style="background: linear-gradient(160deg, #ede9fe 0%, #e0e7ff 45%, #f8f8ff 100%)">
    <div class="px-5 pt-5">
      <div class="flex items-center gap-1">
        <span class="font-brand text-base font-black tracking-widest text-primary tracking-tight">WHENSDAY</span>
        <img src="../img/calendar.svg" class="h-4 w-4 uppercase" alt="" />
      </div>
    </div>

    <div class="flex flex-col items-center px-6 pb-10 pt-10 text-center">
      <p class="font-brand text-[24px] font-bold text-[#4338ca] leading-tight tracking-normal">
        일정 조율,<br /> 링크 하나로 끝내세요
      </p>
      <p class="mt-3 text-[15px] text-gray-500 leading-[1.4]">
        가능한 날짜를 모아<br />가장 적합한 날을 한눈에 확인할 수 있어요.
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
            placeholder="예: 강남 저녁 약속"
            class="h-12 w-full rounded-btn border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            required
          />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-semibold text-gray-700">약속 지역</label>
          <p class="mb-2 text-xs text-gray-400">
            지역을 입력하면 해당 지역의 날씨 정보를 함께 볼 수 있어요.
          </p>

          <div class="relative">
            <input
              v-model="regionQuery"
              type="text"
              placeholder="도시나 지역명을 입력해 주세요"
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

          <p v-if="resolvedRegion" class="mt-2 text-xs font-semibold text-primary/80">
            약속 지역 · {{ resolvedRegion.name }}
          </p>

          <div
            v-if="showRegionResults"
            class="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <button
              v-for="region in regionResults"
              :key="region.id"
              type="button"
              class="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
              :class="region.id === selectedRegionId ? 'bg-primary/[0.04]' : ''"
              @click="handleRegionSelect(region)"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900">
                  {{ region.province }} · {{ region.name }}
                </p>
                <p v-if="region.supportsSeaInfo" class="mt-1 text-xs text-gray-400">
                  바다 정보 제공
                </p>
              </div>
            </button>

            <p
              v-if="!regionResults.length"
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
            <span class="shrink-0 rounded-full bg-primary-light px-2.5 py-1.5 text-xs font-semibold text-primary">
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
          @click="copyShareText"
        >
          {{ copiedShareText ? '복사 완료!' : '공유 문구 복사하기' }}
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
import { DEFAULT_REGION, findRegionById, searchRegions } from '../data/regions.js'
import { storeHostToken } from '../lib/hostAccess.js'
import { formatDisplayDate, formatLocalDate, rangeDayCount } from '../lib/meetingUtils.js'
import { buildKakaoShareText, buildMeetingUrl, copyText } from '../lib/share.js'
import { useMeetingStore } from '../stores/meeting.js'

const router = useRouter()
const store = useMeetingStore()

const title = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const regionQuery = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const rangePickerVisible = ref(false)
const selectedRegionId = ref(null)
const showRegionResults = ref(false)

const shareVisible = ref(false)
const shareUrl = ref('')
const shareText = ref('')
const copiedShareText = ref(false)
const hostCode = ref('')
const createdId = ref('')
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref('success')

const today = formatLocalDate(new Date())
const selectedRegion = computed(() =>
  selectedRegionId.value ? findRegionById(selectedRegionId.value) : null
)
const regionResults = computed(() => searchRegions(regionQuery.value))
const resolvedRegion = computed(() => {
  if (selectedRegion.value) return selectedRegion.value

  const query = regionQuery.value.trim()
  if (!query) return null

  const normalizedQuery = normalizeLooseRegionText(query)
  const exactMatch = regionResults.value.find((region) =>
    [region.name, region.province, ...(region.aliases || [])].some(
      (value) => normalizeLooseRegionText(value) === normalizedQuery
    )
  )

  if (exactMatch) return exactMatch
  if (regionResults.value.length === 1) return regionResults.value[0]
  return null
})

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

function handleRegionInput() {
  const trimmedQuery = regionQuery.value.trim()
  showRegionResults.value = trimmedQuery.length > 0

  if (selectedRegion.value && trimmedQuery !== selectedRegion.value.name) {
    selectedRegionId.value = null
  }
}

function handleRegionFocus() {
  if (regionQuery.value.trim()) {
    showRegionResults.value = true
  }
}

function handleRegionSelect(region) {
  selectedRegionId.value = region.id
  regionQuery.value = region.name
  showRegionResults.value = false
}

function clearRegion() {
  selectedRegionId.value = null
  regionQuery.value = ''
  showRegionResults.value = false
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

function normalizeLooseRegionText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
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
