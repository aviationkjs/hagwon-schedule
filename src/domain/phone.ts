/** 휴대폰 번호를 숫자만 남긴 01X로 시작하는 형태로 맞춘다. 형식이 아니면 null. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("82")) digits = "0" + digits.slice(2);
  return /^01[016789]\d{7,8}$/.test(digits) ? digits : null;
}
