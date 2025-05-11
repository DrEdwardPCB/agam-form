export function getMimeType(filename: string): string {
  if (!filename) return 'application/octet-stream';

  const extension = filename.split('.').pop()?.toLowerCase() || '';

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    pdf: 'application/pdf',
  };

  return mimeTypes[extension] || 'application/octet-stream';
}
