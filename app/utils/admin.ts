import { db } from './firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'

// Fetch all users
export const getAllUsers = async () => {
    try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Update a user's role
export const updateUserRole = async (userId: string, newRole: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, { role: newRole });
    } catch (error) {
        console.error(`Error updating user role for ${userId}:`, error);
        throw error;
    }
};

// Delete a user
export const deleteUser = async (userId: string) => {
    try {
        await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
        console.error(`Error deleting user ${userId}:`, error);
        throw error;
    }
};


// Fetch all pending billboards
export const getPendingBillboards = async () => {
    const q = query(collection(db, 'billboards'), where('status', '==', 'pending'))
    const billboardsSnapshot = await getDocs(q)
    return billboardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

// Approve a pending billboard
export const approveBillboard = async (billboardId: string) => {
    const billboardRef = doc(db, 'billboards', billboardId)
    await updateDoc(billboardRef, { status: 'approved' })
}

// Delete a billboard
export const deleteBillboard = async (billboardId: string) => {
    await deleteDoc(doc(db, 'billboards', billboardId))
}

// Fetch analytics data
export const getAnalytics = async () => {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const billboardsSnapshot = await getDocs(collection(db, 'billboards'))
    return {
        totalUsers: usersSnapshot.size,
        totalBillboards: billboardsSnapshot.size
    }
}

// Generate an activity report
export const generateActivityReport = async () => {
    // Example implementation of activity report generation
    const usersSummary = await getAllUsers()
    const billboardsSummary = await getPendingBillboards()

    return {
        users: usersSummary,
        billboards: billboardsSummary
    }
}

// Class to handle admin-specific actions
export class Admin {
    // Edit a report
    static async editReport(reportId: string, updatedReportData: any) {
        try {
            const reportRef = doc(db, 'reports', reportId);
            await updateDoc(reportRef, updatedReportData);
            return { success: true, message: "Report updated successfully." };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to update report: ${error.message}`);
            }
            throw new Error('An unknown error occurred while updating the report.');
        }
    }

    // Delete a report
    static async deleteReport(reportId: string) {
        try {
            const reportRef = doc(db, 'reports', reportId);
            await deleteDoc(reportRef);
            return { success: true, message: "Report deleted successfully." };
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to delete report: ${error.message}`);
            }
            throw new Error('An unknown error occurred while deleting the report.');
        }
    }
}