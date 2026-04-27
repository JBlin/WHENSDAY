<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-light to-white flex flex-col">
    <div class="flex flex-col items-center pt-20 pb-10 px-6">
      <h1 class="text-4xl font-black tracking-widest text-primary uppercase">WHENSDAY</h1>
      <p class="mt-2 text-gray-500 text-sm font-medium">우리 진짜 언제 볼까?</p>
    </div>

    <div class="flex-1 bg-white rounded-t-3xl px-5 pt-8 pb-8 shadow-sm">
      <h2 class="text-lg font-bold text-gray-900 mb-6">약속 만들기</h2>

      <form @submit.prevent="create" class="flex flex-col gap-5">
        <div>
          <label class="text-sm font-semibold text-gray-700 mb-1.5 block">약속 제목</label>
          <input
            v-model="title"
            type="text"
            maxlength="50"
            placeholder="주말 강남 약속 어때?"
            class="w-full h-12 px-4 border border-gray-200 rounded-btn text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-gray-50"
            required
          />
        </div>

        <div>
          <label class="text-sm font-semibold text-gray-700 mb-1.5 block">날짜 범위</label>
          <div class="flex items-center gap-2">
            <input
              v-model="dateFrom"
              type="date"
              :min="today"
              :max="dateTo || maxDate"
              class="flex-1 h-12 px-3 border border-gray-200 rounded-btn text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-gray-50"
              required
              @change="clampDateTo"
            />
            <span class="text-gray-400 font-medium">~</span>
            <input
              v-model="dateTo"
              type="date"
              :min="dateFrom || today"
              :max="maxDateTo"
              class="flex-1 h-12 px-3 border border-gray-200 rounded-btn text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition bg-gray-50"
              required
            />
          </div>
          <p class="text-xs text-gray-400 mt-1.5">최대 60일 범위까지 설정할 수 있어요.</p>
        </div>

        <p v-if="errorMsg" class="text-sm text-red-500 font-medium whitespace-pre-line">{{ errorMsg }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full h-12 bg-primary text-white font-bold rounded-btn text-base shadow-sm active:scale-95 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          <span v-if="submitting">만드는 중...</span>
          <span v-else>약속 만들기</span>
        </button>
      </form>

      <div class="mt-10 pt-8 border-t border-gray-100">
        <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">How It Works</h3>
        <div class="flex flex-col gap-3">
          <div v-for="step in steps" :key="step.icon" class="flex items-start gap-3">
            <span class="text-xl shrink-0">{{ step.icon }}</span>
            <div>
              <p class="text-sm font-semibold text-gray-800">{{ step.title }}</p>
              <p class="text-xs text-gray-500 mt-0.5">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <Transition name="share-sheet">
    <div v-if="shareVisible" class="fixed inset-0 z-50 flex flex-col justify-end" @click.self="goToMeeting">
      <div class="absolute inset-0 bg-black/40" @click="goToMeeting" />

      <div class="share-panel relative bg-white rounded-t-2xl px-5 pt-4 pb-8 safe-bottom">
        <div class="flex justify-center mb-4">
          <div class="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div class="flex items-center gap-2 mb-1">
          <span class="text-base font-bold text-primary">WHENSDAY</span>
          <h3 class="text-base font-bold text-gray-900">약속이 만들어졌어요</h3>
        </div>
        <p class="text-sm text-gray-500 mb-5">링크를 친구들에게 공유해보세요.</p>

        <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-btn px-3 py-3 mb-4">
          <span class="flex-1 text-xs text-gray-600 truncate font-mono">{{ shareUrl }}</span>
          <button
            @click="copyLink"
            class="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-150"
            :class="copied ? 'bg-green-100 text-green-700' : 'bg-primary-light text-primary'"
          >
            {{ copied ? '복사됨' : '복사' }}
          </button>
        </div>

        <div class="flex flex-col gap-3">
          <button
            @click="copyLink"
            class="w-full h-12 bg-primary text-white font-bold rounded-btn text-sm active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
          >
            <span>{{ copied ? '복사 완료!' : '링크 복사하기' }}</span>
          </button>
          <button
            @click="goToMeeting"
            class="w-full h-12 border border-gray-200 text-gray-700 font-semibold rounded-btn text-sm active:scale-95 transition-all duration-150"
          >
            내 날짜 바로 입력하기
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMeetingStore } from '../stores/meeting.js'

const router = useRouter()
const store = useMeetingStore()

const title = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const submitting = ref(false)
const errorMsg = ref('')

const shareVisible = ref(false)
const shareUrl = ref('')
const copied = ref(false)
const createdId = ref('')

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const today = formatLocalDate(new Date())

const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return formatLocalDate(date)
})

const maxDateTo = computed(() => {
  if (!dateFrom.value) return maxDate.value
  const date = new Date(dateFrom.value + 'T00:00:00')
  date.setDate(date.getDate() + 59)
  return formatLocalDate(date)
})

function clampDateTo() {
  if (dateTo.value && dateTo.value < dateFrom.value) dateTo.value = dateFrom.value
  if (dateTo.value && dateTo.value > maxDateTo.value) dateTo.value = maxDateTo.value
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

  submitting.value = true

  try {
    const meeting = await store.createMeeting(title.value.trim(), dateFrom.value, dateTo.value)
    createdId.value = meeting.id
    shareUrl.value = `${window.location.origin}/meeting/${meeting.id}`
    shareVisible.value = true
  } catch (error) {
    console.error('[WHENSDAY] failed to create meeting', error)
    errorMsg.value = error?.message || '약속 만들기에 실패했어요. 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Clipboard API is not available in every browser context.
  }
}

function goToMeeting() {
  router.push(`/meeting/${createdId.value}`)
}

const steps = [
  { icon: '1', title: '날짜 범위 설정', desc: '약속을 조율할 기간을 먼저 골라요.' },
  { icon: '2', title: '친구들에게 링크 공유', desc: '카카오톡이나 문자로 바로 보낼 수 있어요.' },
  { icon: '3', title: '겹치는 날짜 확인', desc: '모두 가능한 날을 한눈에 확인해요.' },
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
