"use client";

export default function AnalyticsPage() {
  const metrics = [
    { label: "Total Users", value: "1,234", period: "Last 30 days" },
    { label: "Active Users", value: "842", period: "Last 7 days" },
    { label: "Notes Created", value: "15,432", period: "All time" },
    { label: "AI Queries", value: "45,821", period: "Last 30 days" },
  ];

  const popularSubjects = [
    { subject: "Anatomy", notes: 4523, percentage: 29 },
    { subject: "Physiology", notes: 3821, percentage: 25 },
    { subject: "Pharmacology", notes: 3142, percentage: 20 },
    { subject: "Pathology", notes: 2456, percentage: 16 },
    { subject: "Biochemistry", notes: 1490, percentage: 10 },
  ];

  const userActivity = [
    { day: "Mon", users: 654 },
    { day: "Tue", users: 712 },
    { day: "Wed", users: 823 },
    { day: "Thu", users: 791 },
    { day: "Fri", users: 845 },
    { day: "Sat", users: 567 },
    { day: "Sun", users: 432 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Platform usage statistics and insights
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">
              {metric.value}
            </p>
            <p className="text-xs text-gray-500">{metric.period}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Popular Subjects
          </h2>
          <div className="space-y-4">
            {popularSubjects.map((item) => (
              <div key={item.subject}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {item.subject}
                  </span>
                  <span className="text-sm text-gray-600">{item.notes} notes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            User Activity (Last 7 Days)
          </h2>
          <div className="space-y-4">
            {userActivity.map((item) => (
              <div key={item.day} className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 w-12">
                  {item.day}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-8 flex items-center">
                  <div
                    className="bg-purple-600 h-8 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${(item.users / 1000) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {item.users}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Engagement Metrics
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avg. Session Duration</p>
              <p className="text-2xl font-bold text-gray-900">24 mins</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Notes per User</p>
              <p className="text-2xl font-bold text-gray-900">12.5</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">AI Queries per Day</p>
              <p className="text-2xl font-bold text-gray-900">1,527</p>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">API Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">Database</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="font-medium text-gray-900">AI Service</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
