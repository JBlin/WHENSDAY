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
const MEETING_SCHEMA_MISMATCH_ERROR_PREFIX =
  'Supabase meetings 테이블 컬럼이 앱과 맞지 않아요.'

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
  return getSchemaMismatchColumns(err, columns).length > 0
}

function getSchemaMismatchColumns(err, columns = []) {
  if (!err) return []

  const text = getSupabaseErrorText(err)
  return columns.filter(
    (column) => text.includes(column.toLowerCase()) && text.includes('column')
  )
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function pickFirstRegionText(...values) {
  for (const value of values) {
    const normalized = normalizeString(value)
    if (normalized) return normalized
  }

  return ''
}

function pickNullableRegionText(...values) {
  const normalized = pickFirstRegionText(...values)
  return normalized || null
}

function buildRegionDebugSnapshot(recordOrMeeting) {
  if (!recordOrMeeting) return null

  return {
    region_name: recordOrMeeting.region_name ?? null,
    weather_region_code: recordOrMeeting.weather_region_code ?? null,
    temperature_region_code: recordOrMeeting.temperature_region_code ?? null,
    fishing_place_name: recordOrMeeting.fishing_place_name ?? null,
    fishing_gubun: recordOrMeeting.fishing_gubun ?? null,
    region: recordOrMeeting.region
      ? {
          id: recordOrMeeting.region.id,
          name: recordOrMeeting.region.name,
          province: recordOrMeeting.region.province,
          weatherRegionCode: recordOrMeeting.region.weatherRegionCode,
          temperatureRegionCode: recordOrMeeting.region.temperatureRegionCode,
          fishingPlaceName: recordOrMeeting.region.fishingPlaceName,
          fishingGubun: recordOrMeeting.region.fishingGubun,
        }
      : null,
  }
}

function normalizeMeetingRecord(data) {
  if (!data) return null

  const region = getRegionFromMeetingRecord(data)
  const regionName = pickFirstRegionText(data.region_name, region.name, DEFAULT_REGION.name)
  const weatherRegionCode = pickFirstRegionText(
    data.weather_region_code,
    region.weatherRegionCode,
    DEFAULT_REGION.weatherRegionCode
  )
  const temperatureRegionCode = pickFirstRegionText(
    data.temperature_region_code,
    region.temperatureRegionCode,
    DEFAULT_REGION.temperatureRegionCode
  )
  const fishingPlaceName = pickNullableRegionText(data.fishing_place_name, region.fishingPlaceName)
  const fishingGubun = pickNullableRegionText(data.fishing_gubun, region.fishingGubun)
  const normalizedRegion = {
    ...region,
    name: regionName,
    weatherRegionCode,
    temperatureRegionCode,
    fishingPlaceName,
    fishingGubun,
    supportsSeaInfo: Boolean(fishingPlaceName && fishingGubun),
  }

  return {
    ...data,
    host_token: data.host_token || '',
    status: data.status || 'open',
    confirmed_date: data.confirmed_date || null,
    region_name: regionName,
    weather_region_code: weatherRegionCode,
    temperature_region_code: temperatureRegionCode,
    sea_area_code: normalizedRegion.seaAreaCode,
    fishing_place_name: fishingPlaceName,
    fishing_gubun: fishingGubun,
    region: normalizedRegion,
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
  const finalPayload = {
    ...payload,
  }

  console.log('[Whensday] meetings insert payload:', finalPayload)
  console.log('[Whensday] meetings insert payload keys:', Object.keys(finalPayload))

  const { error: err } = await supabase.from('meetings').insert([finalPayload])

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

function createMeetingInsertPayload(baseMeeting, hostCode) {
  return {
    ...baseMeeting,
    host_code: hostCode,
    status: 'open',
    confirmed_date: null,
  }
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

      let data

      data = await selectMeetingRecord(id)
      console.log('[Whensday] fetchMeeting detail row:', buildRegionDebugSnapshot(data))

      meeting.value = normalizeMeetingRecord(data)
      console.log(
        '[Whensday] fetchMeeting normalized region:',
        buildRegionDebugSnapshot(meeting.value)
      )
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

    const regionPayload = buildRegionMeetingFields(region)
    console.log('[Whensday] createMeeting region payload:', regionPayload)

    const baseMeeting = {
      id: crypto.randomUUID(),
      title,
      date_from: dateFrom,
      date_to: dateTo,
      host_token: crypto.randomUUID(),
      ...regionPayload,
    }
    const hostCode = createHostCode()
    const regionSchemaColumns = [
      'region_name',
      'weather_region_code',
      'temperature_region_code',
      'fishing_place_name',
      'fishing_gubun',
    ]
    const meetingSchemaColumns = [
      'host_token',
      'host_code',
      'status',
      'confirmed_date',
      ...regionSchemaColumns,
    ]
    const payload = createMeetingInsertPayload(baseMeeting, hostCode)
    console.log('[Whensday] createMeeting final payload:', payload)

    try {
      await insertMeetingRecord(payload)
      const insertedRecord = await selectMeetingRecord(baseMeeting.id)
      console.log('[Whensday] createMeeting inserted row:', buildRegionDebugSnapshot(insertedRecord))

      const normalizedMeeting = normalizeMeetingRecord(insertedRecord)
      console.log(
        '[Whensday] createMeeting normalized region:',
        buildRegionDebugSnapshot(normalizedMeeting)
      )

      return normalizedMeeting
    } catch (err) {
      logSupabaseError('failed to create meeting', err)

      const mismatchColumns = getSchemaMismatchColumns(err, meetingSchemaColumns)

      if (mismatchColumns.length) {
        throw createUserFacingError(
          `${MEETING_SCHEMA_MISMATCH_ERROR_PREFIX} ${mismatchColumns.join(', ')} 컬럼을 확인해 주세요.`
        )
      }

      if (err?.code === 'PGRST204' || err?.code === '42703') {
        throw createUserFacingError(
          `${MEETING_SCHEMA_MISMATCH_ERROR_PREFIX} host_token, host_code, status, confirmed_date, region_name, weather_region_code, temperature_region_code, fishing_place_name, fishing_gubun 컬럼을 확인해 주세요.`
        )
      }

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
