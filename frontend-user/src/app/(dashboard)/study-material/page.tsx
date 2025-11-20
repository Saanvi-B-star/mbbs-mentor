"use client";

import Link from "next/link";

export default function StudyMaterialPage() {
    const years = [
        {
            id: 1,
            title: "First Year",
            description: "Pre-Clinical Subjects (Anatomy, Physiology, Biochemistry)",
            color: "bg-blue-500",
        },
        {
            id: 2,
            title: "Second Year",
            description: "Para-Clinical Subjects (Pathology, Microbiology, Pharmacology, etc.)",
            color: "bg-green-500",
        },
        {
            id: 3,
            title: "Third Year (Part 1)",
            description: "Clinical Subjects (Ophthalmology, ENT, Community Medicine, etc.)",
            color: "bg-yellow-500",
        },
        {
            id: 4,
            title: "Third Year (Part 2)",
            description: "Clinical Subjects (Medicine, Surgery, OBGY, Paediatrics, etc.)",
            color: "bg-red-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Study Material</h1>
                <p className="text-gray-600">Select your MBBS year to browse subjects</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {years.map((year) => (
                    <Link
                        key={year.id}
                        href={`/study-material/${year.id}`}
                        className="block group"
                    >
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                            <div className={`h-2 ${year.color}`}></div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {year.title}
                                    </span>
                                    <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                        <svg
                                            className="h-4 w-4 text-gray-400 group-hover:text-blue-500"
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
                                </div>
                                <p className="text-sm text-gray-500">{year.description}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
