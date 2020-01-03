import firebase from 'firebase/app';
import 'firebase/firestore';

var firebaseConfig = {
    apiKey: "AIzaSyDVvS_wZADpFZ7lzHkNQurct3N2x1q9eLw",
    authDomain: "type-trainer1.firebaseapp.com",
    databaseURL: "https://type-trainer1.firebaseio.com",
    projectId: "type-trainer1",
    storageBucket: "type-trainer1.appspot.com",
    messagingSenderId: "1021295451143",
    appId: "1:1021295451143:web:b6ff79f22cf955f1e81ea2",
    measurementId: "G-ZSFHNT1K1E"
};
firebase.initializeApp(firebaseConfig);
// firebase.analytics();

export default firebase;