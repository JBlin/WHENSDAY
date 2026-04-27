<template>
  <Transition name="toast">
    <div
      v-if="visible"
      class="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-[360px] w-[90%]"
    >
      <div
        class="flex items-start gap-3 px-4 py-3 rounded-btn shadow-lg text-white text-sm font-medium"
        :class="bgClass"
      >
        <span class="text-base leading-none pt-0.5">{{ icon }}</span>
        <span class="whitespace-pre-line leading-snug">{{ message }}</span>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  message: { type: String, default: '' },
  type: { type: String, default: 'success' },
})

const bgClass = computed(() => ({
  'bg-green-500': props.type === 'success',
  'bg-red-500': props.type === 'error',
  'bg-gray-700': props.type === 'info',
}))

const icon = computed(() => ({
  success: 'OK',
  error: '!',
  info: 'i',
}[props.type]))
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-12px);
}
</style>
