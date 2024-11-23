'use client'

import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getReports } from '../../utils/api';
import { Admin, getAllUsers, getAnalytics, getPendingBillboards } from "@/app/utils/admin";
import UserManagement from '../admin/UserManagement';
import ContentModeration from '../admin/ContentModeration';
import AnalyticsDashboard from '../admin/AnalyticsDashboard';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminDashboard({ user }) {
    const [activeTab, setActiveTab] = useState('users');
    const [billboards, setBillboards] = useState([]);
    const [users, setUsers] = useState([]);
    const [pendingBillboards, setPendingBillboards] = useState([]);
    const [analytics, setAnalytics] = useState({});
    const [filter, setFilter] = useState('');
    const [error, setError] = useState('');
    const [filteredBillboards, setFilteredBillboards] = useState([]);
    const [editingBillboard, setEditingBillboard] = useState(null);
    const [newDescription, setNewDescription] = useState('');
    const [newFlag, setNewFlag] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [deleteBillboard, setDeleteBillboard] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedBillboard, setExpandedBillboard] = useState(null);
    const [imageGallery, setImageGallery] = useState({ open: false, images: [], currentIndex: 0 });

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});

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
            setPendingBillboards(fetchedBillboards);
            setAnalytics(fetchedAnalytics);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(`Error fetching dashboard data: ${error.message}`);
        }
    }

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reports = await getReports();
                reports.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
                setBillboards(reports);
            } catch (error) {
                setError(`Error fetching reports: ${error.message}`);
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
    }, [billboards, filter]);

    useEffect(() => {
        if (mapRef.current) {
            mapInstance.current = L.map(mapRef.current).setView([40.7128, -74.0060], 4);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);

            Object.values(markersRef.current).forEach((marker) => mapInstance.current.removeLayer(marker));
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

                const marker = L.marker([billboard.latitude, billboard.longitude], { icon })
                    .addTo(mapInstance.current)
                    .bindPopup(popupContent);

                markersRef.current[billboard.id] = marker;
            });

            return () => {
                mapInstance.current.remove();
            };
        }
    }, [filteredBillboards]);

    const getMarkerColor = (flag) => {
        switch (flag) {
            case 'red': return 'red';
            case 'yellow': return 'yellow';
            case 'green': return 'green';
            case 'orange': return 'orange';
            default: return 'blue';
        }
    };

    const handleBillboardClick = (billboard) => {
        setExpandedBillboard(expandedBillboard === billboard.id ? null : billboard.id);
        if (mapInstance.current && markersRef.current[billboard.id]) {
            mapInstance.current.setView([billboard.latitude, billboard.longitude], 12);
            markersRef.current[billboard.id].openPopup();
        }
    };

    const generateGoogleMapsLink = (latitude, longitude) => {
        return `https://www.google.com/maps?q=${latitude},${longitude}`;
    };

    const handleEditClick = (billboard) => {
        setEditingBillboard(billboard);
        setNewDescription(billboard.description);
        setNewFlag(billboard.flag);
    };

    const handleSaveEdit = async () => {
        if (!newDescription || !newFlag) {
            alert('Please fill in both the description and flag.');
            return;
        }

        const updatedData = { description: newDescription, flag: newFlag };

        try {
            await Admin.editReport(editingBillboard.id, updatedData);
            setBillboards((prevBillboards) =>
                prevBillboards.map((b) =>
                    b.id === editingBillboard.id ? { ...b, ...updatedData } : b
                )
            );
            setEditingBillboard(null);
            setSuccessMessage('Report updated successfully!');
        } catch (error) {
            alert(`Failed to update report: ${error.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingBillboard(null);
    };

    const handleDeleteClick = (billboard) => {
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
            alert(`Failed to delete report: ${error.message}`);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm(false);
    };

    const openImageGallery = (images, startIndex = 0) => {
        setImageGallery({ open: true, images, currentIndex: startIndex });
    };

    const closeImageGallery = () => {
        setImageGallery({ open: false, images: [], currentIndex: 0 });
    };

    const nextImage = () => {
        setImageGallery(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex + 1) % prev.images.length
        }));
    };

    const prevImage = () => {
        setImageGallery(prev => ({
            ...prev,
            currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
        }));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <div className="mb-6 space-x-4">
                    <Button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'bg-primary' : ''}>
                        User Management
                    </Button>
                    <Button onClick={() => setActiveTab('content')} className={activeTab === 'content' ? 'bg-primary' : ''}>
                        Content Moderation
                    </Button>
                    <Button onClick={() => setActiveTab('analytics')} className={activeTab === 'analytics' ? 'bg-primary' : ''}>
                        Analytics
                    </Button>
                </div>
                {activeTab === 'users' && <UserManagement />}
                {activeTab === 'content' && <ContentModeration />}
                {activeTab === 'analytics' && <AnalyticsDashboard />}
            </div>

            <div>
                <label htmlFor="filter" className="block text-sm font-medium text-gray-700">
                    Filter Billboards
                </label>
                <input
                    type="text"
                    id="filter"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Filter by flag color or report content"
                />
            </div>
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
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

            <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {filteredBillboards.map((billboard) => (
                        <li
                            key={billboard.id}
                            onClick={() => handleBillboardClick(billboard)}
                            className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer"
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
                                        <div className="mt-2 flex space-x-2">
                                            {billboard.imageUrls.map((url, index) => (
                                                <img
                                                    key={index}
                                                    src={url}
                                                    alt={`Billboard ${index + 1}`}
                                                    className="w-20 h-20 object-cover rounded-md cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openImageGallery(billboard.imageUrls, index);
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
                                            className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(billboard);
                                            }}
                                            className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
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

            <Dialog open={imageGallery.open} onOpenChange={closeImageGallery}>
                <DialogContent className="sm:max-w-[800px]">
                    <div className="relative">
                        <img
                            src={imageGallery.images[imageGallery.currentIndex]}
                            alt={`Billboard ${imageGallery.currentIndex + 1}`}
                            className="w-full h-auto"
                        />
                        <Button
                            className="absolute top-1/2 left-2 transform -translate-y-1/2"
                            onClick={prevImage}
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                        <Button
                            className="absolute top-1/2 right-2 transform -translate-y-1/2"
                            onClick={nextImage}
                        >
                            <ChevronRight className="h-6 w-6" />
                        </Button>
                    </div>
                    <DialogClose asChild>
                        <Button className="mt-4">Close</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            {editingBillboard && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-md shadow-lg max-w-sm">
                        <h2 className="text-lg font-semibold mb-4">Edit Billboard</h2>
                        <textarea
                            className="w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none"
                            rows="4"
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
    );
}