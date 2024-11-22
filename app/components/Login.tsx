'use client'

import { useState, useEffect } from 'react'
import { login, register } from '../utils/api'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface LoginProps {
    onLogin: (userData: { uid: string; role: string; email: string | null }) => void;
}

interface Notification {
    type: 'success' | 'error';
    title: string;
    message: string;
}

export default function Login({ onLogin }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<Notification | null>(null);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const showNotification = (type: 'success' | 'error', title: string, message: string) => {
        setNotification({ type, title, message });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isRegistering) {
                await register(email, password);
                showNotification('success', 'Success', 'Registration successful. Please log in.');
                setIsRegistering(false);
            } else {
                const { user, role } = await login(email, password);
                onLogin({ email: user.email, uid: user.uid, role });
            }
        } catch (error: unknown) {
            showNotification('error', 'Error', error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>{isRegistering ? 'Register' : 'Login'}</CardTitle>
            </CardHeader>
            <CardContent>
                {notification && (
                    <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                        <AlertTitle>{notification.title}</AlertTitle>
                        <AlertDescription>{notification.message}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Processing...' : isRegistering ? 'Register' : 'Login'}
                    </Button>
                </form>
                <Button
                    variant="link"
                    className="mt-4 w-full"
                    onClick={() => setIsRegistering(!isRegistering)}
                >
                    {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                </Button>
            </CardContent>
        </Card>
    )
}

