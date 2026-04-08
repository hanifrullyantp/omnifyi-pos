export function isPosHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase() === 'pos.omnifyi.com';
}

export function getAppOrigin(): string {
  if (typeof window === 'undefined') return 'https://pos.omnifyi.com';
  return isPosHost() ? window.location.origin : 'https://pos.omnifyi.com';
}

export function getAppPath(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${getAppOrigin()}${clean}`;
}
