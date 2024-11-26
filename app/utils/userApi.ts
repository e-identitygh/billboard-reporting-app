import { db } from './firebase';
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';

// Fetches reports for a specific user
export const getUserReports = async (userId: string) => {
    const reportsQuery = query(collection(db, 'reports'), where('userId', '==', userId));
    const reportsSnapshot = await getDocs(reportsQuery);
    return reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Updates a specific billboard
export const updateBillboard = async (billboardId: string, updatedData: any) => {
    const billboardRef = doc(db, 'billboards', billboardId);
    await updateDoc(billboardRef, updatedData);
}

// Deletes a specific billboard
export const deleteBillboard = async (billboardId: string) => {
    try {
        await deleteDoc(doc(db, 'reports', billboardId));
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to delete billboard: ${error.message}`);
        }
        throw new Error('An unknown error occurred while deleting the billboard.');
    }
};
// Fetches user profile information
export const getUserProfile = async (userId: string) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.data();
}

// Updates user profile information
export const updateUserProfile = async (userId: string, updatedData: any) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updatedData);
}

// Changes user password
// This might involve using Firebase Authentication methods
// Placeholder function for changing password
export const changePassword = async (userId: string, newPassword: string) => {
    // Implement password change logic using Firebase Authentication
}

// Submits a support request with a specific message
export const submitSupportRequest = async (userId: string, message: string) => {
    await addDoc(collection(db, 'supportRequests'), {
        userId,
        message,
        createdAt: new Date()
    });
}