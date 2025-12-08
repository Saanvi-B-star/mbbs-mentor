"use client";

import { useState, useEffect, useRef } from "react";
import {
    GraduationCap,
    ChevronRight,
    ChevronLeft,
    Target,
    BookOpen,
    Stethoscope,
} from "lucide-react";

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [error, setError] = useState("");
    const [mounted, setMounted] = useState(false);

    const [formData, setFormData] = useState({
        year: "",
        university: "",
        learningGoal: [] as string[],
    });

    // const [goals] = useState([
    //     {
    //         id: "exam-prep",
    //         title: "Exam Preparation",
    //         desc: "Focus on university exams and competitive assessments",
    //     },
    //     {
    //         id: "concept-mastery",
    //         title: "Concept Mastery",
    //         desc: "Deep understanding of medical concepts",
    //     },
    //     {
    //         id: "clinical-skills",
    //         title: "Clinical Skills",
    //         desc: "Practical clinical application and case studies",
    //     },
    // ]);
    const [goals, setGoals] = useState<any[]>([]);
    const [loadingGoals, setLoadingGoals] = useState(true);

    useEffect(() => {
        async function fetchGoals() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                if (!apiUrl) {
                    console.warn("NEXT_PUBLIC_API_URL is not set");
                    setLoadingGoals(false);
                    return;
                }

                const res = await fetch(`${apiUrl}/student-goals/available`, {
                    method: "GET",
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`Failed to fetch goals: ${res.status} ${res.statusText}`, errorText);
                    setLoadingGoals(false);
                    return;
                }

                const data = await res.json();
                console.log("Goals fetched:", data);

                // FIX HERE:
                setGoals(data.data || []);
            } catch (err: unknown) {
                console.error("Error fetching goals:", err instanceof Error ? err.message : String(err));
            } finally {
                setLoadingGoals(false);
            }
        }

        fetchGoals();
    }, []);




    const uniRef = useRef<HTMLInputElement | null>(null);
    const autocompleteRef = useRef<any>(null);

    const totalSteps = 3;
    const progress = (step / totalSteps) * 100;

    // Fix hydration error - only calculate on client
    const [currentYear, setCurrentYear] = useState(2024);

    // Set mounted state to prevent hydration mismatch
    useEffect(() => {
        setMounted(true);
        setCurrentYear(new Date().getFullYear());
    }, []);

    // Initialize Google Autocomplete
    useEffect(() => {
        if (!mounted) return;

        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!API_KEY) {
            console.warn("Google Maps API key missing");
            return;
        }

        if (typeof window !== "undefined" && (window as any).google?.maps) {
            initAutocomplete();
            return;
        }

        if (!document.querySelector(`script[data-gmaps]`)) {
            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.setAttribute("data-gmaps", "true");
            script.onload = () => initAutocomplete();
            document.head.appendChild(script);
        } else {
            const check = setInterval(() => {
                if ((window as any).google?.maps) {
                    clearInterval(check);
                    initAutocomplete();
                }
            }, 200);
            return () => clearInterval(check);
        }
    }, [mounted]);

    function initAutocomplete() {
        if (!uniRef.current) return;
        if (!(window as any).google?.maps) return;
        if (autocompleteRef.current) return;

        autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
            uniRef.current,
            {
                types: ["establishment"],
                componentRestrictions: { country: "in" },
            }
        );

        try {
            autocompleteRef.current.setFields([
                "name",
                "formatted_address",
                "place_id",
                "geometry",
                "types",
            ]);
        } catch (e) {
            // ignore
        }

        autocompleteRef.current.addListener("place_changed", () => {
            const place = autocompleteRef.current!.getPlace();
            if (!place || !place.name) {
                setFormData((s) => ({ ...s, university: uniRef.current?.value ?? "" }));
                return;
            }

            setFormData((s) => ({ ...s, university: place.name }));
        });
    }

    const toggleGoal = (goalId: string) => {
        if (formData.learningGoal.includes(goalId)) {
            setFormData({
                ...formData,
                learningGoal: formData.learningGoal.filter((goalKey) => goalKey !== goalId),
            });
        } else {
            setFormData({
                ...formData,
                learningGoal: [...formData.learningGoal, goalId],
            });
        }
    };

    const handleNext = () => {
        setError("");

        if (step === 1) {
            if (!formData.year || !formData.university) {
                setError("Please fill in all fields to continue");
                return;
            }
        }

        if (step === 2) {
            if (formData.learningGoal.length === 0) {
                setError("Please select at least one learning goal to continue");
                return;
            }
        }

        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        setError("");
        if (step > 1) setStep(step - 1);
    };

    // const handleComplete = () => {
    //     try {
    //         // Optional: Save onboarding data to localStorage
    //         if (typeof window !== "undefined") {
    //             localStorage.setItem('onboardingData', JSON.stringify(formData));
    //         }

    //         // Redirect to dashboard
    //         window.location.href = "/dashboard";
    //     } catch (err) {
    //         console.error("Error during completion:", err);
    //         setError("Failed to complete setup. Please try again.");
    //     }
    // };

    const handleComplete = async () => {
        try {
            // Save onboarding data locally
            localStorage.setItem('onboardingData', JSON.stringify(formData));

            // Save goals in backend
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student-goals`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`, // or cookies
                },
                body: JSON.stringify({ goals: formData.learningGoal }),
            });

            // Redirect to dashboard
            window.location.href = "/dashboard";
        } catch (err) {
            console.error("Error saving goals", err);
            setError("Failed to complete setup. Please try again.");
        }
    };


    const nextSteps = [
        {
            num: "1",
            title: "Personalized Dashboard",
            desc: "AI curates topics based on your year and goals",
        },
        {
            num: "2",
            title: "Start Learning",
            desc: "Access NMC-aligned content and practice questions",
        },
        {
            num: "3",
            title: "Track Progress",
            desc: "Earn XP, unlock badges, and compete on leaderboards",
        },
    ];

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center space-x-2 mb-4">
                        <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">MBBS Mentor</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Let's personalize your experience
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Step {step} of {totalSteps}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Card Container */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="text-center mb-8">
                                <BookOpen className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Tell us about your studies
                                </h2>
                                <p className="text-gray-600 text-sm">
                                    We'll customize content based on your year and curriculum
                                </p>
                            </div>

                            <div className="space-y-6">
                                {/* Year Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Current Year
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[1, 2, 3, 4].map((year) => (
                                            <button
                                                key={year}
                                                onClick={() =>
                                                    setFormData({ ...formData, year: year.toString() })
                                                }
                                                className={`py-3 px-4 rounded-lg font-medium transition border-2 ${formData.year === year.toString()
                                                    ? "border-blue-600 bg-blue-50 text-blue-600"
                                                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                                                    }`}
                                            >
                                                {year === 4
                                                    ? `${year}th Year`
                                                    : `${year}${year === 1 ? "st" : year === 2 ? "nd" : "rd"
                                                    } Year`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* University */}
                                <div>
                                    <label
                                        htmlFor="university"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        Medical College/University
                                    </label>
                                    <input
                                        id="university"
                                        ref={uniRef}
                                        type="text"
                                        placeholder="e.g., AIIMS Delhi, JIPMER, etc."
                                        value={formData.university}
                                        onChange={(e) =>
                                            setFormData({ ...formData, university: e.target.value })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Start typing to see suggestions
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="text-center mb-8">
                                <Target className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Select your learning goals
                                </h2>
                                <p className="text-gray-600 text-sm">Pick one or more</p>
                            </div>

                            <div className="space-y-3">
                                {loadingGoals ? (
                                    <p className="text-gray-500 text-center text-sm">Loading goals...</p>
                                ) : goals.length > 0 ? (
                                    goals.map((goal) => (
                                        <button
                                            key={goal.type}   // UNIQUE KEY
                                            onClick={() => toggleGoal(goal.type)}  // SELECT GOAL BY TYPE
                                            className={`w-full text-left p-5 rounded-lg border-2 transition ${formData.learningGoal.includes(goal.type)
                                                    ? "border-blue-600 bg-blue-50"
                                                    : "border-gray-300 bg-white hover:border-gray-400"
                                                }`}
                                        >
                                            <p className="font-semibold text-gray-900 mb-1">
                                                {goal.label}  {/* Correct name from backend */}
                                            </p>

                                            {goal.description && (
                                                <p className="text-sm text-gray-600">
                                                    {goal.description}
                                                </p>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-center text-sm">
                                        No goals found.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="text-center mb-8">
                                <Stethoscope className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    You're all set! 🎉
                                </h2>
                                <p className="text-gray-600 text-sm">
                                    Your AI-powered dashboard is being prepared
                                </p>
                            </div>

                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 space-y-4">
                                <h3 className="font-semibold text-gray-900 text-lg">
                                    What happens next:
                                </h3>
                                <div className="space-y-3">
                                    {nextSteps.map((item) => (
                                        <div key={item.num} className="flex items-start gap-3">
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-medium flex-shrink-0">
                                                {item.num}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {item.title}
                                                </p>
                                                <p className="text-sm text-gray-600">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0">💡</div>
                                    <div>
                                        <p className="font-medium text-gray-900 mb-1">Pro Tip</p>
                                        <p className="text-sm text-gray-600">
                                            Study for just 5 minutes daily to maintain your streak
                                            and unlock special rewards!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            {step === totalSteps ? "Complete Setup" : "Continue"}
                            {step < totalSteps && <ChevronRight className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}