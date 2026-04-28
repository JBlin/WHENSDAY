<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-light to-white flex flex-col">
    <div class="flex flex-col items-center px-6 pb-10 pt-20">
      <h1 class="font-brand text-4xl font-black tracking-widest text-primary uppercase">WHENSDAY</h1>
      <p class="mt-2 text-sm font-medium text-gray-500">우리 진짜 언제 볼까?</p>
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
          <div class="mb-1 flex items-center gap-2">
            <span class="font-brand text-base font-black uppercase tracking-wide text-primary">WHENSDAY</span>
            <h3 class="text-base font-bold text-gray-900">약속이 만들어졌어요</h3>
          </div>
          <p class="text-sm text-gray-500">참여자용 링크와 방장용 링크를 각각 복사해 두세요.</p>
        </div>

        <div class="mb-3 rounded-card border border-gray-200 bg-gray-50 p-3">
          <div class="mb-2 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">참여자용 링크</p>
              <p class="text-xs text-gray-400">친구들에게 보내는 링크예요.</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              :class="copiedTarget === 'participant' ? 'bg-green-100 text-green-700' : 'bg-primary-light text-primary'"
              @click="copyValue('participant', participantUrl, '참여자 링크를 복사했어요.')"
            >
              {{ copiedTarget === 'participant' ? '복사됨' : '복사' }}
            </button>
          </div>
          <p class="truncate font-mono text-xs text-gray-600">{{ participantUrl }}</p>
        </div>

        <div class="mb-3 rounded-card border border-amber-200 bg-amber-50 p-3">
          <div class="mb-2 flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">방장용 링크</p>
              <p class="text-xs text-amber-700">약속 확정과 관리에 필요해요. 꼭 따로 저장해 주세요.</p>
            </div>
            <button
              type="button"
              class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150"
              :class="copiedTarget === 'host' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
              @click="copyValue('host', hostUrl, '방장 링크를 복사했어요.')"
            >
              {{ copiedTarget === 'host' ? '복사됨' : '복사' }}
            </button>
          </div>
          <p class="truncate font-mono text-xs text-gray-600">{{ hostUrl }}</p>
        </div>

        <button
          type="button"
          class="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-btn border border-gray-200 text-sm font-semibold text-gray-700 transition-all duration-150 active:scale-95"
          @click="copyValue('kakao', kakaoShareText, '카카오톡 공유 문구를 복사했어요.')"
        >
          <span>{{ copiedTarget === 'kakao' ? '복사 완료!' : '카카오톡 공유 문구 복사' }}</span>
        </button>

        <div class="flex flex-col gap-3">
          <button
            type="button"
            class="h-12 w-full rounded-btn bg-primary text-sm font-bold text-white transition-all duration-150 active:scale-95"
            @click="goToMeeting"
          >
            참여자 화면 보기
          </button>
          <button
            type="button"
            class="h-12 w-full rounded-btn border border-gray-200 text-sm font-semibold text-gray-700 transition-all duration-150 active:scale-95"
            @click="goToHostManage"
          >
            방장 관리 열기
          </button>
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
import { formatDisplayDate, formatLocalDate, rangeDayCount } from '../lib/meetingUtils.js'
import { buildHostUrl, buildKakaoShareText, buildMeetingUrl, copyText } from '../lib/share.js'
import { useMeetingStore } from '../stores/meeting.js'

const router = useRouter()
const store = useMeetingStore()

const title = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const submitting = ref(false)
const errorMsg = ref('')
const rangePickerVisible = ref(false)

const shareVisible = ref(false)
const participantUrl = ref('')
const hostUrl = ref('')
const kakaoShareText = ref('')
const copiedTarget = ref('')
const createdId = ref('')
const createdHostToken = ref('')
const toastVisible = ref(false)
const toastMsg = ref('')
const toastType = ref('success')

const today = formatLocalDate(new Date())

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

  submitting.value = true

  try {
    const meeting = await store.createMeeting(title.value.trim(), dateFrom.value, dateTo.value)

    createdId.value = meeting.id
    createdHostToken.value = meeting.host_token
    participantUrl.value = buildMeetingUrl(meeting.id)
    hostUrl.value = buildHostUrl(meeting.id, meeting.host_token)
    kakaoShareText.value = buildKakaoShareText({
      title: meeting.title,
      participantUrl: participantUrl.value,
    })
    shareVisible.value = true
  } catch (error) {
    console.error('[WHENSDAY] failed to create meeting', error)
    errorMsg.value = error?.message || '요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
  } finally {
    submitting.value = false
  }
}

async function copyValue(target, value, successMessage) {
  try {
    await copyText(value)
    copiedTarget.value = target
    showToast(successMessage)
    setTimeout(() => {
      if (copiedTarget.value === target) copiedTarget.value = ''
    }, 2000)
  } catch (error) {
    console.error(`[WHENSDAY] failed to copy ${target}`, error)
    showToast('복사에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error')
  }
}

function closeShareSheet() {
  shareVisible.value = false
}

function goToMeeting() {
  router.push(`/meeting/${createdId.value}`)
}

function goToHostManage() {
  router.push({
    path: `/host/${createdId.value}`,
    query: { token: createdHostToken.value },
  })
}

function showToast(message, type = 'success') {
  toastMsg.value = message
  toastType.value = type
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2500)
}

const steps = [
  { icon: '1', title: '날짜 범위 설정', desc: '만날 수 있는 기간을 먼저 정해요.' },
  { icon: '2', title: '친구들에게 링크 공유', desc: '참여자 링크를 보내서 가능한 날짜를 받아요.' },
  { icon: '3', title: '겹치는 날짜 확인', desc: '방장 화면에서 추천 날짜를 보고 확정해요.' },
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
