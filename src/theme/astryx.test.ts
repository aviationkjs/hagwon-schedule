import { readFileSync } from "node:fs";

const css = readFileSync("src/theme/astryx.css", "utf8");
const [light, dark] = css.split("@media (prefers-color-scheme: dark)");

it("Astryx 라이트 토큰이 CSS 변수로 들어 있다", () => {
  expect(light).toContain("--color-accent: #1b1b1b;");
  expect(light).toContain("--color-background-body: #f1f1f1;");
  expect(light).toContain("--radius-element: 0.625rem;");
  expect(light).toContain("--spacing-3: 0.75rem;");
  expect(light).toContain("--size-element-md: 32px;");
  expect(light).toMatch(/--font-body: Figtree,/);
  expect(light).toContain("--text-body-size: 14px;");
});

it("다크 테마는 다크 값으로 덮어쓴다", () => {
  expect(dark).toContain("--color-accent: #f1f1f1;");
  expect(dark).toContain("--color-background-body: #1b1b1b;");
});

it("한 테마 값만 있는 토큰은 라이트에만 나온다", () => {
  expect(light).toContain("--color-warning: #ffce2f;");
  expect(dark).not.toContain("--color-warning:");
});
