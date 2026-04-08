/** Ubah URL YouTube (watch, youtu.be, shorts, /embed/) jadi URL embed aman untuk iframe. */
export function toYoutubeEmbedUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        return `https://www.youtube.com/embed/${u.pathname.slice('/embed/'.length).split('/')[0]}`;
      }
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
    return null;
  } catch {
    return null;
  }
}
