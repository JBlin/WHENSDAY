<template>
  <Transition name="backdrop">
    <div
      v-if="visible"
      class="fixed inset-0 z-40 bg-black/40"
      @click="emit('close')"
    />
  </Transition>

  <Transition name="sheet">
    <div
      v-if="visible"
      class="fixed bottom-0 left-0 right-0 z-50 max-w-[430px] mx-auto bg-white rounded-t-2xl safe-bottom max-h-[70vh] flex flex-col"
    >
      <div class="flex justify-center pt-3 pb-2 shrink-0">
        <div class="w-10 h-1 bg-gray-200 rounded-full" />
      </div>

      <div class="px-5 pb-4 overflow-y-auto">
        <h3 class="text-base font-bold text-gray-900 mb-1">{{ formattedDate }}</h3>
        <p class="text-xs text-gray-500 mb-4">{{ names.length }}명 가능</p>

        <div v-if="names.length" class="flex flex-wrap gap-2">
          <span
            v-for="name in names"
            :key="name"
            class="px-3 py-1.5 bg-primary-light text-primary text-sm font-medium rounded-full"
          >
            {{ name }}
          </span>
        </div>
        <div v-else class="text-sm text-gray-400 text-center py-6">이 날짜를 선택한 참여자가 없어요.</div>

        <div v-if="unavailableNames.length" class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-400 mb-2">참여 불가</p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="name in unavailableNames"
              :key="name"
              class="px-3 py-1.5 bg-gray-100 text-gray-400 text-sm font-medium rounded-full line-through"
            >
              {{ name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  date: { type: String, default: '' },
  responses: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const DAY_KO = ['일', '월', '화', '수', '목', '금', '토']

const formattedDate = computed(() => {
  if (!props.date) return ''
  const date = new Date(props.date + 'T00:00:00')
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_KO[date.getDay()]})`
})

const names = computed(() =>
  props.responses
    .filter((response) => response.available_dates?.includes(props.date))
    .map((response) => response.name)
)

const unavailableNames = computed(() =>
  props.responses
    .filter((response) => !response.available_dates?.includes(props.date))
    .map((response) => response.name)
)
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.sheet-enter-active {
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.sheet-leave-active {
  transition: transform 0.2s ease-in;
}

.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
