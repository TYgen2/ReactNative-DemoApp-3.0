import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

// save to Fav in Firestore using CLOUD FUNCTION, WORKING!!!
export const saveToFav = async (json) => {
  const saveFavCallable = httpsCallable(functions, "saveToFav");
  try {
    const res = await saveFavCallable(json);
    console.log(res.data);
  } catch (error) {
    console.error(error);
  }
};

// delete from Fav in Firestore using CLOUD FUNCTION, WORKING!!!
export const deleteFromFav = async (json) => {
  const delFavCallable = httpsCallable(functions, "deleteFromFav");
  try {
    const res = await delFavCallable(json);
    console.log(res.data);
  } catch (error) {
    console.error(error);
  }
};

// like increment / decrement in Firestore using CLOUD FUNCTION, WORKING!!!
export const likeCount = async (json) => {
  const countCallable = httpsCallable(functions, "likeCount");
  try {
    const res = await countCallable(json);
    console.log("Like updated!");
  } catch (error) {
    console.error(error);
  }
};

// upload art metadata to Firestore illustrations using CLOUD FUNCTION, WORKING!!!
export const uploadMetadata = async (json) => {
  const uploadCallable = httpsCallable(functions, "uploadMetadata");
  try {
    const res = await uploadCallable(json);
    console.log("Art metadata uploaded!");
    return res.data;
  } catch (error) {
    console.error(error);
  }
};

export const fetchUploaded = async (json) => {
  const fetchCallable = httpsCallable(functions, "fetchUploaded");
  try {
    const res = await fetchCallable(json);
    console.log("Uploaded arts fetched!");
    return res.data;
  } catch (error) {
    console.error(error);
  }
};

export const deleteFromUploaded = async (json) => {
  const deleteCallable = httpsCallable(functions, "deleteFromUploaded");
  try {
    const res = await deleteCallable(json);
    console.log("art deleted successfully!");
  } catch (error) {
    console.error(error);
  }
};
