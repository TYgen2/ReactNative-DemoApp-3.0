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

exports.fetchFavAndLikes = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError(
      "failed-precondition",
      "CANT FKING FETCH FAV AND LIKES DATA"
    );
  }

  const { userId, artworkId, guest } = req.data;

  let favData;

  try {
    if (!guest) {
      const favSnapshot = await db.collection("user").doc(userId).get();
      favData = favSnapshot.data()["FavArt"];
    }

    const likeSnapshot = await db
      .collection("illustrations")
      .doc(artworkId)
      .get();
    const likeData = likeSnapshot.data()["likes"];

    return { status: 200, favData: favData, likeData: likeData };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

exports.addComment = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING COMMENT");
  }

  const { userId, comment, artworkId } = req.data;

  try {
    const res = await db.collection("comments").add({
      commentId: "",
      commentUser: userId,
      comment: comment,
      artworkId: artworkId,
      likeCount: 0,
      likedBy: [],
      createdTime: new Date(),
    });

    const docRef = db.collection("comments").doc(res.id);
    await docRef.update({ commentId: res.id });

    return { status: 200, message: "Created comment" };
  } catch (error) {
    console.error(error);
    return { status: 500, message: "Error adding to comments" };
  }
});

exports.getComment = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING FETCH COMMENT");
  }

  const { artworkId, userId, mode } = req.data;

  const getUserInfo = async (userID) => {
    const snapshot = await db.collection("user").doc(userID).get();
    return snapshot.data()["Info"];
  };

  const checkIfUserHasLiked = async (commentId) => {
    const commentRef = db.collection("comments").doc(commentId);
    const snapshot = await commentRef.get();

    if (!snapshot.exists) {
      return false;
    }

    const likedByArray = snapshot.data()["likedBy"];
    return likedByArray.includes(userId);
  };

  try {
    const commentsRef = db.collection("comments");
    const querySnapshot = await commentsRef
      .where("artworkId", "==", artworkId)
      .orderBy(mode, "desc")
      .get();

    const comments = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const { likedBy, artworkId, ...rest } = doc.data();
        const userInfo = await getUserInfo(rest.commentUser);
        const isLiked = await checkIfUserHasLiked(doc.id);

        return {
          ...rest,
          commentUserInfo: {
            name: userInfo.name,
            icon: userInfo.icon,
          },
          likeStatus: isLiked,
        };
      })
    );

    // Since we've fetched and constructed comments in the correct order, we can return them directly
    return { status: 200, data: comments };
  } catch (error) {
    return { status: 500, error: error.message };
  }
});

exports.likeComment = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING COMMENT");
  }

  const { userId, commentId, favStatus } = req.data;
  try {
    const commentRef = db.collection("comments").doc(commentId);

    await db
      .runTransaction((transaction) => {
        transaction.update(commentRef, {
          likeCount: favStatus
            ? FieldValue.increment(-1)
            : FieldValue.increment(1),
        });

        transaction.update(commentRef, {
          likedBy: favStatus
            ? FieldValue.arrayRemove(userId)
            : FieldValue.arrayUnion(userId),
        });

        return new Promise((resolve) =>
          resolve({
            status: 200,
            message: favStatus ? "comment cancelled liked!" : "comment liked!",
          })
        );
      })
      .then(() => console.log("UPDATED LIKE COUNT!!"));

    return { status: 200, message: "Liked comment successfully!!" };
  } catch (error) {
    console.error(error);
    return { status: 500, message: "Error creating liked comment docs" };
  }
});

exports.deleteComment = onCall(async (req) => {
  if (!req.auth) {
    throw new HttpsError("failed-precondition", "CANT FKING DELETE COMMENT");
  }

  const { commentId } = req.data;

  try {
    await db.collection("comments").doc(commentId).delete();
    return { status: 200, message: "Comment deleted!!" };
  } catch (error) {
    console.error(error);
    return { status: 500, message: "Error deleting comment" };
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
    const { page, limit, mode } = req.data;

    let illustrationsRef = db.collection("illustrations");
    let query = illustrationsRef.orderBy(mode, "desc");

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
    // await db.collection("illustrations").doc(artworkId).delete();

    const illsutrationRef = db.collection("illustrations").doc(artworkId);
    const likesRef = illsutrationRef.collection("likes");
    const likesSnapshot = await likesRef.get();
    likesSnapshot.forEach((likeDoc) => {
      likeDoc.ref.delete();
    });
    await illsutrationRef.delete();

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
