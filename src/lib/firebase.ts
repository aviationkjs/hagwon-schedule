import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";

const env = import.meta.env;

// 실제 프로젝트 키가 없으면 에뮬레이터용 demo 프로젝트로 동작한다.
const hasRealConfig = Boolean(env.VITE_FIREBASE_API_KEY);
const useEmulator = env.VITE_USE_EMULATOR === "true" || !hasRealConfig;

export const firebaseConfig = hasRealConfig
  ? {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    }
  : {
      apiKey: "demo-key",
      authDomain: "demo-academy.firebaseapp.com",
      projectId: "demo-academy",
      appId: "demo-app",
    };

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 브라우저에서는 기기 안에 캐시를 둬서 Spark 무료 읽기 한도를 아낀다.
export const db = initializeFirestore(app, {
  localCache:
    typeof indexedDB !== "undefined"
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : memoryLocalCache(),
});

if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
