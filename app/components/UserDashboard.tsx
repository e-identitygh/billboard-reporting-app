'use client'

import { useState } from 'react'
import BillboardManagement from './user/BillboardManagement'
import ProfileManagement from './user/ProfileManagement'
import Support from './user/Support'
import { Button } from "@/components/ui/button"

export default function UserDashboard({ user }: { user: { uid: string } }) {
    const [activeTab, setActiveTab] = useState('billboards')

    return (
        <div className="container mx-auto p-4">

            <h1 className="text-xl font-bold mb-6 text-center md:text-3xl">User Dashboard</h1>

            <div className="mb-4 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">

                <Button
                    onClick={() => setActiveTab('billboards')}
                    className={`w-full md:w-auto px-6 py-3 rounded transition-colors duration-200 ${
                        activeTab === 'billboards'
                            ? 'text-black text-white'
                            : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                >
                    My Billboards
                </Button>

                <Button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full md:w-auto px-6 py-3 rounded transition-colors duration-200 ${
                        activeTab === 'profile'
                            ? 'text-black text-white'
                            : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                >
                    Profile
                </Button>

                <Button
                    onClick={() => setActiveTab('support')}
                    className={`w-full md:w-auto px-6 py-3 rounded transition-colors duration-200 ${
                        activeTab === 'support'
                            ? 'text-black text-white'
                            : 'bg-gray-300 text-black hover:bg-gray-400'
                    }`}
                >
                    Support
                </Button>
            </div>
            <div className="p-4 bg-gray-50 shadow-lg rounded mb-4 w-full sm:w-auto mt-4 md:mt-0">
                {activeTab === 'billboards' && <BillboardManagement userId={user.uid} />}
                {activeTab === 'profile' && <ProfileManagement userId={user.uid} />}
                {activeTab === 'support' && <Support userId={user.uid} />}
            </div>
        </div>
    )
}