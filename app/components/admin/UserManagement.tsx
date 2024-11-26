'use client';

import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser, getUserBillboards, getUserReports } from '../../utils/admin';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-toastify";
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
    createdAt?: { seconds: number };
}

interface Billboard {
    id: string;
    title: string;
    description: string;
    flag: string;
    createdAt: { seconds: number };
}

interface Report {
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: { seconds: number };
}

export default function UserManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userBillboards, setUserBillboards] = useState<Billboard[]>([]);
    const [userReports, setUserReports] = useState<Report[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [authenticated, setAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthenticated(true);
                fetchUsers().then(() => {});
            } else {
                setAuthenticated(false);
                setUsers([]);
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers.map(user => ({
                id: user.id,
                email: (user as User).email || '',
                role: (user as User).role || '',
                name: (user as User).name || '',
                createdAt: (user as User).createdAt || { seconds: 0 }
            } as User)));
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateUserRole(userId, newRole);
            toast.success('User role updated successfully');
            await fetchUsers(); // Refresh the user list
        } catch (error) {
            console.error('Failed to update user role:', error);
            toast.error('Failed to update user role');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteUser(userId);
                toast.success('User deleted successfully');
                await fetchUsers(); // Refresh the user list
            } catch (error) {
                console.error('Failed to delete user:', error);
                toast.error('Failed to delete user');
            }
        }
    };

    const handleUserClick = async (user: User) => {
        setSelectedUser(user);
        try {
            const [billboards, reports] = await Promise.all([
                getUserBillboards(user.id),
                getUserReports(user.id)
            ]);
            setUserBillboards(billboards.map(billboard => ({
                id: billboard.id,
                title: 'title' in billboard ? billboard.title : '',
                description: 'description' in billboard ? billboard.description : '',
                flag: 'flag' in billboard ? billboard.flag : '',
                createdAt: 'createdAt' in billboard ? billboard.createdAt : { seconds: 0 }
            } as Billboard)));
            setUserReports(reports.map(report => ({
                id: report.id,
                title: 'title' in report ? report.title : '',
                description: 'description' in report ? report.description : '',
                status: 'status' in report ? report.status : '',
                createdAt: 'createdAt' in report ? report.createdAt : { seconds: 0 }
            } as Report)));
            setIsDialogOpen(true);
        } catch (error) {
            console.error('Failed to fetch user details:', error);
            toast.error('Failed to fetch user details');
        }
    };

    if (!authenticated) {
        return <p>Please log in to view and manage users.</p>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeader>Name</TableHeader>
                            <TableHeader>Email</TableHeader>
                            <TableHeader>Role</TableHeader>
                            <TableHeader>Joined</TableHeader>
                            <TableHeader>Actions</TableHeader>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <button
                                        onClick={() => handleUserClick(user)}
                                        className="text-blue-600 hover:underline"
                                    >
                                        {user.email}
                                    </button>
                                </TableCell>
                                <TableCell>{user.role}</TableCell>
                                <TableCell>
                                    {user.createdAt
                                        ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                        : 'N/A'}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                        className="mr-2"
                                    >
                                        {user.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
                                    </Button>
                                    <Button onClick={() => handleDeleteUser(user.id)} variant="destructive">
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
                <DialogContent>
                    <div className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <p><strong>Name:</strong> {selectedUser.name || 'N/A'}</p>
                            <p><strong>Email:</strong> {selectedUser.email}</p>
                            <p><strong>Role:</strong> {selectedUser.role}</p>
                            {selectedUser.createdAt && (
                                <p><strong>Joined:</strong> {new Date(selectedUser.createdAt.seconds * 1000).toLocaleDateString()}</p>
                            )}
                            <Tabs defaultValue="billboards" className="mt-6">
                                <TabsList>
                                    <TabsTrigger value="billboards">Billboards</TabsTrigger>
                                    <TabsTrigger value="reports">Reports</TabsTrigger>
                                </TabsList>
                                <TabsContent value="billboards">
                                    <DialogDescription className="mb-2">User's Billboards</DialogDescription>
                                    {userBillboards.length > 0 ? (
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableHeader>Title</TableHeader>
                                                    <TableHeader>Description</TableHeader>
                                                    <TableHeader>Flag</TableHeader>
                                                    <TableHeader>Created At</TableHeader>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {userBillboards.map((billboard) => (
                                                    <TableRow key={billboard.id}>
                                                        <TableCell>{billboard.title}</TableCell>
                                                        <TableCell>{billboard.description}</TableCell>
                                                        <TableCell>{billboard.flag}</TableCell>
                                                        <TableCell>
                                                            {new Date(billboard.createdAt.seconds * 1000).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p>No billboards found for this user.</p>
                                    )}
                                </TabsContent>
                                <TabsContent value="reports">
                                    <DialogDescription className="mb-2">User's Reports</DialogDescription>
                                    {userReports.length > 0 ? (
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableHeader>Title</TableHeader>
                                                    <TableHeader>Description</TableHeader>
                                                    <TableHeader>Status</TableHeader>
                                                    <TableHeader>Created At</TableHeader>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {userReports.map((report) => (
                                                    <TableRow key={report.id}>
                                                        <TableCell>{report.title}</TableCell>
                                                        <TableCell>{report.description}</TableCell>
                                                        <TableCell>{report.status}</TableCell>
                                                        <TableCell>
                                                            {new Date(report.createdAt.seconds * 1000).toLocaleDateString()}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p>No reports found for this user.</p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                    <DialogClose asChild onClose={function (): void {
                        throw new Error('Function not implemented.');
                    }}>
                        <Button className="mt-4" onClick={() => setIsDialogOpen(false)}>Close</Button>
                    </DialogClose>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}