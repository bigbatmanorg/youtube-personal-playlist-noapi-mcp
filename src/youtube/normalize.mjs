function text(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value.text === 'string') return value.text;
  if (value && Array.isArray(value.runs)) return value.runs.map((run) => run.text || '').join('');
  return undefined;
}
function endpointPayload(value) {
  return value?.payload || value?.endpoint?.payload || value?.navigation_endpoint?.payload || value?.on_tap_endpoint?.payload || value?.renderer_context?.command_context?.on_tap?.payload;
}
function metadataTexts(value) {
  const rows = value?.metadata?.metadata_rows || value?.metadata?.metadataRows || [];
  return rows.flatMap((row) => (row.metadata_parts || row.metadataParts || []).map((part) => text(part?.text) || text(part)).filter(Boolean));
}
export function classifyPlaylist(id) {
  if (['LL', 'WL', 'YS'].includes(id)) return 'special';
  if (id?.startsWith('RD')) return 'system';
  return 'playlist';
}
export function normalizePlaylist(value) {
  const payload = endpointPayload(value) || {};
  const id = value?.content_id || value?.playlist_id || value?.playlistId || value?.id || payload.playlistId || (typeof payload.browseId === 'string' && payload.browseId.startsWith('VL') ? payload.browseId.slice(2) : undefined);
  const title = text(value?.metadata?.title) || text(value?.title) || (typeof value?.title === 'string' ? value.title : undefined);
  const info = value?.info || {};
  const items = metadataTexts(value);
  const combined = items.join(' · ');
  const countRaw = info.total_items || combined;
  const count = Number(String(countRaw).match(/([\d,]+)\s*(?:videos?|episodes?)/i)?.[1]?.replaceAll(',', ''));
  return {
    id: id || null,
    title: title || null,
    type: value?.content_type || 'PLAYLIST',
    kind: classifyPlaylist(id),
    visibility: info.privacy || items.find((item) => /^(Public|Private|Unlisted)$/i.test(item)) || null,
    video_count: Number.isFinite(count) ? count : null,
    updated: info.last_updated || items.find((item) => /(?:updated|ago)/i.test(item)) || null,
    editable: typeof info.is_editable === 'boolean' ? info.is_editable : null,
    description: text(info.description) || (typeof info.description === 'string' ? info.description : null)
  };
}
export function normalizeVideo(value) {
  const payload = endpointPayload(value) || {};
  const id = value?.content_id || value?.video_id || value?.videoId || value?.id || payload.videoId;
  const title = text(value?.metadata?.title) || text(value?.title) || text(value?.overlay_metadata?.primary_text) || (typeof value?.title === 'string' ? value.title : undefined);
  let setVideoId = value?.set_video_id || value?.setVideoId || value?.playlist_set_video_id || null;
  if (!setVideoId && typeof value?.key === 'function') {
    try { setVideoId = value.key('set_video_id')?.string?.() || null; } catch {}
  }
  return { id: id || null, title: title || null, set_video_id: setVideoId };
}
export function normalizeAccount(value) {
  const item = value?.contents?.contents?.find?.((entry) => entry.is_selected) || value?.contents?.contents?.[0] || value;
  return {
    logged_in: true,
    name: text(item?.account_name) || text(item?.name) || null,
    handle: text(item?.channel_handle) || text(item?.handle) || null,
    has_channel: Boolean(item?.has_channel)
  };
}
