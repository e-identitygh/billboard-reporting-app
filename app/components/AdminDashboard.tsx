import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getReports } from '../utils/api';
import { Admin } from "@/app/utils/admin";

export default function AdminDashboard({ user }) {
    const [billboards, setBillboards] = useState([]);
    const [filter, setFilter] = useState('');
    const [error, setError] = useState('');
    const [filteredBillboards, setFilteredBillboards] = useState([]);
    const [editingBillboard, setEditingBillboard] = useState(null);
    const [newDescription, setNewDescription] = useState('');
    const [newFlag, setNewFlag] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(false); // State to track delete confirmation modal
    const [deleteBillboard, setDeleteBillboard] = useState(null); // The billboard that will be deleted
    const [successMessage, setSuccessMessage] = useState('');
    const totalBillboards = billboards.length;

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]); // This will store our markers

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const reports = await getReports();
                // Sort the reports by title (or any other field as required)
                reports.sort((a, b) => a.title.localeCompare(b.title)); // Sorting alphabetically by title
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

            // Clear previous markers
            markersRef.current.forEach((marker) => mapInstance.current.removeLayer(marker));
            markersRef.current = [];

            filteredBillboards.forEach((billboard) => {
                const markerColor = getMarkerColor(billboard.flag);

                // Create the custom icon with dynamic color (SVG)
                const icon = L.divIcon({
                    className: 'custom-marker',
                    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                            <circle cx="12" cy="12" r="10" fill="${markerColor}" />
                        </svg>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    popupAnchor: [0, -30],
                });

                // Create the marker using the icon
                const marker = L.marker([billboard.latitude, billboard.longitude], { icon })
                    .addTo(mapInstance.current)
                    .bindPopup(`
                        <div>
                            <h3 class="font-bold">${billboard.title}</h3>
                            <p>Flag: ${billboard.flag}</p>
                            <p>Report: ${billboard.description}</p>
                            <a href="${billboard.imageUrl}" target="_blank">
                                <img src="${billboard.imageUrl}" alt="Billboard Image" style="width: 100%; height: auto; margin-top: 10px;" />
                            </a>
                            <p>Created At: ${new Date(billboard.createdAt.seconds * 1000).toLocaleString()}</p>
                        </div>
                        
                        
                    `);

                markersRef.current.push(marker);
            });

            return () => {
                mapInstance.current.remove();
            };
        }
    }, [filteredBillboards]);

    const getMarkerColor = (flag) => {
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
                return 'blue'; // Default color if flag is not red, yellow, or green
        }
    };

    const handleBillboardClick = (billboard) => {
        const marker = markersRef.current.find(
            (marker) =>
                marker._latlng.lat === billboard.latitude && marker._latlng.lng === billboard.longitude
        );

        if (marker) {
            mapInstance.current.setView([billboard.latitude, billboard.longitude], 12);
            marker.openPopup();
        }
    };

    // Function to generate the Google Maps link
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
            setSuccessMessage('Report updated successfully!'); // Show success message after update
        } catch (error) {
            alert(`Failed to update report: ${error.message}`);
        }
    };

    const handleCancelEdit = () => {
        setEditingBillboard(null);
    };

    const handleDeleteClick = (billboard) => {
        setDeleteBillboard(billboard); // Set the billboard to be deleted
        setDeleteConfirm(true); // Open the delete confirmation modal
    };

    const confirmDelete = async () => {
        if (!deleteBillboard) return;

        try {
            await Admin.deleteReport(deleteBillboard.id);
            setBillboards((prevBillboards) =>
                prevBillboards.filter((b) => b.id !== deleteBillboard.id)
            );
            setDeleteConfirm(false); // Close the delete confirmation modal
            setSuccessMessage('Report deleted successfully!'); // Show success message after delete
        } catch (error) {
            alert(`Failed to delete report: ${error.message}`);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm(false); // Close the delete confirmation modal
    };

    return (

        <div className="space-y-6">
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
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-md shadow-lg max-w-sm">
                        <p className="text-lg font-semibold">Are you sure you want to delete this report?</p>
                        <div className="mt-4">
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                            >
                                Yes, Delete
                            </button>
                            <button
                                onClick={cancelDelete}
                                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message Popup */}
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
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-indigo-600 truncate">{billboard.title}</p> {/* Display Title */}
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
                                            {billboard.flag}{" "}
                                            {billboard.flag === 'red' && '(Damaged)'}
                                            {billboard.flag === 'yellow' && '(Needs Attention)'}
                                            {billboard.flag === 'green' && '(Good Condition)'}
                                            {billboard.flag === 'orange' && '(Next to a competitor)'}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                    <div className="sm:flex">
                                        <p className="flex items-center text-sm text-gray-500">{billboard.description}</p>
                                    </div>
                                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                        <p>
                                            Lat: {billboard.latitude.toFixed(6)}, Lng: {billboard.longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </div>


                                {/* Created At Date */}
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <p className="font-bold text-gray-500">
                                        Created At: {new Date(billboard.createdAt.seconds * 1000).toLocaleString()}
                                    </p>
                                </div>

                                {/* Image */}
                                {billboard.imageUrl && (
                                    <div className="mt-4">
                                        <img
                                            src={billboard.imageUrl}
                                            alt={`Billboard ${billboard.id}`}
                                            style={{
                                                width: '20%',
                                                height: 'auto',
                                                borderRadius: '12px', // This will round the corners of the image
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Google Maps link */}
                                <div className="mt-4">
                                    <a
                                        href={generateGoogleMapsLink(billboard.latitude, billboard.longitude)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        View on Google Maps
                                    </a>
                                </div>
                                {editingBillboard && editingBillboard.id === billboard.id ? (
                                    <div className="mt-4">
                                        <textarea
                                            className="w-full px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-md"
                                            value={newDescription}
                                            onChange={(e) => setNewDescription(e.target.value)}
                                        />
                                        <select
                                            className="mt-2 w-full px-4 py-2 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-md"
                                            value={newFlag}
                                            onChange={(e) => setNewFlag(e.target.value)}
                                        >
                                            <option value="red">Red (Damaged)</option>
                                            <option value="yellow">Yellow (Needs Attention)</option>
                                            <option value="green">Green (Good Condition)</option>
                                            <option value="orange">Orange (Next to a competitor)</option>
                                        </select>
                                        <div className="mt-4">
                                            <button
                                                onClick={handleSaveEdit}
                                                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                            >
                                                Save Changes
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                className="ml-4 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (


                                    <div className="flex mt-4">
                                        <button
                                            onClick={() => handleEditClick(billboard)}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(billboard)}
                                            className="ml-4 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}

                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
