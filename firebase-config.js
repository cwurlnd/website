// =====================================================================
// FIREBASE SETUP — this is the only file you need to edit to turn on
// live, real-time score syncing across everyone's phones.
//
// 1. Go to https://console.firebase.google.com and create a free
//    project (takes about 2 minutes, no credit card required).
// 2. In the left sidebar: Build > Realtime Database > "Create Database".
//    Choose any location, and start in "test mode" (or use the rules
//    below, which do the same thing).
// 3. Click the gear icon (top left) > Project settings > scroll down to
//    "Your apps" > click the web icon </> > register the app (any
//    nickname is fine, you don't need Firebase Hosting).
// 4. Firebase will show you a firebaseConfig object. Copy the values
//    into the object below, replacing every "REPLACE_ME".
// 5. Save this file, upload it to your repo, and you're live.
//
// Suggested Realtime Database rules (Build > Realtime Database > Rules)
// for this event — open read/write, since this is a private link
// shared only with your group and nobody needs to log in to post a
// score from the course:
//
//   {
//     "rules": {
//       ".read": true,
//       ".write": true
//     }
//   }
//
// That's it — no other file needs to change.
// =====================================================================

export const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  databaseURL: "https://REPLACE_ME-default-rtdb.firebaseio.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

export const isConfigured = !Object.values(firebaseConfig).some((v) =>
  String(v).includes("REPLACE_ME")
);
