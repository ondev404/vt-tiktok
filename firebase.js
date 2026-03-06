// firebase.js
const firebaseConfig = {
    apiKey: "AIzaSyAKwky91lmjc1P6yH5Uml3hfss3c_wtC7s",
    authDomain: "onxx-93ce8.firebaseapp.com",
    databaseURL: "https://onxx-93ce8-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "onxx-93ce8",
    storageBucket: "onxx-93ce8.firebasestorage.app",
    messagingSenderId: "865171996071",
    appId: "1:865171996071:web:fe5e2aa2744ae279660a82",
    measurementId: "G-8TH1Y0104D"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();