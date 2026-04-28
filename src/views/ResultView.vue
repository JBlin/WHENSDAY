<template>
  <div class="min-h-screen bg-white flex flex-col">
    <header class="bg-white px-5 pt-5 pb-4 shadow-sm sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="text-lg font-black tracking-widest text-primary uppercase shrink-0">S</RouterLink>
        <div class="flex-1 min-w-0">
          <p v-if="store.meeting" class="text-sm font-bold text-gray-900 truncate">{{ store.meeting.title }}</p>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="text-xs text-gray-400">{{ store.responses.length }}명 참여</span>
            <span v-if="store.responses.length" class="w-1 h-1 bg-gray-300 rounded-full" />
            <span v-if="store.responses.length" class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span v-if="store.responses.length" class="text-xs text-green-600 font-medium">실시간 업데이트</span>
          </div>
        </div>
      </div>
    </header>

    <div v-if="store.loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p class="text-sm text-gray-400">불러오는 중...</p>
      </div>
    </div>

    <div v-else-if="store.error" class="flex-1 flex items-center justify-center px-5">
      <div class="text-center">
        <p class="text-xl font-bold text-gray-800 mb-2">약속을 찾을 수 없어요</p>
        <RouterLink to="/" class="mt-4 inline-block text-primary font-semibold text-sm">처음으로 가기</RouterLink>
      </div>
    </div>

    <div v-else-if="store.meeting" class="flex-1 flex flex-col pb-8">
      <div v-if="!store.responses.length" class="flex-1 flex items-center justify-center px-8 py-12">
        <div class="text-center">
          <p class="text-gray-700 font-semibold text-base">아직 아무도 참여하지 않았어요.</p>
          <p class="text-sm text-gray-400 mt-1">친구들에게 링크를 공유해보세요.</p>
        </div>
      </div>

      <div v-else class="px-5 py-5 flex flex-col gap-5">
        <BestDateCard :responses="store.responses" :total-participants="store.responses.length" />

        <div class="flex items-center gap-3 flex-wrap">
          <span class="text-xs text-gray-500 font-medium">범례:</span>
          <div v-for="item in legend" :key="item.label" class="flex items-center gap-1.5">
            <div class="w-4 h-4 rounded" :style="{ backgroundColor: item.color }" />
            <span class="text-xs text-gray-500">{{ item.label }}</span>
          </div>
        </div>

        <div class="bg-white rounded-card p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">날짜별 가능 인원</h3>
          <HeatmapCalendar
            :date-from="store.meeting.date_from"
            :date-to="store.meeting.date_to"
            :responses="store.responses"
            :total-participants="store.responses.length"
            @select="openSheet"
          />
        </div>

        <div class="bg-white rounded-card p-4 shadow-sm">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">참여자 목록</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="response in store.responses"
              :key="response.id"
              class="px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full"
            >
              {{ response.name }}
            </span>
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
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BestDateCard from '../components/BestDateCard.vue'
import HeatmapCalendar from '../components/HeatmapCalendar.vue'
import ParticipantSheet from '../components/ParticipantSheet.vue'
import ToastMessage from '../components/ToastMessage.vue'
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

let realtimeChannel = null

onMounted(async () => {
  if (!hasVotedForMeeting(route.params.id)) {
    router.replace({
      path: `/meeting/${route.params.id}`,
      query: { needVote: '1' },
    })
    return
  }

  store.reset()
  await store.fetchMeeting(route.params.id)

  if (!store.error) {
    await store.fetchResponses(route.params.id)
    subscribeRealtime()
  }

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
    .subscribe()
}

function openSheet(date) {
  selectedDate.value = date
  sheetVisible.value = true
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
