import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAvZ5PmdgRVU29hvX6K6w6FU1GXLPwLSk8",
  authDomain: "rn-demoapp2.firebaseapp.com",
  projectId: "rn-demoapp2",
  storageBucket: "rn-demoapp2.appspot.com",
  messagingSenderId: "511251591516",
  appId: "1:511251591516:web:c44fe8c6049351ec939199",
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
export const functions = getFunctions(app);
