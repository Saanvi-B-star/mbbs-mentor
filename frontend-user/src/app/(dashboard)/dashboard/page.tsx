"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, Trophy, ArrowRight, Loader2, BookOpen, Clock, MessageSquare, FileText, Sparkles } from 'lucide-react';
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

interface Analytics {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  totalStudyTime: number;
  aiInteractions: number;
  notesUploaded: number;
  strongSubjects: any[];
  weakSubjects: any[];
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuthStore();
  const router = useRouter();

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recsRes, notesRes] = await Promise.all([
          apiClient.get("/analytics/user"),
          apiClient.get("/analytics/recommendations"),
          apiClient.get("/notes?limit=5"),
          refreshUser(), // Refresh user profile to get latest tokens
        ]);
        setAnalytics(statsRes.data.data);
        setRecommendations(recsRes.data.data);
        setRecentNotes(notesRes.data.data?.notes || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = [
    {
      label: "Total Tests",
      value: analytics?.totalTests || 0,
      icon: <Target className="h-6 w-6 text-blue-600" />,
    },
    {
      label: "Study Minutes",
      value: analytics?.totalStudyTime || 0,
      icon: <Clock className="h-6 w-6 text-blue-600" />,
    },
    {
      label: "AI Queries",
      value: analytics?.aiInteractions || 0,
      icon: <MessageSquare className="h-6 w-6 text-blue-600" />,
    },
    {
      label: "Notes Uploaded",
      value: analytics?.notesUploaded || 0,
      icon: <FileText className="h-6 w-6 text-blue-600" />,
    },
  ];

  const subjects = [
    ...(analytics?.strongSubjects || []).map(s => ({ ...s, status: 'strong' })),
    ...(analytics?.weakSubjects || []).map(s => ({ ...s, status: 'weak' })),
  ].slice(0, 3);

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
          <p className="mt-3 text-blue-50 text-lg font-medium">Ready to continue your medical learning journey?</p>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3 relative z-10">
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Target className="h-8 w-8 text-orange-200" />
            </div>
            <div>
              <p className="text-3xl font-bold">{analytics?.totalTests || 0}</p>
              <p className="text-sm text-white/90 font-medium">Tests Done</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Flame className="h-8 w-8 text-yellow-200" />
            </div>
            <div>
              <p className="text-3xl font-bold">{user?.currentTokenBalance || 0}</p>
              <p className="text-sm text-white/90 font-medium">Available Tokens</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-white/15 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 cursor-pointer">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/20">
              <Trophy className="h-8 w-8 text-green-200" />
            </div>
            <div>
              <p className="text-3xl font-bold">{analytics?.averageScore || 0}%</p>
              <p className="text-sm text-white/90 font-medium">Avg Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Learning Topics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">🏫 Subject Performance</h2>
          <Button
            variant="ghost"
            onClick={() => router.push('/notes')}
            className="hover:text-blue-600"
          >
            View Materials <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.length > 0 ? subjects.map((subj) => (
            <Card
              key={subj.subjectId}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-blue-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge
                    variant={subj.status === 'strong' ? 'default' : 'secondary'}
                    className={`rounded-full px-3 py-1 ${subj.status === 'strong' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
                  >
                    {subj.status === 'strong' ? 'Strength' : 'Improvement needed'}
                  </Badge>
                  <span className="text-sm text-gray-600 font-medium">{subj.testsAttempted} tests</span>
                </div>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors mt-4">
                  {subj.subjectName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Accuracy</span>
                    <span className="font-semibold text-blue-600">{Math.round(subj.accuracy)}%</span>
                  </div>
                  <Progress value={subj.accuracy} className="h-2.5" />
                  <Button
                    variant="outline"
                    className="mt-4 w-full rounded-full border-blue-200 text-blue-600 hover:bg-blue-50"
                    onClick={() => router.push('/tests')}
                  >
                    Practice Questions
                  </Button>
                </div>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
               <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                 <Target className="h-6 w-6" />
               </div>
               <h3 className="text-lg font-semibold text-gray-900">No performance data yet</h3>
               <p className="text-gray-500">Take a few tests to see your subject-wise analysis here.</p>
               <Button onClick={() => router.push('/tests')} className="mt-4 bg-blue-600">Take First Test</Button>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Advice */}
      {recommendations.length > 0 && (
        <Card className="bg-blue-600 border-0 text-white overflow-hidden shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <h3 className="font-bold flex items-center gap-2">AI Study Recommendation</h3>
                <ul className="mt-2 space-y-1">
                  {recommendations.slice(0, 2).map((rec, i) => (
                    <li key={i} className="text-sm text-blue-50 flex items-start gap-2">
                       <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-300 shrink-0" />
                       {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Recent Notes</h2>
          <div className="space-y-4">
            {recentNotes.length > 0 ? recentNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => router.push(`/notes?id=${note.id}`)}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg group-hover:bg-blue-50 transition-colors">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 line-clamp-1">{note.title}</h3>
                    <p className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            )) : (
              <div className="py-8 text-center text-gray-500 text-sm italic">
                No notes uploaded yet.
              </div>
            )}
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