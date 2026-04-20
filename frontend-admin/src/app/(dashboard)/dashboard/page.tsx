"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import apiClient from "@/lib/api-client";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [platformData, setPlatformData] = useState<any>(null);

  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const res = await apiClient.get('/analytics/platform');
        setPlatformData(res.data.data);
      } catch (e) {
        console.error("Failed to load platform stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlatformStats();
  }, []);

  const totalUsersValue = platformData?.totalUsers?.toString() || "0";
  const activeSessionsValue = platformData?.activeUsers?.toString() || "0";
  const totalTestsValue = platformData?.totalTests?.toString() || "0";
  const totalQuestionsValue = platformData?.totalQuestions?.toString() || "0";

  const stats = [
    {
      label: "Total Users",
      value: totalUsersValue,
      change: "Active",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
    },
    {
      label: "Active Users (30d)",
      value: activeSessionsValue,
      change: "Active",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6 text-purple-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      label: "Total Tests",
      value: totalTestsValue,
      change: "Completed",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6 text-purple-600"
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
      label: "Total Questions",
      value: totalQuestionsValue,
      change: "Bank",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6 text-purple-600"
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
  ];

  const recentUsers = [
    {
      name: "John Doe",
      email: "john@example.com",
      joined: "2 hours ago",
      status: "active",
    },
    {
      name: "Jane Smith",
      email: "jane@example.com",
      joined: "5 hours ago",
      status: "active",
    },
    {
      name: "Mike Johnson",
      email: "mike@example.com",
      joined: "1 day ago",
      status: "active",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">Platform overview and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading ? (
          <div className="col-span-full py-8 text-center text-gray-500">Loading platform statistics...</div>
        ) : (
          stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="h-12 w-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  {stat.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
          <div className="space-y-4">
            {recentUsers.map((user, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium mb-1">
                    {user.status}
                  </span>
                  <p className="text-xs text-gray-500">{user.joined}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-left font-medium">
              View All Users
            </button>
            <button className="w-full p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-left font-medium">
              Export Analytics
            </button>
            <button className="w-full p-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-left font-medium">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
