import { httpsCallable } from "firebase/functions";
import { functions } from "../firebaseConfig";

// save to / delete from Fav in Firestore, like increment / decrement in Firestore
// using CLOUD FUNCTION, WORKING!!!
export const handleFavAndLikes = async (json) => {
  const handleCallable = httpsCallable(functions, "handleFavAndLikes");
  try {
    const res = await handleCallable(json);
    console.log("Firestore updated successfully!!");
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

export const addComment = async (json) => {
  const addCallable = httpsCallable(functions, "addComment");
  try {
    const res = await addCallable(json);
    console.log("comment added successfully!");
  } catch (error) {
    console.error(error);
  }
};

export const likeComment = async (json) => {
  const likeCallable = httpsCallable(functions, "likeComment");
  try {
    const res = await likeCallable(json);
    console.log("comment liked successfully!");
  } catch (error) {
    console.error(error);
  }
};
