'use client'

import { useState, useEffect } from 'react'
import { getPendingBillboards, approveBillboard, deleteBillboard } from '../../utils/admin'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "react-toastify"

export default function ContentModeration() {
    const [pendingBillboards, setPendingBillboards] = useState([])

    useEffect(() => {
        fetchPendingBillboards()
    }, [])

    const fetchPendingBillboards = async () => {
        try {
            const billboards = await getPendingBillboards()
            setPendingBillboards(billboards)
        } catch (error) {
            toast.error('Failed to fetch pending billboards')
        }
    }

    const handleApproveBillboard = async (billboardId: string) => {
        try {
            await approveBillboard(billboardId)
            toast.success('Billboard approved successfully')
            fetchPendingBillboards()
        } catch (error) {
            toast.error('Failed to approve billboard')
        }
    }

    const handleDeleteBillboard = async (billboardId: string) => {
        if (window.confirm('Are you sure you want to delete this billboard?')) {
            try {
                await deleteBillboard(billboardId)
                toast.success('Billboard deleted successfully')
                fetchPendingBillboards()
            } catch (error) {
                toast.error('Failed to delete billboard')
            }
        }
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Content Moderation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBillboards.map((billboard) => (
                    <Card key={billboard.id}>
                        <CardHeader>
                            <CardTitle>{billboard.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <img src={billboard.imageUrl} alt="Billboard" className="w-full h-48 object-cover mb-4" />
                            <p>{billboard.description}</p>
                            <div className="mt-4 flex justify-between">
                                <Button onClick={() => handleApproveBillboard(billboard.id)}>Approve</Button>
                                <Button onClick={() => handleDeleteBillboard(billboard.id)} variant="destructive">Delete</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}