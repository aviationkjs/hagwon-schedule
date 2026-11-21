import { readFileSync, existsSync } from "node:fs";
import { it, expect } from "vitest";

it("빌드 산출물에 manifest와 서비스 워커가 있다", () => {
  expect(existsSync("dist/manifest.webmanifest")).toBe(true);
  expect(existsSync("dist/sw.js")).toBe(true);
  const m = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"));
  expect(m.name).toBe("김항철 academy");
  expect(m.display).toBe("standalone");
});
