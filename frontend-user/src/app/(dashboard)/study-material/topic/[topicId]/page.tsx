"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import ReactMarkdown from "react-markdown";

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

interface Topic {
    id: string;
    name: string;
    subjectId: string;
}

export default function TopicContentPage() {
    const params = useParams();
    const router = useRouter();
    const topicId = params.topicId as string;

    const [materials, setMaterials] = useState<StudyMaterial[]>([]);
    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

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
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-600 p-8">
                <p>{error}</p>
                <button onClick={() => router.back()} className="text-blue-600 hover:underline mt-4 block mx-auto">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header & Navigation */}
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg
                        className="h-6 w-6 text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {topic?.name || "Study Material"}
                    </h1>
                </div>
            </div>

            {materials.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <p className="text-gray-500">No study material available for this topic yet.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {materials.map((material) => (
                        <div key={material.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Material Header */}
                            <div className="p-6 border-b border-gray-100 bg-gray-50">
                                <h2 className="text-2xl font-bold text-gray-900">{material.title}</h2>
                                {material.source && (
                                    <p className="text-sm text-gray-500 mt-1">Source: {material.source}</p>
                                )}
                            </div>

                            {/* Summary Box */}
                            {material.summary && (
                                <div className="p-6 bg-blue-50 border-b border-blue-100">
                                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-2 flex items-center">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Quick Summary
                                    </h3>
                                    <div className="prose prose-blue max-w-none text-blue-900">
                                        <ReactMarkdown>{material.summary}</ReactMarkdown>
                                    </div>
                                </div>
                            )}

                            {/* Main Content */}
                            <div className="p-8">
                                {/* Image if available */}
                                {(material.fileUrl || material.thumbnailUrl) && (
                                    <div className="mb-8 rounded-lg overflow-hidden border border-gray-200">
                                        <img
                                            src={`${BACKEND_URL}${material.fileUrl || material.thumbnailUrl}`}
                                            alt={material.title}
                                            className="w-full h-auto"
                                        />
                                    </div>
                                )}

                                <div className="prose prose-lg max-w-none text-gray-800">
                                    <ReactMarkdown>{material.content || ""}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
