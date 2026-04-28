<template>
  <div class="min-h-screen bg-white flex flex-col">
    <header class="sticky top-0 z-10 bg-white px-5 pb-4 pt-5 shadow-sm">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="font-brand shrink-0 text-lg font-black uppercase tracking-widest text-primary">W</RouterLink>
        <div class="min-w-0 flex-1">
          <p v-if="store.meeting" class="truncate text-sm font-bold text-gray-900">{{ store.meeting.title }}</p>
          <p v-if="store.meeting?.region_name" class="mt-0.5 text-xs font-medium text-primary/80">약속 지역 · {{ store.meeting.region_name }}</p>
          <p class="mt-0.5 text-xs text-gray-400">
            <span v-if="store.loading">불러오는 중...</span>
            <span v-else-if="store.responses.length">현재 {{ store.responses.length }}명 참여 중</span>
            <span v-else>아직 아무도 참여하지 않았어요.</span>
          </p>
        </div>
        <RouterLink
          v-if="store.meeting && canViewResult"
          :to="`/meeting/${store.meeting.id}/result`"
          class="shrink-0 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary"
        >
          결과 보기
        </RouterLink>
        <span
          v-else-if="store.meeting"
          class="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-400"
        >
          투표 후 결과 공개
        </span>
      </div>
    </header>

    <div v-if="store.loading" class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p class="text-sm text-gray-400">불러오는 중...</p>
      </div>
    </div>

    <div v-else-if="store.error" class="flex flex-1 items-center justify-center px-5">
      <div class="text-center">
        <p class="mb-2 text-xl font-bold text-gray-800">약속을 찾을 수 없어요.</p>
        <p class="mt-1 text-sm text-gray-400">링크가 올바른지 다시 확인해 주세요.</p>
        <RouterLink to="/" class="mt-5 inline-block text-sm font-semibold text-primary">처음으로 가기</RouterLink>
      </div>
    </div>

    <div v-else-if="store.meeting" class="flex flex-1 flex-col" :class="isConfirmed ? 'pb-8' : 'pb-28'">
      <div v-if="submitted" class="border-b border-green-100 bg-green-50 px-5 py-3">
        <p class="text-sm font-medium text-green-700">제출이 완료됐어요. 결과 화면에서 바로 확인해 보세요.</p>
      </div>

      <div v-if="isConfirmed" class="flex-1 px-5 py-5">
        <div class="rounded-card border border-primary/15 bg-primary/[0.04] p-4">
          <p class="text-sm font-semibold text-primary">약속 날짜가 이미 확정됐어요</p>
          <p class="mt-2 text-xl font-bold text-gray-900">{{ confirmedDateLabel }}</p>
          <p class="mt-2 text-sm text-gray-500">
            확정된 약속이라 더 이상 날짜를 제출할 수 없어요.
            결과 화면에서 자세한 내용을 확인해 주세요.
          </p>
          <RouterLink
            :to="`/meeting/${store.meeting.id}/result`"
            class="mt-4 inline-flex h-11 items-center justify-center rounded-btn bg-primary px-4 text-sm font-bold text-white transition-all duration-150 active:scale-95"
          >
            결과 화면 보기
          </RouterLink>
        </div>
      </div>

      <div v-else class="flex flex-1 flex-col gap-5 px-5 py-5">
        <div v-if="isHost" class="rounded-card border border-amber-200 bg-amber-50 p-4">
          <p class="text-sm font-semibold text-amber-800">방장님도 가능한 날짜를 선택해 주세요.</p>
          <p class="mt-2 text-sm text-amber-700">방장님 응답도 다른 참여자와 똑같이 결과 집계에 포함돼요.</p>
        </div>

        <div class="rounded-card bg-white p-4 shadow-sm">
          <label class="mb-2 block text-sm font-semibold text-gray-700">이름</label>
          <input
            v-model="name"
            type="text"
            maxlength="20"
            placeholder="이름을 입력해 주세요"
            class="h-12 w-full rounded-btn border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div class="rounded-card bg-white p-4 shadow-sm">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-gray-700">가능한 날짜 선택</h3>
            <span class="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
              {{ selectedDates.length }}일 선택
            </span>
          </div>
          <p class="mb-3 text-xs font-medium text-gray-400">약속 지역 · {{ meetingRegionName }}</p>
          <CalendarInfoToggle
            v-model="selectedInfoType"
            :sea-available="seaAvailable"
            @sea-unavailable="showToast(seaUnavailableMessage, 'info')"
          />
          <CalendarPicker
            class="mt-4"
            v-model="selectedDates"
            :date-from="store.meeting.date_from"
            :date-to="store.meeting.date_to"
            :tide-labels="calendarTideLabels"
          />
          <CalendarInfoList
            :selected-type="selectedInfoType"
            :items="visibleForecastItems"
            :detail-items="visibleFishingItems"
            :selected-dates="selectedDates"
            :loading="forecastLoading"
            :error="forecastError"
            :empty-message="forecastEmptyMessage"
            :tide-rows="visibleTideRows"
            :show-tide-limit-message="showTideLimitMessage"
            :sea-available="seaAvailable"
            :fishing-gubun="store.meeting?.fishing_gubun || ''"
            :fishing-place-name="store.meeting?.fishing_place_name || ''"
          />
        </div>
      </div>

      <div
        v-if="!isConfirmed"
        class="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-[430px] border-t border-gray-100 bg-white px-5 pt-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] shadow-[0_-8px_24px_rgba(15,23,42,0.04)]"
      >
        <button
          :disabled="!name.trim() || !selectedDates.length || submitting"
          class="h-12 w-full rounded-btn bg-primary text-base font-bold text-white shadow-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:opacity-100"
          @click="submit"
        >
          <span v-if="submitting">제출 중...</span>
          <span v-else-if="!name.trim()">이름을 먼저 입력해 주세요</span>
          <span v-else-if="!selectedDates.length">날짜를 하나 이상 선택해 주세요</span>
          <span v-else>{{ isHost ? '내 가능 날짜 제출하기' : '가능한 날짜 제출하기' }}</span>
        </button>
      </div>
    </div>

    <ToastMessage :visible="toastVisible" :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CalendarPicker from '../components/CalendarPicker.vue'
