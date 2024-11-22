'use client'

import { useState, useEffect } from 'react'
import { auth } from './utils/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Login from './components/Login'
import BillboardReporting from './components/BillboardReporting'
import AdminDashboard from './components/AdminDashboard'
import { logout, getUserRole } from './utils/api'
import { useToast } from "@/components/ui/toast"

// Define the user type
interface User {
  email: string | null;
  uid: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)  // Explicit type for user
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const role = await getUserRole(currentUser.uid)
        setUser({ email: currentUser.email, uid: currentUser.uid })  // user now has a valid type
        setIsAdmin(role === 'admin')
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = async (userData: User) => {
    setUser(userData)
    const role = await getUserRole(userData.uid)
    setIsAdmin(role === 'admin')
  }

  const handleLogout = async () => {
    try {
      await logout()
      setUser(null)
      setIsAdmin(false)
      showToast("Successfully logged out")
    } catch (error) {
      console.error(error)  // Log the error if you want to see it
      showToast("Failed to log out. Please try again.")
    }
  }


  if (loading) {
    return <div>Loading...</div>
  }

  return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Billboard Reporting System</h1>
            {user && (
                <div className="mt-2 flex items-center justify-between">
                  <span>Logged in as: {user.email} ({isAdmin ? 'Admin' : 'User'})</span>
                  <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Logout
                  </button>
                </div>
            )}
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {user ? (
                isAdmin ? (
                    <AdminDashboard user={user} />
                ) : (
                    <BillboardReporting user={user} />
                )
            ) : (
                <Login onLogin={handleLogin} />
            )}
          </div>
        </main>
      </div>
  )
}
