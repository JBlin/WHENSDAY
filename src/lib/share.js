export function buildMeetingUrl(meetingId) {
  if (!meetingId || typeof window === 'undefined') {
    throw new Error('공유할 링크를 만들 수 없어요.')
  }

  return new URL(`/meeting/${meetingId}`, window.location.origin).toString()
}

export async function copyText(text) {
  if (!text) {
    throw new Error('복사할 링크가 없어요.')
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof window !== 'undefined' &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(text)
    return
  }

  if (typeof document === 'undefined') {
    throw new Error('이 브라우저에서는 자동 복사를 지원하지 않아요.')
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.top = '0'
  textArea.style.left = '0'
  textArea.style.opacity = '0'
  textArea.style.pointerEvents = 'none'

  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  textArea.setSelectionRange(0, text.length)

  const copied = document.execCommand('copy')
  document.body.removeChild(textArea)

  if (!copied) {
    throw new Error('링크 복사에 실패했어요. 다시 시도해 주세요.')
  }
}
