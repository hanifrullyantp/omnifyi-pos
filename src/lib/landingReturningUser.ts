/** User pernah login dari perangkat ini → tampilkan kartu login di landing (bukan hanya gambar). */
export const LANDING_RETURNING_USER_KEY = 'omnifyi_landing_returning_user_v1';

export function getLandingReturningUser(): boolean {
  try {
    return localStorage.getItem(LANDING_RETURNING_USER_KEY) === '1';
  } catch {
    return false;
  }
}

export function setLandingReturningUser(): void {
  try {
    localStorage.setItem(LANDING_RETURNING_USER_KEY, '1');
  } catch {
    /* ignore */
  }
}
