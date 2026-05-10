import { createServiceClient } from '@/lib/supabase/service'

export async function getCached<T>(
  source: string,
  key: string,
  ttlSeconds: number
): Promise<T | null> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('source_cache')
    .select('fetched_at, payload')
    .eq('source', source)
    .eq('cache_key', key)
    .maybeSingle()

  if (error || !data) return null

  const ageMs = Date.now() - new Date(data.fetched_at as string).getTime()
  if (ageMs > ttlSeconds * 1000) return null

  return data.payload as T
}

export async function setCached(
  source: string,
  key: string,
  payload: unknown
): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('source_cache').upsert(
    {
      source,
      cache_key: key,
      payload,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'source,cache_key' }
  )
}
