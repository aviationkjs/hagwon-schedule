import { readFileSync } from "node:fs";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

let env: RulesTestEnvironment | undefined;

/** 에뮬레이터에 연결된 규칙 테스트 환경. firebase emulators:exec 안에서만 동작한다. */
export async function testEnv(): Promise<RulesTestEnvironment> {
  env ??= await initializeTestEnvironment({
    projectId: "demo-academy",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
  return env;
}
