"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

interface Topic {
    id: string;
    name: string;
    description: string | null;
    childTopics: Topic[];
}

interface Subject {
    id: string;
    name: string;
}

export default function TopicSelectionPage() {
    const params = useParams();
    const year = params.year as string;
    const subjectId = params.subjectId as string;

    const [topics, setTopics] = useState<Topic[]>([]);
    const [subject, setSubject] = useState<Subject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch subject details
                const subjectRes = await axios.get(
                    `${API_URL}/subjects/${subjectId}`
                );
                if (subjectRes.data.success) {
                    setSubject(subjectRes.data.data);
                }

                // Fetch topics hierarchy
                const topicsRes = await axios.get(
                    `${API_URL}/topics/subject/${subjectId}/hierarchy`
                );
                if (topicsRes.data.success) {
                    setTopics(topicsRes.data.data);
                } else {
                    setError("Failed to fetch topics");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching data");
            } finally {
                setLoading(false);
            }
        };

        if (subjectId) {
            fetchData();
        }
    }, [subjectId]);

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
                <Link href={`/study-material/${year}`} className="text-blue-600 hover:underline mt-4 block">
                    Go back to Subject Selection
                </Link>
            </div>
        );
    }

    const renderTopicList = (topics: Topic[]) => {
        return (
            <ul className="space-y-2">
                {topics.map((topic) => (
                    <li key={topic.id} className="border-l-2 border-gray-200 pl-4 ml-2">
                        <Link
                            href={`/study-material/topic/${topic.id}`}
                            className="block py-2 text-gray-700 hover:text-blue-600 transition-colors"
                        >
                            <span className="font-medium">{topic.name}</span>
                            {topic.description && (
                                <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                            )}
                        </Link>
                        {topic.childTopics && topic.childTopics.length > 0 && (
                            <div className="mt-2">
                                {renderTopicList(topic.childTopics)}
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link
                    href={`/study-material/${year}`}
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
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {subject?.name || "Topics"}
                    </h1>
                    <p className="text-gray-600">Select a topic to start studying</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {topics.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No topics found for this subject.</p>
                ) : (
                    <div className="space-y-4">
                        {topics.map((topic) => (
                            <div key={topic.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                <Link
                                    href={`/study-material/topic/${topic.id}`}
                                    className="block group"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {topic.name}
                                        </h3>
                                        <svg
                                            className="h-5 w-5 text-gray-400 group-hover:text-blue-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </div>
                                    {topic.description && (
                                        <p className="text-sm text-gray-500 mt-1">{topic.description}</p>
                                    )}
                                </Link>

                                {/* Render subtopics if any exist in the top-level list (though usually we'd fetch them or they'd be nested) */}
                                {topic.childTopics && topic.childTopics.length > 0 && (
                                    <div className="mt-3 pl-4 border-l-2 border-blue-100">
                                        {topic.childTopics.map(subtopic => (
                                            <Link
                                                key={subtopic.id}
                                                href={`/study-material/topic/${subtopic.id}`}
                                                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                                            >
                                                {subtopic.name}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
