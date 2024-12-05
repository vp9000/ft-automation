import { initializeApp, cert, ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import firebaseCert from "../cert.json";

initializeApp({
  credential: cert(firebaseCert as ServiceAccount),
});

const db = getFirestore();

// Function to generate daily data
const generateDailyData = () => {
  const now = new Date();
  return {
    date: now.toISOString(),
    message: `Daily message for ${now.toDateString()}`,
  };
};

// Add data to Firestore
const addDataToFirestore = async () => {
  try {
    const dailyData = generateDailyData();
    const docRef = await db.collection("daily_updates").add(dailyData);
    console.log(`Document added with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error adding document: ", error);
  }
};

// Execute the function
addDataToFirestore();
