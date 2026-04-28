import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  buildRegionMeetingFields,
  DEFAULT_REGION,
  getRegionFromMeetingRecord,
} from '../data/regions.js'
import {
  assertSupabaseConfigured,
  SUPABASE_CONFIG_ERROR_MESSAGE,
  supabase,
} from '../lib/supabase.js'

const GENERIC_REQUEST_ERROR_MESSAGE = '요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.'
const NOT_FOUND_ERROR_MESSAGE = '약속 정보를 찾을 수 없어요.'
const CONFIRMED_MEETING_ERROR_MESSAGE = '이미 확정된 약속이라 더 이상 제출할 수 없어요.'
const INVALID_HOST_CODE_ERROR_MESSAGE = '방장 코드가 맞지 않아요.'
const HOST_RECOVERY_UNAVAILABLE_ERROR_MESSAGE =
  '이 기기에서 만든 약속이 아니라면 아직 방장 권한을 복구할 수 없어요.'

function createUserFacingError(message = GENERIC_REQUEST_ERROR_MESSAGE) {
  return new Error(message)
}

function createHostCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const array = crypto.getRandomValues(new Uint32Array(length))

  return Array.from(array, (value) => chars[value % chars.length]).join('')
}

function getSupabaseErrorText(err) {
  return [err?.message, err?.details, err?.hint].filter(Boolean).join(' ').toLowerCase()
}

function hasSchemaMismatch(err, columns = []) {
  if (!err) return false

  if (err.code === 'PGRST204' || err.code === '42703') return true

  const text = getSupabaseErrorText(err)

  return columns.some((column) => text.includes(column.toLowerCase()) && text.includes('column'))
}

function normalizeMeetingRecord(data) {
  if (!data) return null

  const region = getRegionFromMeetingRecord(data)

  return {
    ...data,
    host_token: data.host_token || '',
    status: data.status || 'open',
    confirmed_date: data.confirmed_date || null,
    region_name: region.name,
    weather_region_code: region.weatherRegionCode,
    temperature_region_code: region.temperatureRegionCode,
    sea_area_code: region.seaAreaCode,
    fishing_place_name: region.fishingPlaceName,
    fishing_gubun: region.fishingGubun,
    region,
  }
}

function normalizeResponseRecord(data) {
  if (!data) return null

  return {
    ...data,
    available_dates: Array.isArray(data.available_dates) ? data.available_dates : [],
    is_host: Boolean(data.is_host),
  }
}

async function insertMeetingRecord(payload) {
  const { error: err } = await supabase.from('meetings').insert(payload)

  if (err) throw err
}

async function upsertResponseRecord(payload) {
  const { error: err } = await supabase
    .from('responses')
    .upsert(payload, { onConflict: 'meeting_id,name' })

  if (err) throw err
}

async function selectMeetingRecord(id) {
  const { data, error: err } = await supabase
    .from('meetings')
    .select('*')
    .eq('id', id)
    .single()

  if (err) throw err

  return data
}

