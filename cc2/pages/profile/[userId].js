import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Head from "next/head";
import { motion } from "framer-motion";

export default function PublicProfile() {
  const router = useRouter();
  const { userId } = router.query;
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (!res.ok) {
        setError("User not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser(data.user);

      // If viewing own profile, redirect to /profile
      if (data.user.isOwner) {
        router.replace("/profile");
        return;
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {error || "User not found"}
          </h2>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "N/A";

  return (
    <>
      <Head>
        <title>{user.name} - CampusConnect</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>

            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 mb-6">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-700 shadow-xl">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name}
                        width={112}
                        height={112}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                        <span className="text-3xl font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  {user.role && (
                    <div
                      className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        user.role === "faculty"
                          ? "bg-green-500 text-white"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </div>
                  )}
                </div>

                <div className="mt-6 sm:mt-0 sm:ml-6 flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                  {user.bio && (
                    <p className="text-gray-300 mt-1 text-sm italic">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {user.institute && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Institute</p>
                    <p className="text-white font-medium">{user.institute}</p>
                  </div>
                )}
                {user.department && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Department</p>
                    <p className="text-white font-medium">{user.department}</p>
                  </div>
                )}
                {user.semester && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Semester</p>
                    <p className="text-white font-medium">
                      Semester {user.semester}
                    </p>
                  </div>
                )}
                {user.enrollmentNo && (
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <p className="text-sm text-gray-400">Enrollment No</p>
                    <p className="text-white font-medium">
                      {user.enrollmentNo}
                    </p>
                  </div>
                )}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-gray-400">Member Since</p>
                  <p className="text-white font-medium">{memberSince}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <p className="text-sm text-gray-400">Connections</p>
                  <p className="text-white font-medium">
                    {user.connectionsCount || 0} connections
                  </p>
                </div>
              </div>

              {/* Back button */}
              <div className="mt-8 pt-6 border-t border-white/10 flex justify-center">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
