<template>
  <div class="min-h-screen bg-white flex flex-col">
    <header class="bg-white px-5 pt-5 pb-4 shadow-sm sticky top-0 z-10">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="text-lg font-black tracking-widest text-primary uppercase shrink-0">S</RouterLink>
        <div class="flex-1 min-w-0">
          <p v-if="store.meeting" class="text-sm font-bold text-gray-900 truncate">{{ store.meeting.title }}</p>
          <p class="text-xs text-gray-400 mt-0.5">
            <span v-if="store.loading">불러오는 중...</span>
            <span v-else-if="store.responses.length">현재 {{ store.responses.length }}명 참여 중</span>
            <span v-else>아직 아무도 참여하지 않았어요.</span>
          </p>
        </div>
        <RouterLink
          v-if="store.meeting && canViewResult"
          :to="`/meeting/${store.meeting.id}/result`"
          class="text-xs text-primary font-semibold shrink-0 py-1.5 px-3 bg-primary-light rounded-full"
        >
          결과 보기
        </RouterLink>
        <span
          v-else-if="store.meeting"
          class="text-[11px] text-gray-400 font-semibold shrink-0 py-1.5 px-3 bg-gray-100 rounded-full"
        >
          투표 후 결과 공개
        </span>
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
        <p class="text-xl font-bold text-gray-800 mb-2">약속을 찾을 수 없어요.</p>
        <p class="text-sm text-gray-400 mt-1">링크가 올바른지 다시 확인해 주세요.</p>
        <RouterLink to="/" class="mt-5 inline-block text-primary font-semibold text-sm">처음으로 가기</RouterLink>
      </div>
    </div>

    <div v-else-if="store.meeting" class="flex-1 flex flex-col pb-28">
      <div v-if="submitted" class="bg-green-50 border-b border-green-100 px-5 py-3">
        <p class="text-sm text-green-700 font-medium">제출 완료! 같은 이름으로 다시 제출하면 내용이 업데이트돼요.</p>
      </div>

      <div class="px-5 py-5 flex flex-col gap-5 flex-1">
        <div class="bg-white rounded-card p-4 shadow-sm">
          <label class="text-sm font-semibold text-gray-700 mb-2 block">이름</label>
          <input
            v-model="name"
            type="text"
            maxlength="20"
            placeholder="이름을 입력해 주세요"
            class="w-full h-12 px-4 border border-gray-200 rounded-btn text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-gray-50"
          />
        </div>

        <div class="bg-white rounded-card p-4 shadow-sm">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-700">가능한 날짜 선택</h3>
            <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{{ selectedDates.length }}일 선택</span>
          </div>
          <CalendarPicker
            :date-from="store.meeting.date_from"
            :date-to="store.meeting.date_to"
            v-model="selectedDates"
          />
        </div>
      </div>

      <div class="fixed bottom-0 left-0 right-0 z-20 max-w-[430px] mx-auto bg-white border-t border-gray-100 px-5 py-4 safe-bottom shadow-[0_-8px_24px_rgba(15,23,42,0.04)]">
        <button
          @click="submit"
          :disabled="!name.trim() || !selectedDates.length || submitting"
          class="w-full h-12 bg-primary text-white font-bold rounded-btn text-base shadow-sm active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="submitting">제출 중...</span>
          <span v-else-if="!name.trim()">이름을 먼저 입력해 주세요</span>
          <span v-else-if="!selectedDates.length">날짜를 하나 이상 선택해 주세요</span>
          <span v-else>제출하기</span>
        </button>
      </div>
    </div>

    <ToastMessage :visible="toastVisible" :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CalendarPicker from '../components/CalendarPicker.vue'
import ToastMessage from '../components/ToastMessage.vue'
import { hasVotedForMeeting, markMeetingAsVoted } from '../lib/voteAccess.js'
import { supabase } from '../lib/supabase.js'
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

const canViewResult = computed(() => submitted.value || hasVoted.value)

let realtimeChannel = null

onMounted(async () => {
  if (route.query.needVote === '1') {
    showToast('결과는 투표를 완료한 뒤에 볼 수 있어요.', 'info')
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
    await store.submitResponse(route.params.id, name.value.trim(), selectedDates.value)
    submitted.value = true
    hasVoted.value = true
    markMeetingAsVoted(route.params.id)
    showToast('제출 완료! 결과 화면으로 이동할게요.')
    setTimeout(() => router.push(`/meeting/${route.params.id}/result`), 1500)
  } catch (error) {
    showToast(error?.message || '제출에 실패했어요. 다시 시도해 주세요.', 'error')
  } finally {
    submitting.value = false
  }
}
</script>
