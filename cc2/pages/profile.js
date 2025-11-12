import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Head from "next/head";
import { motion } from "framer-motion";
import EditProfileModal from "../components/EditProfileModal";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user) {
      setUserData({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
      });
      setLoading(false);
    }
  }, [status, session, router]);

  const handleSaveProfile = (updatedData) => {
    setUserData((prevData) => ({
      ...prevData,
      name: updatedData.name,
      image: updatedData.image,
    }));
    // The modal already reloads the page, so this will refresh everything
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Profile - CampusConnect</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-gray-400">Manage your personal information</p>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20"
          >
            {/* Cover / Header Section */}
            <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>

            {/* Profile Content */}
            <div className="px-8 pb-8">
              {/* Avatar and Edit Button */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 mb-6">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-4 border-gray-900 overflow-hidden bg-gray-700 shadow-xl">
                    {userData?.image ? (
                      <Image
                        src={userData.image}
                        alt={userData.name}
                        width={128}
                        height={128}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                        <span className="text-4xl font-bold text-white">
                          {userData?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Role Badge */}
                  <div
                    className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      userData?.role === "admin"
                        ? "bg-purple-500 text-white"
                        : userData?.role === "faculty"
                        ? "bg-green-500 text-white"
                        : "bg-blue-500 text-white"
                    }`}
                  >
                    {userData?.role?.charAt(0).toUpperCase() +
                      userData?.role?.slice(1)}
                  </div>
                </div>

                {/* Name and Edit Button */}
                <div className="mt-6 sm:mt-0 sm:ml-6 flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-white">
                    {userData?.name}
                  </h2>
                  <p className="text-gray-400 mt-1">{userData?.email}</p>
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
                >
                  <EditIcon fontSize="small" />
                  Edit Profile
                </button>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Email */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <EmailIcon className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Email Address</p>
                      <p className="text-white font-medium">
                        {userData?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <BadgeIcon className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Type</p>
                      <p className="text-white font-medium capitalize">
                        {userData?.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Member Since */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CalendarTodayIcon className="text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Member Since</p>
                      <p className="text-white font-medium">
                        {new Date().toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Account Status</p>
                      <p className="text-white font-medium">Active</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all"
                  >
                    <p className="text-white font-medium">Go to Dashboard</p>
                    <p className="text-sm text-gray-400 mt-1">
                      View your activity
                    </p>
                  </button>

                  <button
                    onClick={() => router.push("/connect")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all"
                  >
                    <p className="text-white font-medium">My Connections</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Manage connections
                    </p>
                  </button>

                  <button
                    onClick={() => router.push("/posts")}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all"
                  >
                    <p className="text-white font-medium">My Posts</p>
                    <p className="text-sm text-gray-400 mt-1">
                      View your posts
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        user={userData}
        onSave={handleSaveProfile}
      />
    </>
  );
}
