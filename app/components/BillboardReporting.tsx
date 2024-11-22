'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, MapPin, Flag, X } from 'lucide-react'
import { createReport } from '../utils/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { db, storage } from '../utils/firebase'
import { collection, addDoc } from 'firebase/firestore'
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage'
import { toast, ToastContainer } from 'react-toastify'  // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css';  // Import styles for react-toastify

export default function BillboardReporting({ user = { uid: 'default-uid' } }) {
    const [image, setImage] = useState<string | null>(null)
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
    const [flag, setFlag] = useState('')
    const [report, setReport] = useState('')
    const [title, setTitle] = useState('') // Added state for title
    const [showCamera, setShowCamera] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [fileName, setFileName] = useState('')
    const videoRef = useRef(null)
    const canvasRef = useRef(null)

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                setShowCamera(true)
            }
        } catch (err) {
            toast.error("Error accessing camera: " + err.message);  // Error handling with toast
        }
    }

    const stopCamera = useCallback(() => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
            tracks.forEach(track => track.stop())
            setShowCamera(false)
        }
    }, [])

    const captureImage = useCallback(() => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d')
            if (context) {
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height)
                const imageDataUrl = canvasRef.current.toDataURL('image/jpeg')
                setImage(imageDataUrl)
                stopCamera()
            }
        }
    }, [stopCamera])

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setIsUploading(true)
            setFileName(file.name)
            const reader = new FileReader()
            reader.onload = (event) => {
                if (event.target?.result) {
                    setImage(event.target.result as string)
                    setIsUploading(false)
                }
            }
            reader.onerror = (error) => {
                toast.error(`Error uploading image: ${error}`);  // Error handling with toast
                setIsUploading(false)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCoordinates({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    })
                },
                (error) => {
                    toast.error("Error getting location: " + error.message);  // Error handling with toast
                }
            )
        } else {
            toast.error("Geolocation is not supported by this browser.");  // Error handling with toast
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title) {
            toast.error("Title is required!");  // Error toast notification
            return;
        }

        if (!image || !coordinates || !flag || !report) {
            toast.error('Please fill in all fields');  // Error toast notification
            return;
        }

        try {
            setIsUploading(true);

            const response = await fetch(image);
            const blob = await response.blob();

            const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;

            const storageRef = ref(storage, `billboards/${uniqueFileName}`);
            const metadata = {
                contentType: 'image/jpeg',
                customMetadata: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                }
            };

            await uploadBytes(storageRef, blob, metadata);
            const imageUrl = await getDownloadURL(storageRef);

            const reportData = {
                title,
                imageUrl,
                latitude: coordinates.lat,
                longitude: coordinates.lng,
                flag,
                description: report,
                userId: user.uid,
                createdAt: new Date()
            };

            await addDoc(collection(db, 'reports'), reportData);

            toast.success("Report submitted successfully!");  // Success toast notification

            setImage(null);
            setCoordinates(null);
            setFlag('');
            setReport('');
            setTitle('');
            setFileName('');
        } catch (error) {
            console.error("Error submitting report:", error);
            toast.error(`Error submitting report: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <>
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Report Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a title for your report"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Billboard Image</label>
                            <div className="mt-1 flex items-center space-x-4">
                                {image ? (
                                    <div className="relative">
                                        <img src={image} alt="Billboard" className="h-32 w-32 object-cover rounded-md" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-0 right-0 rounded-full"
                                            onClick={() => setImage(null)}
                                        >
                                            <X className="h-4 w-4" />
                                            <span className="sr-only">Remove image</span>
                                        </Button>
                                    </div>
                                ) : showCamera ? (
                                    <div className="relative">
                                        <video ref={videoRef} autoPlay className="h-48 w-64 object-cover rounded-md" />
                                        <div className="absolute bottom-2 left-2 right-2 flex justify-center space-x-2">
                                            <Button type="button" onClick={captureImage}>Capture</Button>
                                            <Button type="button" variant="secondary" onClick={stopCamera}>Cancel</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 w-32 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-md">
                                        <Camera className="h-8 w-8 text-gray-400" />
                                    </div>
                                )}
                                {!showCamera && (
                                    <div className="flex flex-col space-y-2">
                                        <Button type="button" onClick={startCamera}>
                                            Use Camera
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('file-upload').click()}
                                            variant="outline"
                                            className="w-full"
                                            disabled={isUploading}
                                        >
                                            {isUploading ? "Uploading..." : "Upload Image"}
                                        </Button>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                        {fileName && (
                                            <p className="text-sm text-gray-500">{fileName}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Location</label>
                            <div className="mt-1 flex items-center space-x-4">
                                <Button type="button" onClick={handleGetLocation}>
                                    <MapPin className="h-5 w-5 mr-2" />
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
                            <label className="block text-sm font-medium text-gray-700">Flag</label>
                            <Select value={flag} onValueChange={setFlag}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Flag" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="red">Red (Damaged)</SelectItem>
                                    <SelectItem value="yellow">Yellow (Needs Attention)</SelectItem>
                                    <SelectItem value="green">Green (Good Condition)</SelectItem>
                                    <SelectItem value="Orange">Orange (Next to a competitor)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Report Description</label>
                            <Textarea
                                value={report}
                                onChange={(e) => setReport(e.target.value)}
                                placeholder="Provide a detailed description of the issue"
                                rows={4}
                            />
                        </div>

                        <div className="mt-4">
                            <Button type="submit" className="w-full" disabled={isUploading}>
                                {isUploading ? "Submitting..." : "Submit Report"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
            <ToastContainer />  {/* Add ToastContainer here */}
        </>
    )
}
