/** Muestra un ID corto (#últimos 12 chars) para tablas compactas. */
export function formatRecordingIdShort(recordingId) {
  if (!recordingId) return '-';
  const base = recordingId.includes('/') ? recordingId.split('/').pop() : recordingId;
  const lastSegment = base.includes('-') ? base.split('-').pop() : base;
  const short = lastSegment.length > 12 ? lastSegment.slice(-12) : lastSegment;
  return `#${short}`;
}