import CalendarInfoList from '../components/CalendarInfoList.vue'
import CalendarInfoToggle from '../components/CalendarInfoToggle.vue'
import ToastMessage from '../components/ToastMessage.vue'
import { DEFAULT_REGION } from '../data/regions.js'
import {
  fetchFishingForecast,
  filterFishingItemsByRange,
  SEA_UNAVAILABLE_MESSAGE,
} from '../lib/fishing.js'
import {
  fetchForecast,
  filterForecastItemsByRange,
  formatForecastDate,
} from '../lib/forecast.js'
import { hasStoredHostAccess, storeHostResponseName } from '../lib/hostAccess.js'
import { formatDisplayDate } from '../lib/meetingUtils.js'
import { hasVotedForMeeting, markMeetingAsVoted } from '../lib/voteAccess.js'
import { supabase } from '../lib/supabase.js'
import { buildTideLabelMap, buildTideTable, isTideRangeSupported } from '../lib/tide.js'
import { useMeetingStore } from '../stores/meeting.js'

const route = useRoute()
const router = useRouter()
const store = useMeetingStore()

const name = ref('')
const selectedDates = ref([])
const submitting = ref(false)
const submitted = ref(false)
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref('success')
const hasVoted = ref(hasVotedForMeeting(route.params.id))
const selectedInfoType = ref('')
const forecastItems = ref([])
const fishingItems = ref([])
const forecastLoading = ref(false)
const forecastError = ref(false)
const forecastEmptyMessage = ref('')

const isHost = computed(() => hasStoredHostAccess(route.params.id, store.meeting?.host_token || ''))
const isConfirmed = computed(() => store.meeting?.status === 'confirmed' && store.meeting?.confirmed_date)
const confirmedDateLabel = computed(() => formatDisplayDate(store.meeting?.confirmed_date || ''))
const canViewResult = computed(() => submitted.value || hasVoted.value || isConfirmed.value || isHost.value)
// TODO: If host-side region editing is added later, keep the meeting record as the single source of truth here.
const meetingRegionName = computed(() => store.meeting?.region_name || DEFAULT_REGION.name)
const seaAvailable = computed(() =>
  Boolean(store.meeting?.fishing_place_name && store.meeting?.fishing_gubun)
)
const seaUnavailableMessage = SEA_UNAVAILABLE_MESSAGE
const visibleForecastItems = computed(() =>
  filterForecastItemsByRange(forecastItems.value, store.meeting?.date_from, store.meeting?.date_to)
)
const visibleFishingItems = computed(() =>
  filterFishingItemsByRange(fishingItems.value, store.meeting?.date_from, store.meeting?.date_to)
)
const tideRangeSupported = computed(() =>
  isTideRangeSupported(store.meeting?.date_from, store.meeting?.date_to, 60)
)
const visibleTideRows = computed(() => {
  if (selectedInfoType.value !== 'sea' || !seaAvailable.value || !tideRangeSupported.value) return []

  return buildTideTable(store.meeting?.date_from, store.meeting?.date_to).map((row) => ({
    ...row,
    dateLabel: formatForecastDate(row.date),
  }))
})
const showTideLimitMessage = computed(
  () => selectedInfoType.value === 'sea' && seaAvailable.value && !tideRangeSupported.value
)
const calendarTideLabels = computed(() =>
  selectedInfoType.value === 'sea' && seaAvailable.value ? buildTideLabelMap(visibleTideRows.value) : {}
)

