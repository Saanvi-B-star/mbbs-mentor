"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Image from "next/image";

interface StudyMaterial {
    id: string;
    title: string;
    content: string;
    summary: string | null;
    materialType: string;
    fileUrl: string | null;
    thumbnailUrl: string | null;
    source: string | null;
}

interface Subject {
    id: string;
    name: string;
    code: string;
}

interface Topic {
    id: string;
    name: string;
    subjectId: string;
    subject?: Subject;
}

export default function TopicContentPage() {
    const params = useParams();
    const router = useRouter();
    const topicId = params.topicId as string;

    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedSummaries, setExpandedSummaries] = useState<Set<string>>(new Set());
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

    const toggleSummary = (materialId: string) => {
        setExpandedSummaries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(materialId)) {
                newSet.delete(materialId);
            } else {
                newSet.add(materialId);
            }
            return newSet;
        });
    };

    const calculateReadingTime = (content: string) => {
        const wordsPerMinute = 200;
        const wordCount = content.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch topic with materials using the existing endpoint
                const response = await axios.get(
                    `${API_URL}/topics/${topicId}/materials`
                );

                if (response.data.success) {
                    const topicData = response.data.data;
                    setTopic(topicData);
                    setMaterials(topicData.studyMaterials || []);
                } else {
                    setError("Failed to fetch study materials");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching content");
            } finally {
                setLoading(false);
            }
        };

        if (topicId) {
            fetchData();
        }
    }, [topicId]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Skeleton Header */}
                <div className="animate-pulse">
                    <div className="h-4 w-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 w-64 bg-gray-300 rounded"></div>
                </div>
                {/* Skeleton Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Content</h3>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Home
                </Link>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link href="/study-material" className="hover:text-blue-600 transition-colors">
                    Study Material
                </Link>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {topic?.subject && (
                    <>
                        <span className="hover:text-blue-600 transition-colors">{topic.subject.name}</span>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </>
                )}
                <span className="text-gray-900 font-medium">{topic?.name}</span>
            </nav>

            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="Go back"
                        >
                            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {topic?.name || "Study Material"}
                        </h1>
                    </div>
                    <div className="ml-14 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {materials.length} {materials.length === 1 ? 'Material' : 'Materials'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        Bookmark
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Generate Quiz
                    </button>
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <svg className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Study Materials Yet</h3>
                    <p className="text-gray-500 mb-6">Study materials for this topic haven't been added yet.</p>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Browse Other Topics
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {materials.map((material) => {
                        const readingTime = calculateReadingTime(material.content);
                        const isSummaryExpanded = expandedSummaries.has(material.id);

                        return (
                            <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden border-l-4 border-l-blue-500">
                                {/* Material Header */}
                                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex-1">{material.title}</h2>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full uppercase whitespace-nowrap">
                                            {material.materialType}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                        {material.source && (
                                            <span className="flex items-center gap-1">
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Source: <span className="font-medium">{material.source}</span>
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {readingTime} min read
                                        </span>
                                    </div>
                                </div>

                                {/* Summary Box */}
                                {material.summary && (
                                    <div className="border-b border-blue-100">
                                        <button
                                            onClick={() => toggleSummary(material.id)}
                                            className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors text-left"
                                        >
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                                    </svg>
                                                    Quick Summary
                                                </h3>
                                                <svg
                                                    className={`w-5 h-5 text-blue-600 transition-transform ${isSummaryExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>
                                        {isSummaryExpanded && (
                                            <div className="p-6 bg-blue-50 border-t border-blue-100">
                                                <div className="prose prose-blue max-w-none text-blue-900">
                                                    <ReactMarkdown>{material.summary}</ReactMarkdown>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Main Content */}
                                <div className="p-6 md:p-8">
                                    {/* Image if available */}
                                    {(material.fileUrl || material.thumbnailUrl) && (
                                        <div className="mb-8">
                                            <div className="relative rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 group">
                                                <img
                                                    src={`${BACKEND_URL}${material.fileUrl || material.thumbnailUrl}`}
                                                    alt={material.title}
                                                    className="w-full h-auto max-h-96 object-contain cursor-pointer hover:scale-105 transition-transform duration-300"
                                                    onClick={() => setSelectedImage(`${BACKEND_URL}${material.fileUrl || material.thumbnailUrl}`)}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center pointer-events-none">
                                                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2 text-center italic">Click to enlarge</p>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="prose prose-base md:prose-lg max-w-none text-gray-800 leading-relaxed">
                                        <ReactMarkdown>{material.content || ""}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Image Lightbox Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-lg bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close lightbox"
                    >
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={selectedImage}
                        alt="Enlarged view"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
