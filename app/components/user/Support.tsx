'use client'

import { useState } from 'react'
import { submitSupportRequest } from '../../utils/userApi'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "react-toastify"

export default function Support({ userId }: { userId: string }) {
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await submitSupportRequest(userId, message)
            toast.success('Support request submitted successfully')
            setMessage('')
        } catch (error) {
            toast.error('Failed to submit support request')
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Support</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        required
                    />
                </div>
                <Button type="submit">Submit Support Request</Button>
            </form>
        </div>
    )
}