// Firebase web config. These keys are public by design: access is enforced by firestore.rules.
export const firebaseConfig = {
  apiKey: "AIzaSyDeQszs41eLm1_yCVrU8eGklJr9XReEL4M",
  authDomain: "mir-air-kstu.firebaseapp.com",
  projectId: "mir-air-kstu",
  storageBucket: "mir-air-kstu.firebasestorage.app",
  messagingSenderId: "822304090834",
  appId: "1:822304090834:web:34fc2bcac000aae7685b0b",
};

// Moderators by verified email: "all" or a group id ("mir-1", "mir-2", "mir-3").
// Keep this list identical to moderators() in firestore.rules; the rules are what actually grant access.
export const MODERATORS = {
  "avazbek.madrakhimovw@gmail.com": "all",
  "nkhmielan@gmail.com": "mir-1",
  "sigmaman1501@gmail.com": "mir-2",
};
