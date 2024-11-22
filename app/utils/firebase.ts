import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {doc, getFirestore, onSnapshot} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration object (replace with your actual config)
const firebaseConfig = {
    apiKey: "AIzaSyCfSZnUa_GSLqgdH2wEOVrx-4uPoA2eMbo",
    authDomain: "billboard-repport.firebaseapp.com",
    projectId: "billboard-repport",
    storageBucket: "billboard-repport.firebasestorage.app",
    messagingSenderId: "57989154787",
    appId: "1:57989154787:web:6ccefaadd538f5ba8802d6",
    measurementId: "G-TBMVETK6PT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable CORS for Firebase Storage
storage.maxOperationRetryTime = 10000; // Increase retry time


export function subscribeToUserRole(userId: string, callback: (role: string) => void) {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
            const role = doc.data().role || 'user';
            callback(role);
        } else {
            callback('user');
        }
    });
}