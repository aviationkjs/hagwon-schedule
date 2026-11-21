import { normalizePhone } from "./phone";

it("하이픈·공백·국가번호를 정리한다", () => {
  expect(normalizePhone("010-1234-5678")).toBe("01012345678");
  expect(normalizePhone(" 010 1234 5678 ")).toBe("01012345678");
  expect(normalizePhone("+82 10-1234-5678")).toBe("01012345678");
  expect(normalizePhone("821012345678")).toBe("01012345678");
});

it("휴대폰 번호 형식이 아니면 null", () => {
  expect(normalizePhone("1234")).toBe(null);
  expect(normalizePhone("02-123-4567")).toBe(null);
  expect(normalizePhone("")).toBe(null);
});
