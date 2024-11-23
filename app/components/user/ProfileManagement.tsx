'use client'

import { useState, useEffect } from 'react'
import { getUserProfile, updateUserProfile, changePassword } from '../../utils/userApi'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "react-toastify"

export default function ProfileManagement({ userId }) {
    const [profile, setProfile] = useState({ name: '', email: '' })
    const [newPassword, setNewPassword] = useState('')

    useEffect(() => {
        fetchUserProfile()
    }, [userId])

    const fetchUserProfile = async () => {
        try {
            const userProfile = await getUserProfile(userId)
            setProfile(userProfile)
        } catch (error) {
            toast.error('Failed to fetch user profile')
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        try {
            await updateUserProfile(userId, { name: profile.name, email: profile.email })
            toast.success('Profile updated successfully')
        } catch (error) {
            toast.error('Failed to update profile')
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        try {
            await changePassword(userId, newPassword)
            toast.success('Password changed successfully')
            setNewPassword('')
        } catch (error) {
            toast.error('Failed to change password')
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Profile Management</h2>
            <form onSubmit={handleUpdateProfile} className="mb-6">
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                    <Input
                        id="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                    />
                </div>
                <Button type="submit">Update Profile</Button>
            </form>

            <h3 className="text-xl font-bold mb-2">Change Password</h3>
            <form onSubmit={handleChangePassword}>
                <div className="mb-4">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                    <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit">Change Password</Button>
            </form>
        </div>
    )
}