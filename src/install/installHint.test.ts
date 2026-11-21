import { installHint, iosVersion } from "./installHint";

const ios = (v: string) =>
  `Mozilla/5.0 (iPhone; CPU iPhone OS ${v} like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1`;

it("iOS 버전을 읽는다", () => {
  expect(iosVersion(ios("16_4"))).toBe(16.04);
  expect(iosVersion("Mozilla/5.0 (Linux; Android 14)")).toBe(null);
});

it("이미 홈 화면 앱이면 안내하지 않는다", () => {
  expect(installHint(ios("17_2"), true)).toBe(null);
});

it("iOS 16.4 미만이면 알림 불가 안내를 덧붙인다", () => {
  expect(installHint(ios("16_3"), false)).toContain("16.4 이상");
  expect(installHint(ios("16_4"), false)).not.toContain("16.4 이상");
  expect(installHint(ios("17_0"), false)).toContain("홈 화면에 추가");
});

it("안드로이드는 Chrome 설치 안내, PC는 안내 없음", () => {
  expect(installHint("Mozilla/5.0 (Linux; Android 14) Chrome/120", false)).toContain("Chrome");
  expect(installHint("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", false)).toBe(null);
});
