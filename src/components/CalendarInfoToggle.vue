<template>
  <div class="mt-4">
    <p class="mb-2 text-sm font-semibold text-gray-700">날짜 고를 때 참고해 보세요</p>

    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="option in FORECAST_TYPE_OPTIONS"
        :key="option.id"
        type="button"
        class="shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all"
        :class="badgeClass(option.id)"
        @click="toggleType(option.id)"
      >
        {{ option.label }}
      </button>
    </div>

    <p v-if="showSeaNotice" class="mt-3 text-xs leading-5 text-gray-500">
      이 지역은 바다 정보를 제공하지 않아요.
      <br />
      바다 정보를 보려면 약속 지역을 바다 포인트로 선택해 주세요.
    </p>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { FORECAST_TYPE_OPTIONS } from '../lib/forecastConfig.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  seaAvailable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'sea-unavailable'])

const showSeaNotice = ref(false)

watch(
  () => props.seaAvailable,
  (value) => {
    if (value) {
      showSeaNotice.value = false
    }
  }
)

function toggleType(type) {
  if (type === 'sea' && !props.seaAvailable) {
    showSeaNotice.value = true
    emit('sea-unavailable')
    return
  }

  showSeaNotice.value = false
  const nextType = props.modelValue === type ? '' : type
  emit('update:modelValue', nextType)
}

function badgeClass(type) {
  if (type === 'sea' && !props.seaAvailable) {
    return 'border-gray-200 bg-gray-100 text-gray-400'
  }

  return props.modelValue === type
    ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
    : 'border-gray-200 bg-white text-gray-500'
}
</script>
