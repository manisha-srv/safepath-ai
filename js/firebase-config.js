// ============================================================
// FIREBASE CONFIG — replace the values below with your own.
//
// How to get these (all free):
// 1. Go to https://console.firebase.google.com and create a project.
// 2. In the project, click "Build > Realtime Database" and create a
//    database (start in TEST MODE for the hackathon demo).
// 3. Click the gear icon (top-left) > Project settings > General.
// 4. Scroll to "Your apps" > click the </> (web) icon > register app.
// 5. Copy the firebaseConfig object it gives you and paste the
//    values into the object below.
// ============================================================

const firebaseConfig = {
  databaseURL: "https://firebaseio.com",
  apiKey: "AIzaSyAck8OHUco9-_7Pi566nh2avOyMHz-SdaI",
  authDomain: "safepath-ai-web.firebaseapp.com",
  projectId: "safepath-ai-web",
  storageBucket: "safepath-ai-web.firebasestorage.app",
  messagingSenderId: "371079690457",
  appId: "1:371079690457:web:64543df1274324752e66c8",
  measurementId: "G-TLQG2LHSJ1"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
