"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

interface Subject {
    id: string;
    name: string;
    code: string;
    description: string;
    iconUrl: string | null;
}

export default function SubjectSelectionPage() {
    const params = useParams();
    const year = params.year as string;
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/subjects?mbbsYear=${year}`
                );
                if (response.data.success) {
                    setSubjects(response.data.data);
                } else {
                    setError("Failed to fetch subjects");
                }
            } catch (err) {
                console.error(err);
                setError("An error occurred while fetching subjects");
            } finally {
                setLoading(false);
            }
        };

        if (year) {
            fetchSubjects();
        }
    }, [year]);

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
                <Link href="/study-material" className="text-blue-600 hover:underline mt-4 block">
                    Go back to Year Selection
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link
                    href="/study-material"
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
                    <h1 className="text-2xl font-bold text-gray-900">Year {year} Subjects</h1>
                    <p className="text-gray-600">Select a subject to view topics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subject) => (
                    <Link
                        key={subject.id}
                        href={`/study-material/${year}/${subject.id}`}
                        className="block group"
                    >
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex items-start p-6 space-x-4">
                            <div className="h-16 w-16 rounded-lg bg-blue-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {subject.iconUrl ? (
                                    <img
                                        src={`${API_URL}${subject.iconUrl}`}
                                        alt={subject.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-blue-600">
                                        {subject.code.substring(0, 2)}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                                    {subject.name}
                                </h3>
                                <p className="text-sm text-gray-500 line-clamp-2">
                                    {subject.description}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
