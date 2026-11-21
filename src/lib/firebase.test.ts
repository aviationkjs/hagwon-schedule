import { it, expect } from "vitest";
import { db, auth } from "./firebase";

it("Firebase 인스턴스를 만든다", () => {
  expect(db).toBeDefined();
  expect(auth).toBeDefined();
});
