import { db } from "../lib/firebase";
import { makeRepo } from "./repo";

/** MVP는 학원 1곳. 여러 학원으로 늘리면 이 값을 프로필에서 읽는다. */
export const ACADEMY_ID: string = import.meta.env.VITE_ACADEMY_ID || "main";

export const repo = makeRepo(db);
export * from "./types";
