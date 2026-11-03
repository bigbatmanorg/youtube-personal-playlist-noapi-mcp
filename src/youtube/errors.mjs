export function cleanError(error) {
  const message = String(error?.message || error || 'Unknown upstream error')
    .replace(/(?:SID|SAPISID|APISID|HSID|SSID|LOGIN_INFO|__Secure-[\w-]+)=([^;\s]+)/g, '[cookie redacted]')
    .replace(/https?:\/\/[^\s]+/g, '[url redacted]');
  if (/COOKIE_FILE_NOT_FOUND/.test(message)) return { code: 'NOT_CONFIGURED', message: 'No YouTube cookies are configured. Use youtube_cookie_set first.' };
  if (/COOKIE_PARSE_FAILED/.test(message)) return { code: 'COOKIE_PARSE_FAILED', message: message.replace(/^.*COOKIE_PARSE_FAILED:\s*/, '') };
  if (/not signed in|logged.?in|NOT_LOGGED_IN/i.test(message)) return { code: 'NOT_LOGGED_IN', message: 'YouTube did not accept the stored cookies.' };
  if (/PLAN_CHANGED/.test(message)) return { code: 'PLAN_CHANGED', message: message.replace(/^.*PLAN_CHANGED:\s*/, '') };
  if (/INVALID_ARGUMENT/.test(message)) return { code: 'INVALID_ARGUMENT', message: message.replace(/^.*INVALID_ARGUMENT:\s*/, '') };
  if (/INVALID_ID/.test(message)) return { code: 'INVALID_ID', message: message.replace(/^.*INVALID_ID:\s*/, '') };
  // Specific video errors must be matched before the generic "not found" rule below.
  if (/VIDEO_NOT_FOUND|Given video ids were not found/i.test(message)) return { code: 'VIDEO_NOT_FOUND', message: message.replace(/^.*VIDEO_NOT_FOUND:\s*/, 'Video IDs ') };
  if (/not found|empty continuation/i.test(message)) return { code: 'PLAYLIST_NOT_FOUND', message: 'Playlist was not found or is not accessible.' };
  if (/cannot be edited|not editable/i.test(message)) return { code: 'PLAYLIST_NOT_EDITABLE', message: 'This playlist cannot be edited by this account.' };
  return { code: 'UPSTREAM_REQUEST_FAILED', message: message.slice(0, 500) };
}
export function toolError(error) {
  return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: cleanError(error) }) }], isError: true };
}
