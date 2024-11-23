'use client';

import { useState, useEffect } from 'react';
import { generateActivityReport, getAnalytics } from '../../utils/admin';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-toastify";

interface Analytics {
    totalUsers: number;
    totalBillboards: number;
}

interface AnalyticsProps {
    analytics: Analytics;
}

export default function AnalyticsDashboard({ analytics = { totalUsers: 0, totalBillboards: 0 } }: AnalyticsProps) {
    const [currentAnalytics, setCurrentAnalytics] = useState<Analytics>(analytics);
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('Fetching initial analytics data...');
                const freshAnalytics: Analytics = await getAnalytics();
                console.log('Fetched analytics data:', freshAnalytics);
                setCurrentAnalytics(freshAnalytics);
            } catch (error) {
                console.error('Failed to fetch initial analytics data:', error);
                toast.error('Failed to fetch initial analytics data');
                if (error.code === 'unavailable') {
                    setOffline(true);
                }
            }
        };

        fetchData();
    }, []);

    const handleGenerateReport = async () => {
        setLoading(true);
        try {
            const report = await generateActivityReport();
            console.log(report);
            toast.success('Activity report generated successfully');
        } catch (error) {
            console.error('Failed to generate activity report:', error);
            toast.error('Failed to generate activity report');
            if (error.code === 'unavailable') {
                setOffline(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
            {offline && <p className="text-red-600">You are currently offline. Some features may not be available.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{currentAnalytics.totalUsers}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Billboards</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{currentAnalytics.totalBillboards}</p>
                    </CardContent>
                </Card>
            </div>
            <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Activity Report'}
            </Button>
        </div>
    );
}