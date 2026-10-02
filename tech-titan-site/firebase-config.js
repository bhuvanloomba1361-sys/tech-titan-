/* =========================================================
   TECH TITAN — LIVE DATA CONFIG
   =========================================================
   This is the ONLY file you need to edit to connect the site
   to your own free Firebase project. Do NOT rename this file —
   index.html, departments.html and admin.html all load it.

   HOW TO GET THESE VALUES: see DEPLOY-GUIDE.md, Step 1.
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyDn2TfY226h8ADVsOty0TTscM5-ZTYuJXk",
  authDomain: "tech-titans-cct.firebaseapp.com",
  projectId: "tech-titans-cct",
  storageBucket: "tech-titans-cct.firebasestorage.app",
  messagingSenderId: "202558756038",
  appId: "1:202558756038:web:39959f4ddd8d6c3d0c73c7",
  measurementId: "G-QXKXSG5CGD"
};

try{
  firebase.initializeApp(firebaseConfig);
  window.techtitanDb = firebase.firestore();
  if(window.firebase.auth) window.techtitanAuth = firebase.auth();
}catch(e){
  console.error('Firebase failed to initialize — check firebase-config.js', e);
  window.techtitanDb = null;
}
