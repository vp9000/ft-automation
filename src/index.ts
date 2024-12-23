import { add } from "date-fns";
import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 } from "uuid";

import firebaseCert from "../cert.json";
import { ScheduledFast } from "./types";

let db: FirebaseFirestore.Firestore;

const SCHEDULED_FAST_COLLECTION = "scheduled_fasts";
const COMMUNITY_FAST_COLLECTION = "community_fasts";

const sessions: Pick<ScheduledFast, "label" | "duration">[] = [
  { label: "Daily 16:8 IF", duration: 16 },
  { label: "Daily 18:6 IF", duration: 18 },
  { label: "Daily 20:4 IF", duration: 20 },
  { label: "Daily 22:2 IF", duration: 22 },
  { label: "Daily OMAD (23:1)", duration: 23 },
];

const deactivatePreviousScheduledFasts = async () => {
  try {
    const batch = db.batch();

    const docRef = db
      .collection(SCHEDULED_FAST_COLLECTION)
      .where("isActive", "==", true);
    const snapshot = await docRef.get();

    const activeSessions = snapshot.docs.map(
      (doc) => doc.data() as ScheduledFast
    );

    activeSessions.forEach((session) => {
      const deactivatedSession = { ...session, isActive: false };
      const docRef = db.collection(SCHEDULED_FAST_COLLECTION).doc(session.id);
      batch.set(docRef, deactivatedSession);
    });

    await batch.commit();
    console.log("Deactivated previous scheduled fasts ✅");
  } catch (error) {
    console.error("Error deactivating previous scheduled fasts ❌", error);
  }
};

const cleanUpDeactivatedScheduledFasts = async () => {
  try {
    /**
     * In the future, implement an archive feature to store deactivated sessions
     * in a local database.
     *
     * For now, we'll just delete them.
     */

    const batch = db.batch();

    const docRef = db
      .collection(SCHEDULED_FAST_COLLECTION)
      .where("isActive", "==", false);
    const snapshot = await docRef.get();

    const deactivatedSessions = snapshot.docs.map(
      (doc) => doc.data() as ScheduledFast
    );

    deactivatedSessions.forEach((session) => {
      const docRef = db.collection(SCHEDULED_FAST_COLLECTION).doc(session.id);
      batch.delete(docRef);
    });

    await batch.commit();
    console.log("Cleaned up deactivated scheduled fasts ✅");
  } catch (error) {
    console.error("Error cleaning up deactivated scheduled fasts ❌", error);
  }
};

const generateScheduledFasts = () => {
  const dt = new Date();
  const created = dt.getTime();
  const joinDeadline = add(dt, { days: 1 }).getTime();

  const fasts: ScheduledFast[] = sessions.map((session) => ({
    ...session,
    id: v4(),
    creatorId: "service_account",
    isActive: true,
    participants: [],
    visibility: "public",
    created,
    joinDeadline,
  }));

  return fasts;
};

const addNewSessionsToFirestore = async () => {
  try {
    const batch = db.batch();
    const fasts = generateScheduledFasts();

    fasts.forEach((fast) => {
      const docRef = db.collection(SCHEDULED_FAST_COLLECTION).doc(fast.id);
      batch.set(docRef, fast);
    });

    await batch.commit();
    console.log("Added new scheduled fasts ✅");
  } catch (error) {
    console.error("Error adding new scheduled fasts to Firestore ❌", error);
  }
};

const cleanUpExpiredCommunitySessions = async () => {
  try {
    /**
     * In the future, implement an archive feature to store deactivated sessions
     * in a local database.
     *
     * For now, we'll just delete them.
     */

    const batch = db.batch();
    const now = new Date().getTime();

    const docRef = db.collection(COMMUNITY_FAST_COLLECTION);
    const snapshot = await docRef.get();

    const expiredSessions = snapshot.docs.map(
      (doc) => doc.data() as ScheduledFast
    );

    expiredSessions.forEach((session) => {
      if (now < session.joinDeadline) {
        return;
      }

      const docRef = db.collection(COMMUNITY_FAST_COLLECTION).doc(session.id);
      batch.delete(docRef);
    });

    await batch.commit();
    console.log("Cleaned up expired community fasts ✅");
  } catch (error) {
    console.error("Could not clean up expired community fasts ❌", error);
  }
};

const main = async () => {
  console.log("Initializing app ⌛️");
  initializeApp({
    credential: cert(firebaseCert as ServiceAccount),
  });
  db = getFirestore();

  console.log("Refreshing scheduled fasts.. ⌛️");
  await deactivatePreviousScheduledFasts();
  await cleanUpDeactivatedScheduledFasts();
  await addNewSessionsToFirestore();

  console.log("Processing community fasts.. ⌛️");
  await cleanUpExpiredCommunitySessions();

  console.log("Done! 🙌");
};

main();
