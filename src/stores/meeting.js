import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  assertSupabaseConfigured,
  SUPABASE_CONFIG_ERROR_MESSAGE,
  supabase,
} from '../lib/supabase.js'

const GENERIC_REQUEST_ERROR_MESSAGE = '요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
const NOT_FOUND_ERROR_MESSAGE = '약속 정보를 찾을 수 없어요.'
const CONFIRMED_MEETING_ERROR_MESSAGE = '이미 확정된 약속이라 더 이상 제출할 수 없어요.'
const INVALID_HOST_CODE_ERROR_MESSAGE = '방장 코드가 맞지 않아요.'

function createUserFacingError(message = GENERIC_REQUEST_ERROR_MESSAGE) {
  return new Error(message)
}

function createHostCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const array = crypto.getRandomValues(new Uint32Array(length))

  return Array.from(array, (value) => chars[value % chars.length]).join('')
}

export const useMeetingStore = defineStore('meeting', () => {
  const meeting = ref(null)
  const responses = ref([])
  const loading = ref(false)
  const error = ref(null)

  function logSupabaseError(context, details) {
    console.error(`[WHENSDAY] ${context}`, details)
  }

  function buildSupabaseError(err, options = {}) {
    const { notFoundMessage = NOT_FOUND_ERROR_MESSAGE } = options

    if (!err) return createUserFacingError()
    if (err.message === SUPABASE_CONFIG_ERROR_MESSAGE) return createUserFacingError()
    if (err.code === 'PGRST116') return createUserFacingError(notFoundMessage)

    return createUserFacingError()
  }

  async function fetchMeeting(id) {
    loading.value = true
    error.value = null

    try {
      assertSupabaseConfigured()

      const { data, error: err } = await supabase
        .from('meetings')
        .select('id,title,date_from,date_to,host_token,status,confirmed_date,created_at')
        .eq('id', id)
        .single()

      if (err) throw err

      meeting.value = data
      return data
    } catch (err) {
      logSupabaseError('failed to fetch meeting', err)
      error.value = buildSupabaseError(err).message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchResponses(meetingId) {
    error.value = null

    try {
      assertSupabaseConfigured()

      const { data, error: err } = await supabase
        .from('responses')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at')

      if (err) throw err

      responses.value = data || []
      return responses.value
    } catch (err) {
      logSupabaseError('failed to fetch responses', err)
      error.value = buildSupabaseError(err).message
      responses.value = []
      return []
    }
  }

  async function createMeeting(title, dateFrom, dateTo) {
    assertSupabaseConfigured()

    const newMeeting = {
      id: crypto.randomUUID(),
      title,
      date_from: dateFrom,
      date_to: dateTo,
      host_token: crypto.randomUUID(),
      host_code: createHostCode(),
      status: 'open',
      confirmed_date: null,
    }

    try {
      const { error: err } = await supabase.from('meetings').insert(newMeeting)

      if (err) throw err

      return newMeeting
    } catch (err) {
      logSupabaseError('failed to create meeting', err)
      throw buildSupabaseError(err)
    }
  }

  async function submitResponse(meetingId, name, availableDates) {
    assertSupabaseConfigured()

    if (meeting.value?.status === 'confirmed') {
      throw createUserFacingError(CONFIRMED_MEETING_ERROR_MESSAGE)
    }

    try {
      const { error: err } = await supabase
        .from('responses')
        .upsert(
          { meeting_id: meetingId, name, available_dates: availableDates },
          { onConflict: 'meeting_id,name' }
        )

      if (err) throw err
    } catch (err) {
      logSupabaseError('failed to submit response', err)
      throw buildSupabaseError(err)
    }
  }

  async function confirmMeeting(meetingId, confirmedDate) {
    assertSupabaseConfigured()

    try {
      const { data, error: err } = await supabase
        .from('meetings')
        .update({
          status: 'confirmed',
          confirmed_date: confirmedDate,
        })
        .eq('id', meetingId)
        .select('*')
        .single()

      if (err) throw err

      meeting.value = data
      return data
    } catch (err) {
      logSupabaseError('failed to confirm meeting', err)
      throw buildSupabaseError(err)
    }
  }

  async function recoverHostAccess(meetingId, hostCode) {
    assertSupabaseConfigured()

    try {
      const { data, error: err } = await supabase
        .from('meetings')
        .select('host_token')
        .eq('id', meetingId)
        .eq('host_code', hostCode.trim().toUpperCase())
        .single()

      if (err) throw err

      return data?.host_token || ''
    } catch (err) {
      logSupabaseError('failed to recover host access', err)

      if (err?.code === 'PGRST116') {
        throw createUserFacingError(INVALID_HOST_CODE_ERROR_MESSAGE)
      }

      throw buildSupabaseError(err)
    }
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
    confirmMeeting,
    recoverHostAccess,
    reset,
  }
})