export const useMeetingStore = defineStore('meeting', () => {
  const meeting = ref(null)
  const responses = ref([])
  const loading = ref(false)
  const error = ref(null)

  function logSupabaseError(context, details) {
    console.error(`[WHENSDAY] ${context}`, details)
  }

  function logCompatibilityFallback(context, details) {
    console.warn(`[WHENSDAY] ${context}`, details)
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

      let data

      data = await selectMeetingRecord(id)

      meeting.value = normalizeMeetingRecord(data)
      return meeting.value
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

      responses.value = (data || []).map((response) => normalizeResponseRecord(response))
      return responses.value
    } catch (err) {
      logSupabaseError('failed to fetch responses', err)
      error.value = buildSupabaseError(err).message
      responses.value = []
      return []
    }
  }

  async function createMeeting(title, dateFrom, dateTo, region = DEFAULT_REGION) {
    assertSupabaseConfigured()

    const regionFields = buildRegionMeetingFields(region)
    const baseMeeting = {
      id: crypto.randomUUID(),
      title,
      date_from: dateFrom,
      date_to: dateTo,
      host_token: crypto.randomUUID(),
      ...regionFields,
    }
    const hostCode = createHostCode()
    const attempts = [
      {
        payload: {
          ...baseMeeting,
          host_code: hostCode,
          status: 'open',
          confirmed_date: null,
        },
        result: {
          ...baseMeeting,
          host_code: hostCode,
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: [
          'host_code',
          'status',
          'confirmed_date',
          'region_name',
          'weather_region_code',
          'temperature_region_code',
          'sea_area_code',
          'fishing_place_name',
          'fishing_gubun',
        ],
      },
      {
        payload: {
          id: baseMeeting.id,
          title: baseMeeting.title,
          date_from: baseMeeting.date_from,
          date_to: baseMeeting.date_to,
          host_token: baseMeeting.host_token,
          host_code: hostCode,
          status: 'open',
          confirmed_date: null,
        },
        result: {
          ...baseMeeting,
          host_code: hostCode,
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: ['host_code', 'status', 'confirmed_date'],
      },
      {
        payload: {
          ...baseMeeting,
          status: 'open',
          confirmed_date: null,
        },
        result: {
          ...baseMeeting,
          host_code: '',
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: [
          'status',
          'confirmed_date',
          'region_name',
          'weather_region_code',
          'temperature_region_code',
          'sea_area_code',
          'fishing_place_name',
          'fishing_gubun',
        ],
      },
      {
        payload: {
          id: baseMeeting.id,
          title: baseMeeting.title,
          date_from: baseMeeting.date_from,
          date_to: baseMeeting.date_to,
          host_token: baseMeeting.host_token,
          status: 'open',
          confirmed_date: null,
        },
        result: {
          ...baseMeeting,
          host_code: '',
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: ['status', 'confirmed_date'],
      },
      {
        payload: {
          ...baseMeeting,
        },
        result: {
          ...baseMeeting,
          host_code: '',
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: [
          'host_token',
          'region_name',
          'weather_region_code',
          'temperature_region_code',
          'sea_area_code',
          'fishing_place_name',
          'fishing_gubun',
        ],
      },
      {
        payload: {
          id: baseMeeting.id,
          title: baseMeeting.title,
          date_from: baseMeeting.date_from,
          date_to: baseMeeting.date_to,
          host_token: baseMeeting.host_token,
        },
        result: {
          ...baseMeeting,
          host_code: '',
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: ['host_token'],
      },
      {
        payload: {
          id: baseMeeting.id,
          title: baseMeeting.title,
          date_from: baseMeeting.date_from,
          date_to: baseMeeting.date_to,
        },
        result: {
          ...baseMeeting,
          host_code: '',
          status: 'open',
          confirmed_date: null,
        },
        schemaColumns: [],
      },
    ]

    try {
      for (let index = 0; index < attempts.length; index += 1) {
        const attempt = attempts[index]

        try {
          await insertMeetingRecord(attempt.payload)
          return normalizeMeetingRecord(attempt.result)
        } catch (err) {
          const hasNextAttempt = index < attempts.length - 1

          if (!hasNextAttempt || !hasSchemaMismatch(err, attempt.schemaColumns)) {
            throw err
          }

          logCompatibilityFallback('meeting insert fallback: optional columns unavailable', err)
        }
      }

      return normalizeMeetingRecord(attempts[attempts.length - 1]?.result || null)
    } catch (err) {
      logSupabaseError('failed to create meeting', err)
      throw buildSupabaseError(err)
    }
  }

  async function submitResponse(meetingId, name, availableDates, options = {}) {
    assertSupabaseConfigured()

    if (meeting.value?.status === 'confirmed') {
      throw createUserFacingError(CONFIRMED_MEETING_ERROR_MESSAGE)
    }

    const normalizedName = name.trim()
    const payload = {
      meeting_id: meetingId,
      name: normalizedName,
      available_dates: availableDates,
    }

    try {
      if (options.isHost) {
        try {
          await upsertResponseRecord({
            ...payload,
            is_host: true,
          })
          return
        } catch (err) {
          if (!hasSchemaMismatch(err, ['is_host'])) {
            throw err
          }

          logCompatibilityFallback('response upsert fallback: is_host column unavailable', err)
        }
      }

      await upsertResponseRecord(payload)
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

      meeting.value = normalizeMeetingRecord(data)
      return meeting.value
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

      if (hasSchemaMismatch(err, ['host_code'])) {
        throw createUserFacingError(HOST_RECOVERY_UNAVAILABLE_ERROR_MESSAGE)
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
