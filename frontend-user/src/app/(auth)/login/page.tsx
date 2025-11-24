"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Implement Google OAuth flow
    console.log("Google sign in clicked");
    // You'll need to implement the actual Google OAuth integration
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="h-10 w-10 rounded-lg bg-blue-600"></div>
            <span className="text-2xl font-bold text-gray-900">MBBS Mentor</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to continue your learning</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                placeholder="Enter your password"
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs font-medium text-gray-500 uppercase">OR CONTINUE WITH</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full mt-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Create one
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// "use client";

// import { useState, useEffect } from "react";

// export default function LoginPage() {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);

//   // Placeholder images - replace with your actual images
//   const images = [
//     {
//       id: 1,
//       title: "Learn Medical Concepts",
//       description: "Master complex medical topics with AI-powered learning",
//       color: "from-blue-600 to-blue-400"
//     },
//     {
//       id: 2,
//       title: "Ace Your Exams",
//       description: "Prepare for NEET PG, university exams, and competitive assessments",
//       color: "from-purple-600 to-purple-400"
//     },
//     {
//       id: 3,
//       title: "Track Your Progress",
//       description: "Monitor your learning journey with detailed analytics and insights",
//       color: "from-green-600 to-green-400"
//     },
//     {
//       id: 4,
//       title: "Join a Community",
//       description: "Connect with fellow medical students and experts worldwide",
//       color: "from-orange-600 to-orange-400"
//     }
//   ];

//   // Auto-slide images every 5 seconds
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentImageIndex((prev) => (prev + 1) % images.length);
//     }, 5000);
//     return () => clearInterval(interval);
//   }, [images.length]);

//   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       // Replace with your actual login API call
//       console.log("Login attempt with:", formData);
//       setLoading(false);
//     } catch (err: any) {
//       setError(err.response?.data?.message || "Login failed. Please try again.");
//       setLoading(false);
//     }
//   };

//   const handleGoogleSignIn = () => {
//     // Implement Google OAuth flow
//     console.log("Google sign in clicked");
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 pt-8">
//       {/* Sliding Background */}
//       <div className="absolute inset-0 overflow-hidden">
//         {images.map((image, index) => (
//           <div
//             key={image.id}
//             className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"
//               }`}
//           >
//             <div className={`w-full h-full bg-gradient-to-br ${image.color} flex items-center justify-center`}>
//               {/* Placeholder Image Area */}
//               <div className="text-center text-white px-8">
//                 <div className="w-32 h-32 mx-auto mb-6 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
//                   <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                 </div>
//                 <h2 className="text-3xl font-bold mb-3">{image.title}</h2>
//                 <p className="text-lg text-white/80">{image.description}</p>
//               </div>
//             </div>

//             {/* Overlay gradient */}
//             <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
//           </div>
//         ))}
//       </div>

//       {/* Dot Indicators */}
//       <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
//         {images.map((_, index) => (
//           <button
//             key={index}
//             onClick={() => setCurrentImageIndex(index)}
//             className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
//               ? "bg-white w-8"
//               : "bg-white/50 hover:bg-white/70"
//               }`}
//             aria-label={`Go to image ${index + 1}`}
//           />
//         ))}
//       </div>

//       {/* Login Form Container */}
//       <div className="relative z-10 w-full max-w-md ml-auto mr-8">
//         {/* Logo */}
//         <div className="text-center mb-8">
//           <div className="inline-flex items-center space-x-2 mb-4">
//             <div className="h-10 w-10 rounded-lg bg-blue-600"></div>
//             <span className="text-2xl font-bold text-white">MBBS Mentor</span>
//           </div>
//           <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
//           <p className="text-gray-300 mt-2">Sign in to continue your learning</p>
//         </div>

//         {/* Form */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
//               {error}
//             </div>
//           )}

//           <div className="space-y-4">
//             <div>
//               <label
//                 htmlFor="email"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Email
//               </label>
//               <input
//                 id="email"
//                 type="email"
//                 required
//                 value={formData.email}
//                 onChange={(e) =>
//                   setFormData({ ...formData, email: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
//                 placeholder="you@example.com"
//                 suppressHydrationWarning
//               />
//             </div>

//             <div>
//               <label
//                 htmlFor="password"
//                 className="block text-sm font-medium text-gray-700 mb-1"
//               >
//                 Password
//               </label>
//               <input
//                 id="password"
//                 type="password"
//                 required
//                 value={formData.password}
//                 onChange={(e) =>
//                   setFormData({ ...formData, password: e.target.value })
//                 }
//                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
//                 placeholder="Enter your password"
//                 suppressHydrationWarning
//               />
//             </div>

//             <button
//               onClick={(e) => handleSubmit(e as any)}
//               disabled={loading}
//               className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? "Signing in..." : "Sign In"}
//             </button>
//           </div>

//           {/* Divider */}
//           <div className="mt-6 flex items-center gap-3">
//             <div className="flex-1 border-t border-gray-200"></div>
//             <span className="text-xs font-medium text-gray-500 uppercase">OR CONTINUE WITH</span>
//             <div className="flex-1 border-t border-gray-200"></div>
//           </div>

//           {/* Google Sign In Button */}
//           <button
//             type="button"
//             onClick={handleGoogleSignIn}
//             className="w-full mt-4 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-2"
//           >
//             <svg className="w-5 h-5" viewBox="0 0 24 24">
//               <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
//               <path
//                 fill="currentColor"
//                 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//               />
//               <path
//                 fill="currentColor"
//                 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//               />
//               <path
//                 fill="currentColor"
//                 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//               />
//               <path
//                 fill="currentColor"
//                 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//               />
//             </svg>
//             Sign in with Google
//           </button>

//           <div className="mt-6 text-center text-sm text-gray-600">
//             Don't have an account?{" "}
//             <a
//               href="/register"
//               className="text-blue-600 hover:text-blue-700 font-medium"
//             >
//               Create one
//             </a>
//           </div>
//         </div>

//         <div className="mt-4 text-center">
//           <a href="/" className="text-sm text-white/60 hover:text-white">
//             Back to Home
//           </a>
//         </div>
//       </div>
//     </div>
//   );
// }