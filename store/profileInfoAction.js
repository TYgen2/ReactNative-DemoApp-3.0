import { createAsyncThunk } from "@reduxjs/toolkit";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export const getInfo = createAsyncThunk("getInfo", async (user) => {
  try {
    const docRef = doc(db, "user", user);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data()["Info"];
      return data;
    } else {
      console.log("No such document! Error from reducer");
    }
  } catch (error) {
    console.log(error);
  }
});
