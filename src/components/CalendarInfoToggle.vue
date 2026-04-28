<template>
  <div class="mt-4">
    <p class="mb-2 text-sm font-semibold text-gray-700">날짜 고를 때 참고해 보세요</p>

    <div class="flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="option in FORECAST_TYPE_OPTIONS"
        :key="option.id"
        type="button"
        class="shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all"
        :class="
          modelValue === option.id
            ? 'border-primary bg-primary text-white shadow-sm shadow-primary/20'
            : 'border-gray-200 bg-white text-gray-500'
        "
        @click="toggleType(option.id)"
      >
        {{ option.label }}
      </button>
    </div>

    <div v-if="modelValue === 'sea'" class="mt-3">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">해역 선택</p>
      <div class="flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="area in seaAreaOptions"
          :key="area.id"
          type="button"
          class="shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all"
          :class="
            seaArea === area.id
              ? 'border-primary bg-primary-light text-primary'
              : 'border-gray-200 bg-white text-gray-500'
          "
          @click="emit('update:seaArea', area.id)"
        >
          {{ area.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DEFAULT_SEA_AREA, FORECAST_TYPE_OPTIONS, SEA_AREA_MAP } from '../lib/forecastConfig.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  seaArea: { type: String, default: DEFAULT_SEA_AREA },
})

const emit = defineEmits(['update:modelValue', 'update:seaArea'])

const seaAreaOptions = computed(() => Object.values(SEA_AREA_MAP))

function toggleType(type) {
  const nextType = props.modelValue === type ? '' : type
  emit('update:modelValue', nextType)

  if (nextType === 'sea' && !props.seaArea) {
    emit('update:seaArea', DEFAULT_SEA_AREA)
  }
}
</script>
