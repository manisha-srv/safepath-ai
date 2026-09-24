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
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
