import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { logger } from "./utils";

import firebaseCert from "../cert.json";
import { Friend } from "./types";

let db: FirebaseFirestore.Firestore;

const fakeFriends = ["Strict Rod", "Dry Pride", "Blank Flood", "Golf Purse"];
const recipientId = "";

const generateFakeFriendId = (name: string) =>
  `fake-id-${name.toLowerCase().replace(" ", "-")}`;

const generateFakeFriends = () => {
  const friends: Friend[] = fakeFriends.map((friend, i) => ({
    activeFastId: "",
    friendsSince: 0,
    id: generateFakeFriendId(friend),
    name: friend,
    status: i % 2 === 0 ? "request_sent" : "request_received",
  }));

  return friends;
};

const cleanUpFakeFriends = async () => {
  try {
    const batch = db.batch();

    fakeFriends.forEach((friend) => {
      const fakeFriendId = generateFakeFriendId(friend);

      const fakeFriendRef = db.collection("users").doc(fakeFriendId);
      batch.delete(fakeFriendRef);

      const recipientRef = db
        .collection("users")
        .doc(recipientId)
        .collection("friends")
        .doc(fakeFriendId);
      batch.delete(recipientRef);
    });

    await batch.commit();
    logger.info("Cleaned up fake friends from Firestore ✅");
  } catch (error) {
    logger.error("Error cleaning up fake friends from Firestore ❌", error);
  }
};

const addFakeFriendsToFireStore = async () => {
  try {
    const batch = db.batch();
    const friends = generateFakeFriends();

    friends.forEach((friend) => {
      const fakeFriendRef = db
        .collection("users")
        .doc(friend.id)
        .collection("friends")
        .doc(recipientId);
      batch.set(fakeFriendRef, friend);

      const recipientRef = db
        .collection("users")
        .doc(recipientId)
        .collection("friends")
        .doc(friend.id);
      batch.set(recipientRef, {
        ...friend,
        status:
          friend.status === "request_sent"
            ? "request_received"
            : "request_sent",
      });
    });

    await batch.commit();
    logger.info("Added fake friends to Firestore ✅");
  } catch (error) {
    logger.error("Error adding fake friends to Firestore ❌", error);
  }
};

const main = async () => {
  logger.info("Initializing app ⌛️");
  initializeApp({
    credential: cert(firebaseCert as ServiceAccount),
  });
  db = getFirestore();

  logger.info("Cleaning up fake friends.. ⌛️");
  await cleanUpFakeFriends();

  logger.info("Generating random friend requests.. ⌛️");
  await addFakeFriendsToFireStore();

  logger.info("Done! 🙌");
};

main();
