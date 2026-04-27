import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase.js'

export const useMeetingStore = defineStore('meeting', () => {
  const meeting = ref(null)
  const responses = ref([])
  const loading = ref(false)
  const error = ref(null)

  function buildSupabaseError(err, table, action) {
    if (!err) {
      return new Error('알 수 없는 오류가 발생했어요.')
    }

    if (err.code === '42501') {
      const actionLabel = action === 'insert'
        ? 'insert'
        : action === 'update'
          ? 'update'
          : 'select'

      return new Error(
        `Supabase 권한 설정이 아직 완료되지 않았어요. ${table} 테이블의 ${actionLabel} 정책을 추가한 뒤 다시 시도해 주세요. README의 SQL 예시를 Supabase SQL Editor에서 실행하면 됩니다.`
      )
    }

    return new Error(err.message || 'Supabase 요청에 실패했어요.')
  }

  async function fetchMeeting(id) {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw buildSupabaseError(err, 'meetings', 'select')
      meeting.value = data
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchResponses(meetingId) {
    const { data, error: err } = await supabase
      .from('responses')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at')

    if (err) {
      error.value = buildSupabaseError(err, 'responses', 'select').message
      return
    }

    responses.value = data
  }

  async function createMeeting(title, dateFrom, dateTo) {
    const newMeeting = {
      id: crypto.randomUUID(),
      title,
      date_from: dateFrom,
      date_to: dateTo,
    }

    const { error: err } = await supabase
      .from('meetings')
      .insert(newMeeting)

    if (err) throw buildSupabaseError(err, 'meetings', 'insert')
    return newMeeting
  }

  async function submitResponse(meetingId, name, availableDates) {
    const { error: err } = await supabase
      .from('responses')
      .upsert(
        { meeting_id: meetingId, name, available_dates: availableDates },
        { onConflict: 'meeting_id,name' }
      )

    if (err) throw buildSupabaseError(err, 'responses', 'update')
  }

  function reset() {
    meeting.value = null
    responses.value = []
    error.value = null
  }

  return {
    meeting,
    responses,
    loading,
    error,
    fetchMeeting,
    fetchResponses,
    createMeeting,
    submitResponse,
    reset,
  }
})
