'use client';

import React, { useEffect, useState } from 'react';
import { getUserReports, deleteBillboard } from '../../utils/userApi'; // Adjust the import path as needed
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {X as CloseIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog } from "@/components/ui/dialog";
import { doc, updateDoc } from "firebase/firestore";
import {db} from "@/app/utils/firebase"; // Import named exports properly

type Report = {
    id: string;
    title?: string;
    content?: string;
    imageUrls?: string[];
    latitude?: number;
    longitude?: number;
    flag?: string;
    description?: string;
    createdAt?: any;
};

interface Billboard {
    id: string;
    title: string;
    content: string;
    imageUrls: string[];
    latitude: number;
    longitude: number;
    flag: string;
    description: string;
    createdAt: any;
}

interface BillboardManagementProps {
    userId: string;
}

const BillboardManagement: React.FC<BillboardManagementProps> = ({ userId }) => {
    const [billboards, setBillboards] = useState<Billboard[]>([]);
    const [expandedReport, setExpandedReport] = useState<string | null>(null);
    const [editingReport, setEditingReport] = useState<Billboard | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [enlargedImageIndex, setEnlargedImageIndex] = useState<number | null>(null);
    const itemsPerPage = 5;

    const fetchBillboards = async () => {
        try {
            setLoading(true);
            const fetchedBillboards = await getUserReports(userId);
            const fullBillboards: Billboard[] = fetchedBillboards.map((report: Report) => ({
                id: report.id,
                title: report.title || 'Default Title',
                content: report.content || 'Default Content',
                imageUrls: report.imageUrls || [],
                latitude: report.latitude || 0,
                longitude: report.longitude || 0,
                flag: report.flag || 'Default Flag',
                description: report.description || 'Default Description',
                createdAt: report.createdAt || new Date(),
            }));

            fullBillboards.sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
            setBillboards(fullBillboards);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching billboards.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillboards();
    }, [userId]);

    const handleDeleteConfirm = async () => {
        if (showDeleteConfirm) {
            try {
                await deleteBillboard(showDeleteConfirm);
                await fetchBillboards();
                setExpandedReport(null);
                setShowDeleteConfirm(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error deleting billboard.');
            }
        }
    };

    const handleEdit = (billboard: Billboard) => {
        setEditingReport(billboard);
    };

    const handleSaveEdit = async () => {
        if (editingReport) {
            try {
                const docRef = doc(db, 'reports', editingReport.id);
                const { id, ...updatedData } = editingReport;
                await updateDoc(docRef, updatedData); // Implement this function to save the report data to your backend
                setEditingReport(null);
                alert('Report saved successfully');
                await fetchBillboards(); // Refresh the list of billboards
            } catch (error) {
                console.error('Failed to save the report:', error);
                alert('Failed to save the report');
            }
        }
    };

    const handleNextPage = () => {
        setCurrentPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    const handlePageClick = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const totalPages = Math.ceil(billboards.length / itemsPerPage);

    const currentBillboards = billboards.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const googleMapsLink = (latitude: number, longitude: number) =>
        `https://www.google.com/maps?q=${latitude},${longitude}`;

    const handlePreviousImage = () => {
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? 0 : prevIndex - 1));
    };

    const handleNextImage = () => {
        const currentBillboard = billboards.find((b) => b.id === expandedReport);
        if (currentBillboard) {
            setCurrentImageIndex((prevIndex) =>
                prevIndex === (currentBillboard.imageUrls.length || 1) - 1 ? prevIndex : prevIndex + 1
            );
        }
    };

    const handlePreviousEnlargedImage = () => {
        setEnlargedImageIndex((prevIndex) => (prevIndex === null || prevIndex === 0 ? 0 : (prevIndex as number) - 1));
    };

    const handleNextEnlargedImage = () => {
        const currentBillboard = billboards.find((b) => b.id === expandedReport);
        if (currentBillboard && enlargedImageIndex !== null) {
            setEnlargedImageIndex((prevIndex) =>
                prevIndex === (currentBillboard.imageUrls.length || 1) - 1 ? prevIndex : (prevIndex as number) + 1
            );
        }
    };

    const handleDoubleClick = (index: number) => {
        setEnlargedImageIndex(index);
    };

    const handleCloseEnlargedImage = () => {
        setEnlargedImageIndex(null);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 rounded-lg">
            <div className="flex justify-center items-center mb-6 space-x-4">
                <h2 className="text-3xl font-semibold">My Billboards</h2>
                <Button variant="secondary" onClick={fetchBillboards}>
                    Refresh
                </Button>
            </div>
            <div>
                {expandedReport === null ? (
                    currentBillboards.length === 0 ? (
                        <p className="text-center text-gray-500 text-lg">No billboards found.</p>
                    ) : (
                        currentBillboards.map((billboard) => (
                            <Card
                                key={billboard.id}
                                className="mb-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                                onClick={() => {
                                    setExpandedReport(billboard.id);
                                    setCurrentImageIndex(0);
                                }}
                            >
                                <CardHeader className="relative flex justify-between items-center">
                                    <CardTitle className="text-xl font-bold text-gray-800">{billboard.title}</CardTitle>
                                </CardHeader>
                            </Card>
                        ))
                    )
                ) : (
                    billboards.map((billboard) => (
                        <Card key={billboard.id} className={`mb-4 ${expandedReport === billboard.id ? '' : 'hidden'}`}>
                            <CardHeader className="relative flex items-center bg-gray-100 p-4 rounded-t-lg">
                                <CardTitle className="text-xl font-bold text-gray-800 relative ">{billboard.title}</CardTitle>
                                {expandedReport === billboard.id && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-0 right-0 rounded-full"
                                        onClick={() => setExpandedReport(null)}
                                    >
                                        <CloseIcon className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            {expandedReport === billboard.id && (
                                <CardContent className="p-6 bg-white rounded-b-lg flex">
                                    <div className="flex-1">
                                        <p className="text-gray-700 mb-2"><strong>Date Created:</strong> {billboard.createdAt.toDate().toLocaleString()}</p>
                                        <p className="text-gray-700 mb-2"><strong>Flag:</strong> {billboard.flag}</p>
                                        <p className="text-gray-700 mb-2"><strong>Description:</strong> {billboard.description}</p>
                                        <p className="text-gray-700 mb-4"><strong>Location:</strong> {billboard.latitude}, {billboard.longitude}</p>
                                        <a
                                            href={googleMapsLink(billboard.latitude, billboard.longitude)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 underline mb-4 block"
                                        >
                                            View on Google Maps
                                        </a>
                                        <div className="flex space-x-4 mt-4">
                                            <Button variant="secondary" onClick={() => handleEdit(billboard)}>Edit</Button>
                                            <Button variant="destructive" onClick={() => setShowDeleteConfirm(billboard.id)}>Delete</Button>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-6 relative">
                                        {billboard.imageUrls && billboard.imageUrls.length ? (
                                            <div className="relative w-40 h-auto rounded overflow-hidden cursor-pointer" onDoubleClick={() => handleDoubleClick(currentImageIndex)}>
                                                <img
                                                    src={billboard.imageUrls[currentImageIndex]}
                                                    alt={`Billboard ${currentImageIndex + 1}`}
                                                    className="w-full h-auto rounded"
                                                />
                                                {billboard.imageUrls.length > 1 && (
                                                    <>
                                                        <Button
                                                            className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg"
                                                            onClick={handlePreviousImage}
                                                            disabled={currentImageIndex === 0}
                                                        >
                                                            <ChevronLeft className="h-6 w-6 text-gray-800" />
                                                        </Button>
                                                        <Button
                                                            className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg"
                                                            onClick={handleNextImage}
                                                            disabled={currentImageIndex === billboard.imageUrls.length - 1}
                                                        >
                                                            <ChevronRight className="h-6 w-6 text-gray-800" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No images available.</p>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
            <div className="flex flex-col items-center mt-8 space-y-4 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
                <Button onClick={handlePreviousPage} disabled={currentPage === 1}>Previous</Button>
                <div className="flex flex-wrap justify-center space-x-2">
                    {Array.from({ length: totalPages }, (_, index) => (
                        <Button
                            key={index + 1}
                            onClick={() => handlePageClick(index + 1)}
                            disabled={currentPage === index + 1}
                        >
                            {index + 1}
                        </Button>
                    ))}
                </div>
                <Button onClick={handleNextPage} disabled={currentPage === totalPages}>Next</Button>
            </div>

            {editingReport && (
                <Dialog onClose={() => setEditingReport(null)} isOpen={!!editingReport}>
                    <h2 className="text-xl font-semibold mb-4">Edit Report</h2>
                    <Input
                        type="text"
                        value={editingReport.title}
                        onChange={(e) => setEditingReport((prev) => ({ ...(prev as Billboard), title: e.target.value }))}
                        className="mb-4"
                    />
                    <Textarea
                        value={editingReport.description}
                        onChange={(e) => setEditingReport((prev) => ({ ...(prev as Billboard), description: e.target.value }))}
                        className="mb-4"
                    />
                    <div className="flex space-x-4">
                        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleSaveEdit}>Save</Button>
                        <Button variant="secondary" onClick={() => setEditingReport(null)}>Cancel</Button>
                    </div>
                </Dialog>
            )}

            {showDeleteConfirm && (
                <Dialog onClose={() => setShowDeleteConfirm(null)} isOpen={!!showDeleteConfirm}>
                    <h2 className="text-xl font-semibold mb-4">Confirm Deletion</h2>
                    <p className="text-gray-700 mb-6">Are you sure you want to delete this billboard?</p>
                    <div className="flex space-x-4">
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteConfirm}>Confirm</Button>
                    </div>
                </Dialog>
            )}

            {enlargedImageIndex !== null && (
                <Dialog onClose={handleCloseEnlargedImage} isOpen={true}>
                    <div className="relative flex items-center w-full h-full">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-0 right-0 rounded-full"
                            onClick={handleCloseEnlargedImage}
                        >
                            <CloseIcon className="h-6 w-6" />
                        </Button>
                        {enlargedImageIndex > 0 && (
                            <Button
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg"
                                onClick={handlePreviousEnlargedImage}
                            >
                                <ChevronLeft className="h-6 w-6 text-gray-800" />
                            </Button>
                        )}
                        <img
                            src={billboards.find((b) => b.id === expandedReport)?.imageUrls[enlargedImageIndex] || ''}
                            alt={`Enlarged Billboard ${enlargedImageIndex + 1}`}
                            className="max-w-full max-h-full mx-auto my-0"
                        />
                        {enlargedImageIndex < (billboards.find((b) => b.id === expandedReport)?.imageUrls.length || 0) - 1 && (
                            <Button
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-lg"
                                onClick={handleNextEnlargedImage}
                            >
                                <ChevronRight className="h-6 w-6 text-gray-800" />
                            </Button>
                        )}
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default BillboardManagement;