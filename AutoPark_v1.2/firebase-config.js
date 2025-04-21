// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAOLjRxraC5K-le7yv-kwvDQPea8Ju3z5s",
    authDomain: "parkvue-7aad4.firebaseapp.com",
    projectId: "parkvue-7aad4",
    storageBucket: "parkvue-7aad4.firebasestorage.app",
    messagingSenderId: "417337950143",
    appId: "1:417337950143:web:0c5d9b01aaa51213ee2b0a",
    measurementId: "G-W6KGZ59QDK"
  };
  
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // Initialize services
  const auth = firebase.auth();
  const db = firebase.firestore();