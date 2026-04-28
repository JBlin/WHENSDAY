<template>
  <div class="min-h-screen bg-white flex flex-col">
    <header class="sticky top-0 z-10 bg-white px-5 pb-4 pt-5 shadow-sm">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="font-brand shrink-0 text-lg font-black uppercase tracking-widest text-primary">W</RouterLink>
        <div class="min-w-0 flex-1">
          <p v-if="store.meeting" class="truncate text-sm font-bold text-gray-900">{{ store.meeting.title }}</p>
          <div class="mt-0.5 flex items-center gap-2">
            <span class="text-xs text-gray-400">{{ store.responses.length }}명 참여</span>
            <span v-if="store.responses.length" class="h-1 w-1 rounded-full bg-gray-300" />
            <span v-if="store.responses.length" class="relative flex h-2 w-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span v-if="store.responses.length" class="text-xs font-medium text-green-600">실시간 업데이트</span>
          </div>
        </div>
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
        <RouterLink to="/" class="mt-4 inline-block text-sm font-semibold text-primary">처음으로 가기</RouterLink>
      </div>
    </div>

    <div v-else-if="store.meeting" class="flex-1 px-5 py-5 pb-8">
      <div class="flex flex-col gap-5">
        <div v-if="isConfirmed" class="rounded-card border border-primary/15 bg-primary/[0.04] p-4">
          <p class="text-sm font-semibold text-primary">약속 날짜가 확정됐어요</p>
          <p class="mt-2 text-xl font-bold text-gray-900">{{ confirmedDateLabel }}</p>
          <p class="mt-2 text-sm text-gray-500">이제 이 날짜를 기준으로 약속을 준비하면 돼요.</p>
        </div>

        <div v-if="isConfirmed" class="rounded-card bg-white p-4 shadow-sm">
          <h3 class="text-base font-bold text-gray-900">캘린더에 저장하기</h3>
          <p class="mt-1 text-sm text-gray-500">시간 정보가 없어서 하루 종일 일정으로 저장돼요.</p>
          <div class="mt-4 flex flex-col gap-3">
            <button
              type="button"
              class="h-12 w-full rounded-btn bg-primary text-sm font-bold text-white transition-all duration-150 active:scale-95"
              @click="openGoogleCalendar"
            >
              구글 캘린더에 추가
            </button>
            <button
              type="button"
              class="h-12 w-full rounded-btn border border-gray-200 text-sm font-semibold text-gray-700 transition-all duration-150 active:scale-95"
              @click="downloadCalendarFile"
            >
              아이폰/기타 캘린더에 추가
            </button>
          </div>
        </div>

        <div v-if="store.responses.length" class="rounded-card bg-white p-4 shadow-sm">
          <p class="text-sm font-semibold text-primary">결론</p>
          <h2 class="mt-2 text-xl font-bold text-gray-900">{{ conclusionTitle }}</h2>
          <p class="mt-2 whitespace-pre-line text-sm text-gray-500">{{ conclusionDescription }}</p>
        </div>

        <div v-if="!store.responses.length" class="rounded-card bg-white p-5 text-center shadow-sm">
          <p class="text-base font-semibold text-gray-700">아직 아무도 참여하지 않았어요.</p>
          <p class="mt-1 text-sm text-gray-400">참여가 쌓이면 추천 날짜와 확정 후보를 바로 보여드릴게요.</p>
        </div>

        <BestDateCard
          v-if="store.responses.length"
          :responses="store.responses"
          :total-participants="store.responses.length"
          title="추천 날짜 TOP 3"
          description="참여 인원이 많은 순서대로 보여드려요."
        />

        <div v-if="store.responses.length" class="rounded-card bg-white p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700">날짜별 가능 인원</h3>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <div v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
              <div class="h-4 w-4 rounded" :style="{ backgroundColor: item.color }" />
              <span class="text-xs text-gray-500">{{ item.label }}</span>
            </div>
          </div>
          <div class="mt-4">
            <HeatmapCalendar
              :date-from="store.meeting.date_from"
              :date-to="store.meeting.date_to"
              :responses="store.responses"
              :total-participants="store.responses.length"
              @select="openSheet"
            />
          </div>
        </div>

        <div v-if="store.responses.length" class="rounded-card bg-white p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700">참여자별 선택 날짜</h3>
          <div class="mt-4 flex flex-col gap-3">
            <div
              v-for="response in participantSelections"
              :key="response.id"
              class="rounded-btn border border-gray-100 bg-gray-50 p-3"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-gray-900">{{ response.name }}</p>
                <span class="text-xs text-gray-400">{{ response.available_dates.length }}일 선택</span>
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="date in response.available_dates"
                  :key="`${response.id}-${date}`"
                  class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  {{ formatDisplayDate(date) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ParticipantSheet
      :visible="sheetVisible"
      :date="selectedDate"
      :responses="store.responses"
      @close="sheetVisible = false"
    />

    <ToastMessage :visible="toastVisible" :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BestDateCard from '../components/BestDateCard.vue'
import HeatmapCalendar from '../components/HeatmapCalendar.vue'
import ParticipantSheet from '../components/ParticipantSheet.vue'
import ToastMessage from '../components/ToastMessage.vue'
import { buildGoogleCalendarUrl, downloadIcsFile } from '../lib/calendar.js'
import {
  formatDisplayDate,
  getPerfectMatchDates,
  getTopRecommendedDates,
} from '../lib/meetingUtils.js'
import { buildMeetingUrl } from '../lib/share.js'
import { hasVotedForMeeting } from '../lib/voteAccess.js'
import { supabase } from '../lib/supabase.js'
import { useMeetingStore } from '../stores/meeting.js'

const route = useRoute()
const router = useRouter()
const store = useMeetingStore()

const sheetVisible = ref(false)
const selectedDate = ref('')
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref('success')

const isConfirmed = computed(() => store.meeting?.status === 'confirmed' && store.meeting?.confirmed_date)
const confirmedDateLabel = computed(() => formatDisplayDate(store.meeting?.confirmed_date || ''))
const recommendedDates = computed(() => getTopRecommendedDates(store.responses, 3))
const perfectMatchDates = computed(() => getPerfectMatchDates(store.responses, store.responses.length))
const topRecommendation = computed(() => recommendedDates.value[0] || null)

const conclusionTitle = computed(() => {
  if (perfectMatchDates.value.length) return '모두가 가능한 날을 찾았어요'
  return '모두가 가능한 날은 아직 없어요. 대신 가장 많이 가능한 날짜를 추천해드릴게요.'
})

const conclusionDescription = computed(() => {
  if (perfectMatchDates.value.length) {
    const firstPerfectDate = perfectMatchDates.value[0]
    return `${formatDisplayDate(firstPerfectDate.date)}에 ${store.responses.length}명이 모두 가능해요.\n아래 추천 날짜 TOP 3도 함께 확인해 보세요.`
  }

  if (!topRecommendation.value) {
    return '응답이 모이면 가장 많이 가능한 날짜를 정리해드릴게요.'
  }

  return `현재 가장 많이 가능한 날짜는 ${formatDisplayDate(topRecommendation.value.date)}이고, ${topRecommendation.value.count}명이 가능해요.`
})

const participantSelections = computed(() =>
  [...store.responses].map((response) => ({
    ...response,
    available_dates: [...(response.available_dates || [])].sort(),
  }))
)

const calendarDescription = computed(() => {
  if (!store.meeting || !isConfirmed.value) return ''

  return [
    'WHENSDAY에서 확정된 약속입니다.',
    `확정 날짜: ${confirmedDateLabel.value}`,
    `참여 링크: ${buildMeetingUrl(store.meeting.id)}`,
  ].join('\n')
})

let realtimeChannel = null

onMounted(async () => {
  store.reset()
  const meeting = await store.fetchMeeting(route.params.id)

  if (!meeting || store.error) return

  const canOpenResult = hasVotedForMeeting(route.params.id) || (meeting.status === 'confirmed' && meeting.confirmed_date)

  if (!canOpenResult) {
    router.replace({
      path: `/meeting/${route.params.id}`,
      query: { needVote: '1' },
    })
    return
  }

  await store.fetchResponses(route.params.id)
  subscribeRealtime()

  if (route.query.submitted === '1') {
    showToast('제출 완료! 결과를 바로 확인해 보세요.')
    router.replace(`/meeting/${route.params.id}/result`)
  }
})

onUnmounted(() => {
  realtimeChannel?.unsubscribe()
})

function subscribeRealtime() {
  realtimeChannel = supabase
    .channel(`result-${route.params.id}`)
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

function openSheet(date) {
  selectedDate.value = date
  sheetVisible.value = true
}

function openGoogleCalendar() {
  if (!store.meeting?.confirmed_date) return

  const url = buildGoogleCalendarUrl({
    title: store.meeting.title,
    date: store.meeting.confirmed_date,
    details: calendarDescription.value,
  })

  window.open(url, '_blank', 'noopener')
}

function downloadCalendarFile() {
  if (!store.meeting?.confirmed_date) return

  try {
    downloadIcsFile({
      title: store.meeting.title,
      date: store.meeting.confirmed_date,
      description: calendarDescription.value,
      fileName: `${store.meeting.title || 'whensday-meeting'}.ics`,
    })
    showToast('캘린더 파일을 다운로드했어요.')
  } catch (error) {
    console.error('[WHENSDAY] failed to create ics file', error)
    showToast('캘린더 파일을 만들지 못했어요. 잠시 후 다시 시도해 주세요.', 'error')
  }
}

function showToast(message, type = 'success') {
  toastMsg.value = message
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}

const legend = [
  { label: '0명', color: '#f3f4f6' },
  { label: '1-33%', color: '#bbf7d0' },
  { label: '34-66%', color: '#4ade80' },
  { label: '67-99%', color: '#16a34a' },
  { label: '100%', color: '#14532d' },
]
</script>
