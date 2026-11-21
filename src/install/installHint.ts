/** iOS 버전 (iPhone/iPad Safari UA에서). 아니면 null. */
export function iosVersion(ua: string): number | null {
  const m = ua.match(/(?:iPhone|iPad|iPod).*? OS (\d+)_(\d+)/);
  return m ? Number(m[1]) + Number(m[2]) / 100 : null;
}

/**
 * 설치 안내 문구. 이미 홈 화면 앱으로 열었거나 안내가 필요 없으면 null.
 * iPhone은 iOS 16.4 이상에서 홈 화면에 추가해야 푸시 알림을 받을 수 있다 (기획서 4장).
 */
export function installHint(ua: string, standalone: boolean): string | null {
  if (standalone) return null;
  const ios = iosVersion(ua);
  if (ios !== null) {
    const base = "Safari 아래쪽 공유 버튼 → '홈 화면에 추가'를 누르면 앱처럼 쓸 수 있습니다.";
    return ios < 16.04 ? `${base} 이 iOS 버전에서는 알림을 받을 수 없으니 iOS 16.4 이상으로 업데이트해 주세요.` : base;
  }
  if (/Android/i.test(ua)) return "Chrome 메뉴(⋮) → '앱 설치' 또는 '홈 화면에 추가'를 누르면 앱처럼 쓸 수 있습니다.";
  return null;
}
