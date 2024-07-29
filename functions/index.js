const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});
const db = admin.firestore();
const storage = admin.storage();
const bucket = storage.bucket("gs://rn-demoapp2.appspot.com");

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { FieldValue } = require("firebase-admin/firestore");

/*TO TEST onCall functions in Postman, must use POST method*/

// fetch 10 initial arts shown in search page **WORKING NOW, DONT FKING TOUCH**
exports.fetchArts = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING FETCH ARTS");
  }

  try {
    const snapshot = await db
      .collection("illustrations")
      .orderBy("uploadedTime", "desc")
      .limit(10)
      .get();
    const userData = snapshot.docs.map((doc) => ({
      artworkID: doc.id,
      ...doc.data(),
    }));
    return { status: 200, data: userData };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

// save to / delete from FavArt in Firestore, like counter for each art
// **WORKING NOW, DONT FKING TOUCH**
exports.handleFavAndLikes = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING UNFAV ARTS");
  }

  const { favStatus, userId, imgUrl, artworkId, value } = req.data;

  // User liked before, now proceed to delete
  if (favStatus) {
    try {
      await db
        .collection("user")
        .doc(userId)
        .update({
          FavArt: FieldValue.arrayRemove({ imgUrl, artworkId }),
        });
    } catch (error) {
      console.error(error);
      return { status: 500, message: "Error updating Firestore when DELETING" };
    }
  } else {
    // User haven't like, now proceed to like
    try {
      await db
        .collection("user")
        .doc(userId)
        .update({
          FavArt: FieldValue.arrayUnion({ imgUrl, artworkId }),
        });
    } catch (error) {
      console.error(error);
      return { status: 500, message: "Error updating Firestore when ADDING" };
    }
  }

  try {
    await db
      .runTransaction((transaction) => {
        transaction.update(db.collection("illustrations").doc(artworkId), {
          likes: FieldValue.increment(value),
        });
        return new Promise((resolve) =>
          resolve({
            status: 200,
            message: favStatus
              ? "Art deleted from favorites!"
              : "Art saved to favorites!",
          })
        );
      })
      .then(() => console.log("UPDATED LIKE COUNT!!"));
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      message: "Error updating Firestore when modifying LIKES",
    };
  }
});

// fetch art metadata when in Fullscreen **WORKING NOW, DONT FKING TOUCH**
exports.fetchMetdata = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING FETCH ARTS");
  }

  const { artworkId } = req.data;

  try {
    const snapshot = await db.collection("illustrations").doc(artworkId).get();
    const userData = snapshot.data();
    return { status: 200, data: userData };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

// upload art metadata to Firestore **WORKING NOW, DONT FKING TOUCH**
exports.uploadMetadata = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING UPLOAD METADATA");
  }

  const { artFilename, artName, artist, artistId, artDescription, imgUrl } =
    req.data;

  try {
    const res = await db.collection("illustrations").add({
      artworkId: "",
      artFilename: artFilename,
      artName: artName,
      artist: artist,
      artistId: artistId,
      artDescription: artDescription,
      imgUrl: imgUrl,
      likes: 0,
      uploadedTime: new Date(),
    });

    const docRef = db.collection("illustrations").doc(res.id);
    await docRef.update({ artworkId: res.id });
    return { status: 200, data: res.id };
  } catch (error) {
    console.error(error);
    return { status: 500, message: "Error uploading to Firestore" };
  }
});

// fetch uploaded arts in User profile **WORKING NOW, DONT FKING TOUCH**
exports.fetchUploaded = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING FETCH ARTS");
  }

  const { userId } = req.data;

  try {
    const snapshot = await db.collection("user").doc(userId).get();
    const userData = snapshot.data()["UploadedArt"];
    return { status: 200, data: userData.reverse() };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

// count the total number of arts **WORKING NOW, DONT FKING TOUCH**
exports.totalArtCount = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING COUNT ARTS");
  }

  try {
    const artRef = db.collection("illustrations");
    const res = await artRef.get();
    return { status: 200, data: res.size };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

// fetch data with pagination **WORKING NOW, DONT FKING TOUCH**
exports.paginationFetch = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING FETCH ARTS");
  }

  try {
    const { page, limit } = req.data;

    let illustrationsRef = db.collection("illustrations");
    let query = illustrationsRef.orderBy("uploadedTime", "desc");

    let offset = (page - 1) * limit;

    return query
      .limit(limit)
      .offset(offset)
      .get()
      .then((querySnapshot) => {
        const arts = [];
        querySnapshot.forEach((doc) => {
          arts.push({ artworkID: doc.id, ...doc.data() });
        });
        return { status: 200, data: arts };
      })
      .catch((error) => {
        console.log("YOU GGED", error);
      });
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

// check whether the uploaded art is faved by the artist user
exports.deleteFromUploaded = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "failed-precondition",
      "CANT FKING DELETE UPLOADED ARTS"
    );
  }

  try {
    const { userId, artworkId, imgUrl, imgPath } = req.data;

    // if target art in FavArt, delete it as well
    db.collection("user")
      .doc(userId)
      .get()
      .then((doc) => {
        if (doc.data()) {
          const favArt = doc.data()["FavArt"];

          favArt.forEach((artwork) => {
            if (artwork.artworkId === artworkId && artwork.imgUrl === imgUrl) {
              db.collection("user")
                .doc(userId)
                .update({
                  FavArt: FieldValue.arrayRemove({ artworkId, imgUrl }),
                });
            }
          });
        }
      });

    // delete target art in UploadedArt
    await db
      .collection("user")
      .doc(userId)
      .update({
        UploadedArt: FieldValue.arrayRemove({ artworkId, imgUrl }),
      });

    // delete target art in illustrations collection
    await db.collection("illustrations").doc(artworkId).delete();

    // delete target art in Storage
    bucket.file(imgPath).delete((error) => {
      if (error) {
        console.error(error);
        return { status: 500, error: "Here fkup" };
      } else {
        console.log("DELETEDDDDDDDDDDDDDDDDDDDDDDDDD");
      }
    });

    // delete target art in Storage CANT DELETE
    // after delete, artItem and uploadedItem page error (no likes)

    return { status: 200, message: "Deleted from uploaded art successfully!!" };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});
