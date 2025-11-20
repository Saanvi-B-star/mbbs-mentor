"use client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, Trophy, ArrowRight } from 'lucide-react';
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  // Mock learning topics
  const learningTopics = [
    {
      id: 1,
      title: "Cardiovascular System",
      nmcCompetency: "Understand heart and circulation",
      difficulty: "medium",
      duration: 45,
      progress: 65,
    },
    {
      id: 2,
      title: "Pharmacology Basics",
      nmcCompetency: "Drug mechanisms and interactions",
      difficulty: "hard",
      duration: 60,
      progress: 30,
    },
    {
      id: 3,
      title: "Nervous System",
      nmcCompetency: "Neural pathways and functions",
      difficulty: "easy",
      duration: 30,
      progress: 85,
    },
  ];

  const stats = [
    {
      label: "Total Notes",
      value: "24",
      icon: (
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      label: "Study Hours",
      value: "42",
      icon: (
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: "AI Queries",
      value: "156",
      icon: (
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
    },
    {
      label: "Topics Mastered",
      value: "12",
      icon: (
        <svg
          className="h-6 w-6 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const recentNotes = [
    {
      title: "Cardiovascular System",
      date: "2 days ago",
      subject: "Anatomy",
    },
    {
      title: "Pharmacology Basics",
      date: "3 days ago",
      subject: "Pharmacology",
    },
    {
      title: "Nervous System",
      date: "5 days ago",
      subject: "Physiology",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Welcome Section - Styled from React Dashboard */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 p-10 text-white shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            className="absolute inset-0"
            fill="none"
          >
            <circle fill="#fff" fillOpacity="0.05" cx="30" cy="30" r="30" />
          </svg>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold">Welcome back, {user?.name}! 👋</h1>
          <p className="mt-3 text-blue-50 text-lg font-medium">Ready to continue your learning journey?</p>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3 relative z-10">
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Flame className="h-8 w-8 text-orange-200" />
            </div>
            <div>
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm text-white/90 font-medium">Day Streak</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Target className="h-8 w-8 text-yellow-200" />
            </div>
            <div>
              <p className="text-3xl font-bold">2450</p>
              <p className="text-sm text-white/90 font-medium">Total XP</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Trophy className="h-8 w-8 text-green-200" />
            </div>
            <div>
              <p className="text-3xl font-bold">8</p>
              <p className="text-sm text-white/90 font-medium">Badges Earned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Learning Topics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">📚 Today's Recommended Topics</h2>
          <Button
            variant="ghost"
            onClick={() => router.push('/learning')}
            className="hover:text-blue-600"
          >
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {learningTopics.map((topic) => (
            <Card
              key={topic.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge
                    variant={topic.difficulty === 'easy' ? 'default' : topic.difficulty === 'medium' ? 'secondary' : 'destructive'}
                    className="rounded-full px-3 py-1"
                  >
                    {topic.difficulty}
                  </Badge>
                  <span className="text-sm text-gray-600 font-medium">{topic.duration} min</span>
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors mt-4">
                  {topic.title}
                </CardTitle>
                <CardDescription className="text-sm mt-2">{topic.nmcCompetency}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-blue-600">{topic.progress}%</span>
                  </div>
                  <Progress value={topic.progress} className="h-2.5" />
                  <Button
                    className="mt-4 w-full rounded-full hover:scale-105 transition-transform duration-300 bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push('/learning')}
                  >
                    {topic.progress > 0 ? 'Continue' : 'Start Learning'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
                {stat.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Notes</h2>
          <div className="space-y-4">
            {recentNotes.map((note, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-300"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{note.title}</h3>
                  <p className="text-sm text-gray-600">{note.subject}</p>
                </div>
                <span className="text-xs text-gray-500">{note.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-left font-medium">
              Create New Note
            </button>
            <button className="w-full p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-left font-medium">
              Ask AI Assistant
            </button>
            <button className="w-full p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-left font-medium">
              View Study Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}