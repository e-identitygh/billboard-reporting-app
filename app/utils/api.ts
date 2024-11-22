import {auth, db, storage} from './firebase';
import {createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {addDoc, collection, doc, getDoc, getDocs, query, setDoc} from 'firebase/firestore';
import {getDownloadURL, ref, uploadString} from 'firebase/storage';

// Function to register a new user
export async function register(email: string, password: string) {
    try {
        if (!(!email || !password)) {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: email,
                role: 'user'  // Default role set to 'user'
            });
            return {user: userCredential.user};
        } else {
            throw new Error("Email and password are required.");
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Registration failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during registration.");
    }
}

// Function to log in a user
export async function login(email: string, password: string) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userRole = await getUserRole(userCredential.user.uid);
        return { user: userCredential.user, role: userRole };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Login failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during login.");
    }
}

// Function to log out the user
export async function logout() {
    try {
        await signOut(auth); // Firebase sign out
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Logout failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during logout.");
    }
}

// Define the report type
interface Report {
    imageUrl: string;
    latitude: number;
    longitude: number;
    flag: boolean;
    description: string;
}

// Function to create a report
export async function createReport(report: Report, userId: string) {
    try {
        // Upload the image to Firebase Storage
        const storageRef = ref(storage, `billboards/${Date.now()}`);
        await uploadString(storageRef, report.imageUrl, 'data_url');
        const imageUrl = await getDownloadURL(storageRef);

        // Add the report document to Firestore
        const docRef = await addDoc(collection(db, 'reports'), {
            imageUrl,
            latitude: report.latitude,
            longitude: report.longitude,
            flag: report.flag,
            description: report.description,
            userId: userId,
            createdAt: new Date()
        });

        return { id: docRef.id };
    } catch (error: unknown) {
        if (error instanceof Error) {
            throw new Error(`Failed to create report: ${error.message}`);
        }
        throw new Error('An unknown error occurred while creating the report.');
    }
}

// Fetch reports and add logic to place the title at the beginning
export async function getReports() {
    try {
        const q = query(collection(db, 'reports'));
        const querySnapshot = await getDocs(q);
        let reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Add the title or custom sorting logic
        if (reports.length > 0) {
            // Assuming 'title' is a property of the report and we want to move it to the front of the list
            const titleReport = reports.find(report => report.description.includes("Title")); // Modify condition as needed
            if (titleReport) {
                reports = [titleReport, ...reports.filter(report => report.id !== titleReport.id)];
            }
        }

        return reports;
    } catch (error) {
        throw new Error(error.message);
    }
}

// Fetch the role of a user from Firestore
export async function getUserRole(userId: string): Promise<string> {
    try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
            return userDoc.data().role || 'user';
        }
        return 'user';
    } catch (error) {
        console.error("Error fetching user role:", error);
        return 'user';
    }
}

// Refresh user role
export async function refreshUserRole(userId: string): Promise<string> {
    return await getUserRole(userId);
}
