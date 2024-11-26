'use client'

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { logout, getUserRole, getUserName } from './utils/api';
import { useToast } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import {toast} from "react-toastify";

// Dynamically import components that might use browser APIs
const Login = dynamic(() => import('./components/Login'), {
  ssr: false
});

const BillboardReporting = dynamic(() => import('./components/BillboardReporting'), {
  ssr: false
});

const AdminDashboard = dynamic(() => import('./components/AdminDashboard'), {
  ssr: false
});

// Define the user type
interface User {
  email: string | null;
  uid: string;
  name: string | null;
  id: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const [role, name] = await Promise.all([
            getUserRole(currentUser.uid),
            getUserName(currentUser.uid)
          ]);

          setUser({
            email: currentUser.email,
            uid: currentUser.uid,
            name,
            id: currentUser.uid
          });
          setIsAdmin(role === 'admin');
        } catch (error) {
          console.error('Error fetching user data:', error);
          showToast("Failed to load user data. Please try again.");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mounted, toast]);

  const handleLogin = async (userData: User) => {
    try {
      const [name, role] = await Promise.all([
        getUserName(userData.uid),
        getUserRole(userData.uid)
      ]);

      setUser({ ...userData, name });
      setIsAdmin(role === 'admin');

      showToast("Successfully logged in!");
    } catch (error) {
      console.error('Error during login:', error);
      showToast("Failed to complete login. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsAdmin(false);
      showToast("You have been successfully logged out.");
    } catch (error) {
      console.error('Error during logout:', error);
      showToast("Failed to log out. Please try again.");
    }
  };

  // Don't render anything until the component is mounted
  if (!mounted) return null;

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-background">
        <Toaster />
        <header className="border-b bg-card">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-foreground">Billboard Reporting System</h1>
            {user && (
                <div className="mt-2 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Logged in as: <span className="font-medium text-foreground">{user.email}</span>{' '}
                      <span className="text-xs">({isAdmin ? 'Admin' : 'User'})</span>
                    </p>
                    {user.name && (
                        <p className="text-sm text-muted-foreground">
                          Name: <span className="font-medium text-foreground">{user.name}</span>
                        </p>
                    )}
                  </div>
                  <button
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  >
                    Logout
                  </button>
                </div>
            )}
          </div>
        </header>
        <main>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {user ? (
                isAdmin ? (
                    <AdminDashboard user={user} />
                ) : (
                    <BillboardReporting user={user} />
                )
            ) : (
                <Login
                    onLogin={async (data) => handleLogin({
                      ...data,
                      name: await getUserName(data.uid),
                      id: data.uid
                    })}
                />
            )}
          </div>
        </main>
      </div>
  );
}