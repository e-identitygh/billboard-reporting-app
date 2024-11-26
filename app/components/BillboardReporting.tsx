'use client'

import { useState, useRef, useCallback } from 'react';
import { Camera, MapPin, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { db, storage } from '../utils/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserDashboard from "@/app/components/UserDashboard";

export default function BillboardReporting({ user = { uid: 'default-uid' } }) {
    const [images, setImages] = useState<string[]>([]);
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
    const [flag, setFlag] = useState('');
    const [report, setReport] = useState('');
    const [title, setTitle] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [fileNames, setFileNames] = useState<string[]>([]);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setShowCamera(true);
            }
        } catch (err) {
            if (err instanceof Error) {
                toast.error("Error accessing camera: " + err.message);
            } else {
                toast.error("Error accessing camera");
            }
        }
    };

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            setShowCamera(false);
        }
    }, []);

    const captureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const imageDataUrl = canvasRef.current.toDataURL('image/jpeg');
                setImages(prev => [...prev, imageDataUrl].slice(0, 4));
                stopCamera();
            }
        }
    }, [stopCamera]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setIsUploading(true);
            const newImages: string[] = [];
            const newFileNames: string[] = [];

            Array.from(files).slice(0, 4 - images.length).forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (event.target?.result) {
                        newImages.push(event.target.result as string);
                        newFileNames.push(file.name);
                        if (newImages.length === Math.min(files.length, 4 - images.length)) {
                            setImages(prev => [...prev, ...newImages].slice(0, 4));
                            setFileNames(prev => [...prev, ...newFileNames].slice(0, 4));
                            setIsUploading(false);
                        }
                    }
                };
                reader.onerror = (error) => {
                    toast.error(`Error uploading image: ${error}`);
                    setIsUploading(false);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setFileNames(prev => prev.filter((_, i) => i !== index));
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    toast.error("Error getting location: " + error.message);
                }
            );
        } else {
            toast.error("Geolocation is not supported by this browser.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            toast.error("Title is required!");
            return;
        }

        if (images.length === 0 || !coordinates || !flag || !report) {
            toast.error('Please fill in all fields and upload at least one image');
            return;
        }

        try {
            setIsUploading(true);

            const imageUrls = await Promise.all(images.map(async (image, index) => {
                const response = await fetch(image);
                const blob = await response.blob();
                const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${index}.jpg`;
                const storageRef = ref(storage, `billboards/${uniqueFileName}`);
                const metadata = { contentType: 'image/jpeg' };
                await uploadBytes(storageRef, blob, metadata);
                return getDownloadURL(storageRef);
            }));

            const reportData = {
                title,
                imageUrls,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                flag,
                description: report,
                userId: user.uid,
                createdAt: new Date(),
            };

            await addDoc(collection(db, 'reports'), reportData);

            toast.success("Report submitted successfully!");

            setImages([]);
            setCoordinates(null);
            setFlag('');
            setReport('');
            setTitle('');
            setFileNames([]);
        } catch (error) {
            console.error("Error submitting report:", error);
            toast.error(`Error submitting report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="container mx-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Card className="shadow-md p-4 rounded-lg bg-white mb-5" style={{height: 'calc(100% - 30px)'}}>
                            <CardContent>
                                <UserDashboard user={user}/>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
                        <Card className="shadow-lg p-8 rounded-lg bg-white w-full max-w-lg">
                            <CardContent>
                                <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-6">Report a
                                    Billboard</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="p-4 bg-gray-50 shadow-lg rounded-md space-y-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Report
                                                Title</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Enter a title for your report"
                                                className="w-full p-3 border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Billboard
                                                Images (Max 4)</label>
                                            <div
                                                className="mt-1 flex flex-wrap items-center justify-center space-x-2 space-y-2">
                                                {images.map((image, index) => (
                                                    <div key={index} className="relative mb-2 w-full sm:w-auto">
                                                        <img src={image} alt={`Billboard ${index + 1}`}
                                                             className="h-32 w-full sm:w-32 object-cover rounded-md"/>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="icon"
                                                            className="absolute top-0 right-0 rounded-full"
                                                            onClick={() => removeImage(index)}
                                                        >
                                                            <X className="h-4 w-4"/>
                                                            <span className="sr-only">Remove image</span>
                                                        </Button>
                                                    </div>
                                                ))}
                                                {images.length < 4 && (
                                                    <>
                                                        {showCamera ? (
                                                            <div className="relative mb-2 w-full sm:w-auto">
                                                                <video ref={videoRef} autoPlay
                                                                       className="h-48 w-full sm:w-64 object-cover rounded-md"/>
                                                                <div
                                                                    className="absolute bottom-2 left-2 right-2 flex justify-center space-x-2">
                                                                    <Button type="button"
                                                                            onClick={captureImage}>Capture</Button>
                                                                    <Button type="button" variant="secondary"
                                                                            onClick={stopCamera}>Cancel</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="h-32 w-full sm:w-32 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-md">
                                                                <Camera className="h-8 w-8 text-gray-400"/>
                                                            </div>
                                                        )}
                                                        {!showCamera && (
                                                            <div
                                                                className="flex flex-col items-center space-y-2 w-full sm:w-auto">
                                                                <Button type="button" onClick={startCamera}>
                                                                    Use Camera
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={() => document.getElementById('file-upload')?.click()}
                                                                    variant="outline"
                                                                    className="w-full"
                                                                    disabled={isUploading}
                                                                >
                                                                    {isUploading ? "Uploading..." : "Upload Images"}
                                                                </Button>
                                                                <input
                                                                    id="file-upload"
                                                                    name="file-upload"
                                                                    type="file"
                                                                    accept="image/*"
                                                                    multiple
                                                                    onChange={handleImageUpload}
                                                                    className="hidden"
                                                                />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            {fileNames.length > 0 && (
                                                <p className="text-sm text-gray-500 mt-2 text-center">
                                                    Selected files: {fileNames.join(', ')}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label
                                                className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                            <div className="mt-1 flex flex-wrap items-center justify-center space-x-2">
                                                <Button type="button" onClick={handleGetLocation}>
                                                    <MapPin className="h-5 w-5 mr-2"/>
                                                    Get Current Location
                                                </Button>
                                                {coordinates && (
                                                    <span className="text-sm text-gray-500">
                                    Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                                </span>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Flag</label>
                                            <Select value={flag} onValueChange={setFlag}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select Flag"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="red">Red (Damaged)</SelectItem>
                                                    <SelectItem value="yellow">Yellow (Needs Attention)</SelectItem>
                                                    <SelectItem value="green">Green (Good Condition)</SelectItem>
                                                    <SelectItem value="orange">Orange (Next to a
                                                        competitor)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Report
                                                Description</label>
                                            <Textarea
                                                id="report"
                                                value={report}
                                                onChange={(e) => setReport(e.target.value)}
                                                placeholder="Provide a detailed description of the issue"
                                                rows={4}
                                                className="w-full p-3 border border-gray-300 rounded-md"
                                            />
                                        </div>

                                        <div className="mt-4">
                                            <Button type="submit" className="w-full" disabled={isUploading}>
                                                {isUploading ? "Submitting..." : "Submit Report"}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                            <canvas ref={canvasRef} className="hidden" width="640" height="480"/>
                        </Card>
                    </div>
                </div>
                <ToastContainer/>
            </div>
        </>
    );
}