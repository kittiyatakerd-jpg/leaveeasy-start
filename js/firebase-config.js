// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่าและเริ่มการเชื่อมต่อ Firebase
// ใช้ Firebase compat SDK (v8-style) ให้เข้ากับสไตล์โค้ดเดิม
// ที่ไม่มี build step และไม่ใช้ ES modules
// ─────────────────────────────────────────────────────────────

var firebaseConfig = {
  apiKey: "AIzaSyBL-y4805uRqR5x3MAdDgbNRd9zHg6ePcs",
  authDomain: "leaveasy-kittiya.firebaseapp.com",
  projectId: "leaveasy-kittiya",
  storageBucket: "leaveasy-kittiya.firebasestorage.app",
  messagingSenderId: "713056768326",
  appId: "1:713056768326:web:219638fc644f68adb01547",
  measurementId: "G-VT59KSCC0J"
};

firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
