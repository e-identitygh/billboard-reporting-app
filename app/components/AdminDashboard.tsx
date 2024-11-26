'use client'

import {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {getReports} from '../utils/api';
import {Admin, getAllUsers, getAnalytics, getPendingBillboards} from "@/app/utils/admin";
import UserManagement from './admin/UserManagement';
import ContentModeration from './admin/ContentModeration';
import AnalyticsDashboard from './admin/AnalyticsDashboard';
import {Button} from "@/components/ui/button";
import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import {ErrorBoundary} from 'react-error-boundary';

interface Billboard {
    id: string;
    createdAt: { seconds: number };
    flag: string;
    description: string;
    imageUrls?: string[];
    latitude: number;
    longitude: number;
    title: string;
}

interface User {
    id: string;
}

interface AdminDashboardProps {
    user?: User
}

export default function AdminDashboard({user}: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState('users');
    const [billboards, setBillboards] = useState<Billboard[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [pendingBillboards, setPendingBillboards] = useState<Billboard[]>([]);
    const [analytics, setAnalytics] = useState<Record<string, any>>({});
    const [filter, setFilter] = useState('');
    const [error, setError] = useState('');
    const [filteredBillboards, setFilteredBillboards] = useState<Billboard[]>([]);
    const [editingBillboard, setEditingBillboard] = useState<Billboard | null>(null);
    const [newDescription, setNewDescription] = useState('');
    const [newFlag, setNewFlag] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteBillboard, setDeleteBillboard] = useState<Billboard | null>(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedBillboard, setExpandedBillboard] = useState<string | null>(null);
    const [enlargedImage, setEnlargedImage] = useState<string[] | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [fetchedUsers, fetchedBillboards, fetchedAnalytics] = await Promise.all([
                getAllUsers(),
                getPendingBillboards(),
                getAnalytics()
            ]);
            setUsers(fetchedUsers);
            setPendingBillboards(fetchedBillboards.map((billboard) => ({
                id: billboard.id,
                createdAt: 'createdAt' in billboard ? (billboard.createdAt as { seconds: number }) : {seconds: 0},
                flag: 'flag' in billboard ? (billboard.flag as string) : '',
                description: 'description' in billboard ? (billboard.description as string) : '',
                imageUrls: 'imageUrls' in billboard ? (billboard.imageUrls as string[] | undefined) : undefined,
                latitude: 'latitude' in billboard ? (billboard.latitude as number) : 0,
                longitude: 'longitude' in billboard ? (billboard.longitude as number) : 0,
                title: 'title' in billboard ? (billboard.title as string) : '',
            })));
            setAnalytics(fetchedAnalytics);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(`Error fetching dashboard data: ${(error as Error).message}`);
        }
    }

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reports = await getReports();
                // @ts-ignore
                reports.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setBillboards(reports.map(report => ({
                    id: report.id,
                    createdAt: 'createdAt' in report ? (report.createdAt as { seconds: number }) : {seconds: 0},
                    flag: 'flag' in report ? (report.flag as string) : '',
                    description: 'description' in report ? (report.description as string) : '',
                    imageUrls: 'imageUrls' in report ? (report.imageUrls as string[] | undefined) : undefined,
                    latitude: 'latitude' in report ? (report.latitude as number) : 0,
                    longitude: 'longitude' in report ? (report.longitude as number) : 0,
                    title: 'title' in report ? (report.title as string) : '',
                })));
            } catch (error) {
                setError(`Error fetching reports: ${(error as Error).message}`);
            }
        };

        fetchReports();
    }, []);

    useEffect(() => {
        const filtered = billboards.filter(
            (billboard) =>
                billboard.flag.includes(filter) ||
                billboard.description.toLowerCase().includes(filter.toLowerCase())
        );
        setFilteredBillboards(filtered);
        setCurrentPage(1);
    }, [billboards, filter]);

    useEffect(() => {
        if (mapRef.current && typeof window !== 'undefined') {
            try {
                if (!mapInstance.current) {
                    mapInstance.current = L.map(mapRef.current).setView([40.7128, -74.0060], 4);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
                }

                Object.values(markersRef.current).forEach((marker) => mapInstance.current?.removeLayer(marker));
                markersRef.current = {};

                filteredBillboards.forEach((billboard) => {
                    const markerColor = getMarkerColor(billboard.flag);

                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <circle cx="12" cy="12" r="10" fill="${markerColor}" />
                  </svg>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 30],
                        popupAnchor: [0, -30],
                    });

                    const popupContent = `
            <div>
              <h3 class="font-bold">${billboard.title}</h3>
              <p>Flag: ${billboard.flag}</p>
              <p>Report: ${billboard.description}</p>
              ${billboard.imageUrls && billboard.imageUrls.length > 0 ? `
                <img src="${billboard.imageUrls[0]}" alt="Billboard Image" style="width: 100%; height: auto; margin-top: 10px;" />
              ` : ''}
              <p>Created At: ${new Date(billboard.createdAt.seconds * 1000).toLocaleString()}</p>
            </div>
          `;

                    markersRef.current[billboard.id] = L.marker([billboard.latitude, billboard.longitude], {icon})
                        .addTo(mapInstance.current!)
                        .bindPopup(popupContent);
                });
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [filteredBillboards]);

    const getMarkerColor = (flag: string): string => {
        switch (flag) {
            case 'red':
                return 'red';
            case 'yellow':
                return 'yellow';
            case 'green':
                return 'green';
            case 'orange':
                return 'orange';
            default:
                return 'blue';
        }
    };

    const handleBillboardClick = (billboard: Billboard) => {
        setExpandedBillboard(expandedBillboard === billboard.id ? null : billboard.id);
        if (mapInstance.current && markersRef.current[billboard.id]) {
            mapInstance.current.setView([billboard.latitude, billboard.longitude], 12);
            markersRef.current[billboard.id].openPopup();
        }
    };

    const generateGoogleMapsLink = (latitude: number, longitude: number): string => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    const handleEditClick = (billboard: Billboard) => {
        setEditingBillboard(billboard);
        setNewDescription(billboard.description);
        setNewFlag(billboard.flag);
    };

    const handleSaveEdit = async () => {
        if (!editingBillboard || !newDescription || !newFlag) {
            alert('Please fill in both the description and flag.');
            return;
        }

        const updatedData = {description: newDescription, flag: newFlag};

        try {
            await Admin.editReport(editingBillboard.id, updatedData);
            setBillboards((prevBillboards) =>
                prevBillboards.map((b) =>
                    b.id === editingBillboard.id ? {...b, ...updatedData} : b
                )
            );
            setEditingBillboard(null);
            setSuccessMessage('Report updated successfully!');
        } catch (error) {
            alert(`Failed to update report: ${(error as Error).message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingBillboard(null);
    };

    const handleDeleteClick = (billboard: Billboard) => {
        setDeleteBillboard(billboard);
        setDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteBillboard) return;

        try {
            await Admin.deleteReport(deleteBillboard.id);
            setBillboards((prevBillboards) =>
                prevBillboards.filter((b) => b.id !== deleteBillboard.id)
            );
            setDeleteConfirm(false);
            setSuccessMessage('Report deleted successfully!');
        } catch (error) {
            alert(`Failed to delete report: ${(error as Error).message}`);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm(false);
    };

    const handleImageClick = (imageUrls: string[]) => {
        setEnlargedImage(imageUrls);
        setCurrentImageIndex(0);
    };

    const handleNextImage = () => {
        if (enlargedImage) {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % enlargedImage.length);
        }
    };

    const handlePrevImage = () => {
        if (enlargedImage) {
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + enlargedImage.length) % enlargedImage.length);
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBillboards.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(filteredBillboards.length / itemsPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <ErrorBoundary fallback={<div>Something went wrong. Please try again later.</div>}>
            <div className="space-y-6 p-6 bg-gray-100">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                    <div className="mb-6 space-x-4">
                        <Button onClick={() => setActiveTab('users')}
                                className={activeTab === 'users' ? 'bg-primary' : ''}>
                            User Management
                        </Button>
                        <Button onClick={() => setActiveTab('content')}
                                className={activeTab === 'content' ? 'bg-primary' : ''}>
                            Content Moderation
                        </Button>
                        <Button onClick={() => setActiveTab('analytics')}
                                className={activeTab === 'analytics' ? 'bg-primary' : ''}>
                            Analytics
                        </Button>
                    </div>
                    {activeTab === 'users' && <UserManagement/>}
                    {activeTab === 'content' && <ContentModeration/>}
                    {activeTab === 'analytics' && <AnalyticsDashboard analytics={{
                        ...analytics,
                        totalUsers: analytics.totalUsers,
                        totalBillboards: analytics.totalBillboards
                    }}/>}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                        Filter Billboards
                    </label>
                    <input
                        type="text"
                        id="filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Filter by flag color or report content"
                    />
                </div>

                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-md shadow-lg max-w-sm">
                            <p className="text-lg font-semibold">Are you sure you want to delete this report?</p>
                            <div className="mt-4 space-x-4">
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={cancelDelete}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-md shadow-lg max-w-sm">
                            <p className="text-lg font-semibold text-green-600">{successMessage}</p>
                            <div className="mt-4">
                                <button
                                    onClick={() => setSuccessMessage('')}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {error && <p className="text-red-500 text-sm">{error}</p>}

                <div ref={mapRef} className="h-[400px] w-full rounded-lg shadow-md"></div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                        {currentItems.map((billboard) => (
                            <li
                                key={billboard.id}
                                onClick={() => handleBillboardClick(billboard)}
                                className="px-4 py-4 hover:bg-gray-50 cursor-pointer transition duration-150 ease-in-out"
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{billboard.title}</p>
                                    <div className="ml-2 flex-shrink-0 flex">
                                        <p
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                billboard.flag === 'red'
                                                    ? 'bg-red-100 text-red-800'
                                                    : billboard.flag === 'yellow'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : billboard.flag === 'green'
                                                            ? 'bg-green-100 text-green-800'
                                                            : billboard.flag === 'orange'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : ''
                                            }`}
                                        >
                                            {billboard.flag}
                                        </p>
                                    </div>
                                </div>
                                {expandedBillboard === billboard.id && (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">{billboard.description}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Lat: {billboard.latitude.toFixed(6)}, Lng: {billboard.longitude.toFixed(6)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Created At: {new Date(billboard.createdAt.seconds * 1000).toLocaleString()}
                                        </p>
                                        {billboard.imageUrls && billboard.imageUrls.length > 0 && (
                                            <div className="mt-2 flex space-x-2 overflow-x-auto">
                                                {billboard.imageUrls.map((url, index) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`Billboard ${index + 1}`}
                                                        className="w-20 h-20 object-cover rounded-md cursor-pointer transition-transform hover:scale-105"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImageClick(billboard.imageUrls!);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        <div className="mt-2">
                                            <a
                                                href={generateGoogleMapsLink(billboard.latitude, billboard.longitude)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:underline"
                                            >
                                                View on Google Maps
                                            </a>
                                        </div>
                                        <div className="mt-2 space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(billboard);
                                                }}
                                                className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition duration-150 ease-in-out"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(billboard);
                                                }}
                                                className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition duration-150 ease-in-out"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex justify-center mt-4 space-x-2">
                    <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Previous
                    </button>
                    {pageNumbers.map((number) => (
                        <button
                            key={number}
                            onClick={() => paginate(number)}
                            className={`px-4 py-2 text-sm font-medium ${
                                currentPage === number
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-700 bg-white hover:bg-gray-50'
                            } border border-gray-300 rounded-md`}
                        >
                            {number}
                        </button>
                    ))}
                    <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === Math.ceil(filteredBillboards.length / itemsPerPage)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Next
                    </button>
                </div>

                {enlargedImage && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-[1000]">
                        <div className="relative max-w-4xl w-full h-full flex justify-center items-center">
                            <img
                                src={enlargedImage[currentImageIndex]}
                                alt={`Enlarged Billboard ${currentImageIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />
                            {enlargedImage.length > 1 && (
                                <>
                                    <button
                                        className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
                                        onClick={handlePrevImage}
                                    >
                                        <ChevronLeft className="h-6 w-6 text-black"/>
                                    </button>
                                    <button
                                        className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
                                        onClick={handleNextImage}
                                    >
                                        <ChevronRight className="h-6 w-6 text-black"/>
                                    </button>
                                </>
                            )}
                            <button
                                className="absolute top-4 right-4 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full p-2"
                                onClick={() => setEnlargedImage(null)}
                            >
                                <X className="h-6 w-6 text-black"/>
                            </button>
                        </div>
                    </div>
                )}

                {editingBillboard && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="bg-white p-6 rounded-md shadow-lg max-w-sm">
                            <h2 className="text-lg font-semibold mb-4">Edit Billboard</h2>
                            <textarea
                                className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                                rows={4}
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                            <select
                                className="mt-2 w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                                value={newFlag}
                                onChange={(e) => setNewFlag(e.target.value)}
                            >
                                <option value="red">Red (Damaged)</option>
                                <option value="yellow">Yellow (Needs Attention)</option>
                                <option value="green">Green (Good Condition)</option>
                                <option value="orange">Orange (Next to a competitor)</option>
                            </select>
                            <div className="mt-4 space-x-2">
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ErrorBoundary>
    );
}