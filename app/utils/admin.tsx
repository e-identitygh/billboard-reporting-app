import { db } from './firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';


// Admin class to handle report management
export class Admin {
    // Method to edit a report
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

    // Method to delete a report
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
