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
  // LockupView nests ContentMetadataView rows one level below LockupMetadataView.
  const rows = value?.metadata?.metadata?.metadata_rows || value?.metadata?.metadata_rows || value?.metadata?.metadataRows || [];
  return rows.flatMap((row) => (row.metadata_parts || row.metadataParts || []).map((part) => text(part?.text) || text(part)).filter(Boolean));
}
function thumbnailBadgeTexts(value) {
  const overlays = value?.content_image?.primary_thumbnail?.overlays || [];
  return overlays.flatMap((overlay) => (overlay?.badges || []).map((badge) => text(badge?.text) || text(badge))).filter(Boolean);
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
  // The video count is shown as a thumbnail badge ("253 videos") in the current feed.
  const combined = [...thumbnailBadgeTexts(value), ...items].join(' · ');
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
function resumePercent(value) {
  const overlays = Array.isArray(value?.thumbnail_overlays) ? value.thumbnail_overlays : [];
  const resume = overlays.find((overlay) => overlay?.type === 'ThumbnailOverlayResumePlayback' || typeof overlay?.percent_duration_watched === 'number');
  return typeof resume?.percent_duration_watched === 'number' ? resume.percent_duration_watched : 0;
}
// Playlist entries (youtubei.js PlaylistVideo) carry duration, channel, availability and watch progress.
export function normalizePlaylistItem(value) {
  const video = normalizeVideo(value);
  const seconds = Number(value?.duration?.seconds);
  const channel = text(value?.author?.name) || text(value?.short_byline_text) || null;
  return {
    ...video,
    duration_seconds: Number.isFinite(seconds) && seconds > 0 ? seconds : null,
    duration: text(value?.duration?.text) || null,
    channel: channel && channel !== 'N/A' ? channel : null,
    channel_id: typeof value?.author?.id === 'string' && value.author.id !== 'N/A' ? value.author.id : null,
    playable: typeof value?.is_playable === 'boolean' ? value.is_playable : null,
    info: text(value?.video_info) || null,
    percent_watched: resumePercent(value),
    url: video.id ? `https://youtu.be/${video.id}` : null
  };
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
