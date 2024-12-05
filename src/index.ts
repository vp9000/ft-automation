import { add } from "date-fns";
import { cert, initializeApp, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { v4 } from "uuid";

import firebaseCert from "../cert.json";
import { ScheduledFast } from "./types";

initializeApp({
  credential: cert(firebaseCert as ServiceAccount),
});

const db = getFirestore();

const sessions: Pick<ScheduledFast, "label" | "duration">[] = [
  { label: "Daily 16:8 IF", duration: 16 },
  { label: "Daily 18:6 IF", duration: 18 },
  { label: "Daily 20:4 IF", duration: 20 },
  { label: "Daily 22:2 IF", duration: 22 },
  { label: "Daily OMAD (23:1)", duration: 23 },
];

const generateDailyData = () => {
  const dt = new Date();
  const created = dt.getTime();
  const joinDeadline = add(dt, { days: 1 }).getTime();

  const fasts: ScheduledFast[] = sessions.map((session) => ({
    ...session,
    id: v4(),
    creatorId: "admin",
    isActive: true,
    participants: [],
    visibility: "public",
    created,
    joinDeadline,
  }));

  return fasts;
};

const addDataToFirestore = async () => {
  try {
    const fasts = generateDailyData();
    const batch = db.batch();

    fasts.forEach((fast) => {
      const docRef = db.collection("scheduled_fasts").doc(fast.id);
      batch.set(docRef, fast);
    });

    await batch.commit();
    console.log("Batch commit successful.");
  } catch (error) {
    console.error("Error adding data to Firestore:", error);
  }
};

addDataToFirestore();