let realtimeChannel = null
let forecastRequestId = 0
const forecastCache = new Map()

onMounted(async () => {
  if (route.query.needVote === '1') {
    showToast('결과는 투표를 마친 뒤에 볼 수 있어요.', 'info')
    router.replace(`/meeting/${route.params.id}`)
  }

  store.reset()
  await store.fetchMeeting(route.params.id)

  if (!store.error) {
    await store.fetchResponses(route.params.id)
    subscribeRealtime()
  }
})

onUnmounted(() => {
  realtimeChannel?.unsubscribe()
})

watch(
  [
    selectedInfoType,
    () => store.meeting?.weather_region_code,
    () => store.meeting?.temperature_region_code,
    () => store.meeting?.fishing_place_name,
    () => store.meeting?.fishing_gubun,
    () => store.meeting?.date_from,
    () => store.meeting?.date_to,
  ],
  async ([type, weatherRegionCode, temperatureRegionCode, fishingPlaceName, fishingGubun, dateFrom, dateTo]) => {
    const requestId = ++forecastRequestId

    if (!type || !dateFrom || !dateTo) {
      forecastItems.value = []
      fishingItems.value = []
      forecastLoading.value = false
      forecastError.value = false
      forecastEmptyMessage.value = ''
      return
    }

    if (type === 'sea' && !seaAvailable.value) {
      forecastItems.value = []
      fishingItems.value = []
      forecastLoading.value = false
      forecastError.value = false
      forecastEmptyMessage.value = ''
      return
    }

    const cacheKey =
      type === 'weather'
        ? `${type}:${weatherRegionCode || DEFAULT_REGION.weatherRegionCode}`
        : type === 'temperature'
          ? `${type}:${temperatureRegionCode || DEFAULT_REGION.temperatureRegionCode}`
          : `${type}:${fishingGubun || ''}:${fishingPlaceName || ''}`

    if (forecastCache.has(cacheKey)) {
      const cached = forecastCache.get(cacheKey)
      forecastItems.value = cached.items
      fishingItems.value = cached.detailItems || []
      forecastLoading.value = false
      forecastError.value = false
      forecastEmptyMessage.value = cached.message
      return
    }

    forecastLoading.value = true
    forecastError.value = false

    try {
      const payload =
        type === 'sea'
          ? await fetchFishingForecast({
              placeName: fishingPlaceName,
              gubun: fishingGubun,
            })
          : await fetchForecast({
              type,
              regId: type === 'weather' ? weatherRegionCode : temperatureRegionCode,
            })

      if (requestId !== forecastRequestId) return

      const items = type === 'sea' ? [] : Array.isArray(payload?.items) ? payload.items : []
      const detailItems = type === 'sea' ? (Array.isArray(payload?.items) ? payload.items : []) : []
      const message = payload?.message || ''
      forecastCache.set(cacheKey, { items, detailItems, message })
      forecastItems.value = items
      fishingItems.value = detailItems
      forecastEmptyMessage.value = message
    } catch (error) {
      console.error('[WHENSDAY] failed to fetch forecast info', error)

      if (requestId !== forecastRequestId) return

      forecastItems.value = []
      fishingItems.value = []
      forecastError.value = true
      forecastEmptyMessage.value = ''
    } finally {
      if (requestId === forecastRequestId) {
        forecastLoading.value = false
      }
    }
  },
  { immediate: true }
)

function subscribeRealtime() {
  realtimeChannel = supabase
    .channel(`meeting-${route.params.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'responses', filter: `meeting_id=eq.${route.params.id}` },
      () => {
        store.fetchResponses(route.params.id)
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meetings', filter: `id=eq.${route.params.id}` },
      () => {
        store.fetchMeeting(route.params.id)
      }
    )
    .subscribe()
}

function showToast(message, type = 'success') {
  toastMsg.value = message
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2800)
}

async function submit() {
  if (!name.value.trim()) return

  submitting.value = true

  try {
    const normalizedName = name.value.trim()

    await store.submitResponse(route.params.id, normalizedName, selectedDates.value, {
      isHost: isHost.value,
    })

    if (isHost.value) {
      storeHostResponseName(route.params.id, normalizedName)
    }

    submitted.value = true
    hasVoted.value = true
    markMeetingAsVoted(route.params.id)
    showToast('제출이 완료됐어요. 결과 화면으로 이동할게요.')
    await router.push({
      path: `/meeting/${route.params.id}/result`,
      query: { submitted: '1' },
    })
  } catch (error) {
    console.error('[WHENSDAY] failed to submit response', error)
    showToast(error?.message || '요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
