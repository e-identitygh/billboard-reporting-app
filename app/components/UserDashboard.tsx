'use client'

import { useState } from 'react'
import BillboardManagement from './user/BillboardManagement'
import ProfileManagement from './user/ProfileManagement'
import Support from './user/Support'
import { Button } from "@/components/ui/button"

export default function UserDashboard({ user }: { user: { uid: string } }) {
    const [activeTab, setActiveTab] = useState('billboards')

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>
            <div className="mb-4 flex space-x-2">
                <Button
                    onClick={() => setActiveTab('billboards')}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${
                        activeTab === 'billboards'
                            ? 'text-black text-white'
                            : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                >
                    My Billboards
                </Button>
                <Button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${
                        activeTab === 'profile'
                            ? 'text-black text-white'
                            : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                >
                    Profile
                </Button>
                <Button
                    onClick={() => setActiveTab('support')}
                    className={`px-4 py-2 rounded transition-colors duration-200 ${
                        activeTab === 'support'
                            ? 'text-black text-white'
                            : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                >
                    Support
                </Button>
            </div>
            <div className="p-4 bg-gray-50 shadow-lg rounded shadow-md">
                {activeTab === 'billboards' && <BillboardManagement userId={user.uid} />}
                {activeTab === 'profile' && <ProfileManagement userId={user.uid} />}
                {activeTab === 'support' && <Support userId={user.uid} />}
            </div>
        </div>
    )
}