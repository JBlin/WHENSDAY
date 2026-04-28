<template>
  <div class="min-h-screen bg-white flex flex-col">
    <header class="sticky top-0 z-10 bg-white px-5 pb-4 pt-5 shadow-sm">
      <div class="flex items-center gap-3">
        <RouterLink to="/" class="font-brand shrink-0 text-lg font-black uppercase tracking-widest text-primary">W</RouterLink>
        <div class="min-w-0 flex-1">
          <p v-if="store.meeting" class="truncate text-sm font-bold text-gray-900">{{ store.meeting.title }}</p>
          <p class="mt-0.5 text-xs text-gray-400">방장 전용 관리 화면</p>
        </div>
        <RouterLink
          v-if="store.meeting"
          :to="`/meeting/${store.meeting.id}/result`"
          class="shrink-0 rounded-full bg-primary-light px-3 py-1.5 text-xs font-semibold text-primary"
        >
          결과 보기
        </RouterLink>
      </div>
    </header>

    <div v-if="store.loading" class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p class="text-sm text-gray-400">불러오는 중...</p>
      </div>
    </div>

    <div v-else-if="store.error || accessError" class="flex flex-1 items-center justify-center px-5">
      <div class="text-center">
        <p class="mb-2 text-xl font-bold text-gray-800">{{ accessError || '방장 화면을 열 수 없어요.' }}</p>
        <p class="text-sm text-gray-400">링크가 올바른지 다시 확인해 주세요.</p>
        <RouterLink to="/" class="mt-5 inline-block text-sm font-semibold text-primary">처음으로 가기</RouterLink>
      </div>
    </div>

    <div v-else-if="store.meeting" class="flex-1 px-5 py-5 pb-8">
      <div class="flex flex-col gap-5">
        <div class="rounded-card border border-amber-200 bg-amber-50 p-4">
          <p class="text-sm font-semibold text-amber-700">방장 링크 안내</p>
          <p class="mt-2 text-sm text-amber-800">이 화면은 방장 링크로만 열 수 있어요. 약속 확정과 관리에 필요한 링크이니 외부에 공유하지 마세요.</p>
        </div>

        <div v-if="isConfirmed" class="rounded-card border border-primary/15 bg-primary/[0.04] p-4">
          <p class="text-sm font-semibold text-primary">현재 확정된 날짜</p>
          <p class="mt-2 text-xl font-bold text-gray-900">{{ confirmedDateLabel }}</p>
          <p class="mt-2 text-sm text-gray-500">다른 추천 날짜를 누르면 다시 확정할 수도 있어요.</p>
        </div>

        <div v-if="!store.responses.length" class="rounded-card bg-white p-5 text-center shadow-sm">
          <p class="text-base font-semibold text-gray-700">아직 참여 응답이 없어요.</p>
          <p class="mt-1 text-sm text-gray-400">응답이 모이면 추천 날짜와 확정 버튼이 표시돼요.</p>
        </div>

        <div v-else class="rounded-card bg-white p-4 shadow-sm">
          <div class="mb-4">
            <h2 class="text-base font-bold text-gray-900">추천 날짜 TOP 3</h2>
            <p class="mt-1 text-sm text-gray-500">참여 인원이 많은 순서대로 보여드려요. 원하는 날짜를 바로 확정할 수 있어요.</p>
          </div>

          <div class="flex flex-col gap-3">
            <div
              v-for="(item, index) in recommendedDates"
              :key="item.date"
              class="rounded-card border px-4 py-4"
              :class="item.date === store.meeting.confirmed_date ? 'border-primary bg-primary/[0.03]' : 'border-gray-100 bg-white'"
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                  :class="index === 0 ? 'bg-primary text-white' : 'bg-primary-light text-primary'"
                >
                  {{ index + 1 }}
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-semibold text-gray-900">{{ formatDisplayDate(item.date) }}</p>
                    <span
                      v-if="item.date === store.meeting.confirmed_date"
                      class="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-semibold text-primary"
                    >
                      확정됨
                    </span>
                    <span
                      v-else-if="item.count === store.responses.length"
                      class="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700"
                    >
                      모두 가능
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-gray-500">{{ item.count }}명 / {{ store.responses.length }}명 가능</p>
                </div>

                <div class="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                  {{ getAvailabilityRatio(item.count, store.responses.length) }}%
                </div>
              </div>

              <button
                type="button"
                class="mt-4 h-11 w-full rounded-btn text-sm font-bold transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                :class="item.date === store.meeting.confirmed_date ? 'bg-gray-900 text-white' : 'bg-primary text-white'"
                :disabled="confirmingDate === item.date"
                @click="confirmDate(item.date)"
              >
                <span v-if="confirmingDate === item.date">확정하는 중...</span>
                <span v-else-if="item.date === store.meeting.confirmed_date">확정된 날짜예요</span>
                <span v-else-if="isConfirmed">이 날짜로 다시 확정하기</span>
                <span v-else>이 날로 확정하기</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ToastMessage :visible="toastVisible" :message="toastMsg" :type="toastType" />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import ToastMessage from '../components/ToastMessage.vue'
import {
  formatDisplayDate,
  getAvailabilityRatio,
  getTopRecommendedDates,
} from '../lib/meetingUtils.js'
import { supabase } from '../lib/supabase.js'
import { useMeetingStore } from '../stores/meeting.js'

const route = useRoute()
const store = useMeetingStore()

const accessError = ref('')
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref('success')
const confirmingDate = ref('')

const isConfirmed = computed(() => store.meeting?.status === 'confirmed' && store.meeting?.confirmed_date)
const confirmedDateLabel = computed(() => formatDisplayDate(store.meeting?.confirmed_date || ''))
const recommendedDates = computed(() => getTopRecommendedDates(store.responses, 3))

let realtimeChannel = null

onMounted(async () => {
  store.reset()
  const meeting = await store.fetchMeeting(route.params.id)

  if (!meeting || store.error) return

  const token = typeof route.query.token === 'string' ? route.query.token : ''

  if (!token || token !== meeting.host_token) {
    accessError.value = '방장 링크가 올바르지 않아요.'
    return
  }

  await store.fetchResponses(route.params.id)
  subscribeRealtime()
})

onUnmounted(() => {
  realtimeChannel?.unsubscribe()
})

function subscribeRealtime() {
  realtimeChannel = supabase
    .channel(`host-${route.params.id}`)
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

async function confirmDate(date) {
  confirmingDate.value = date

  try {
    await store.confirmMeeting(route.params.id, date)
    showToast(`${formatDisplayDate(date)}로 약속 날짜를 확정했어요.`)
  } catch (error) {
    console.error('[WHENSDAY] failed to confirm meeting', error)
    showToast(error?.message || '요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.', 'error')
  } finally {
    confirmingDate.value = ''
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
</script>
