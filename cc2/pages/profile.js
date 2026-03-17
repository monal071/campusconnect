import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Head from "next/head";
import { motion } from "framer-motion";
import EditProfileModal from "../components/EditProfileModal";

import EditIcon from "@mui/icons-material/Edit";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import SchoolIcon from "@mui/icons-material/School";
import BusinessIcon from "@mui/icons-material/Business";
import BookIcon from "@mui/icons-material/Book";
import PersonIcon from "@mui/icons-material/Person";

export default function Profile() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showEditModal, setShowEditModal] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchProfile(session.user.id);
    }
  }, [status, session, router]);

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(`/api/users/${userId}/profile`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
      } else {
        // Fallback to session data
        setUserData({
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
          department: session.user.department,
          institute: session.user.institute,
          createdAt: session.user.createdAt,
          isOwner: true,
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setUserData({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
        isOwner: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    // Re-fetch the profile after edits
    if (session?.user?.id) {
      fetchProfile(session.user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const memberSince = userData?.createdAt
    ? new Date(userData.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : "N/A";

  return (
    <>
      <Head>
        <title>{userData?.name || "Profile"} - CampusConnect</title>
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
            {/* Cover */}
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
                  {userData?.role && (
                    <div
                      className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                        userData.role === "admin"
                          ? "bg-purple-500 text-white"
                          : userData.role === "faculty"
                            ? "bg-green-500 text-white"
                            : "bg-blue-500 text-white"
                      }`}
                    >
                      {userData.role.charAt(0).toUpperCase() +
                        userData.role.slice(1)}
                    </div>
                  )}
                </div>

                {/* Name and Edit Button */}
                <div className="mt-6 sm:mt-0 sm:ml-6 flex-1 text-center sm:text-left">
                  <h2 className="text-3xl font-bold text-white">
                    {userData?.name}
                  </h2>
                  {userData?.email && (
                    <p className="text-gray-400 mt-1">{userData.email}</p>
                  )}
                  {userData?.bio && (
                    <p className="text-gray-300 mt-2 text-sm italic">
                      {userData.bio}
                    </p>
                  )}
                </div>

                {userData?.isOwner && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg"
                  >
                    <EditIcon fontSize="small" />
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                {/* Email */}
                {userData?.email && (
                  <InfoCard
                    icon={<EmailIcon className="text-blue-400" />}
                    label="Email Address"
                    value={userData.email}
                    color="blue"
                  />
                )}

                {/* Role */}
                <InfoCard
                  icon={<BadgeIcon className="text-purple-400" />}
                  label="Account Type"
                  value={userData?.role}
                  color="purple"
                  capitalize
                />

                {/* Institute */}
                {userData?.institute && (
                  <InfoCard
                    icon={<BusinessIcon className="text-indigo-400" />}
                    label="Institute"
                    value={userData.institute}
                    color="indigo"
                  />
                )}

                {/* Department */}
                {userData?.department && (
                  <InfoCard
                    icon={<SchoolIcon className="text-cyan-400" />}
                    label="Department"
                    value={userData.department}
                    color="cyan"
                  />
                )}

                {/* Semester */}
                {userData?.semester && (
                  <InfoCard
                    icon={<BookIcon className="text-amber-400" />}
                    label="Current Semester"
                    value={`Semester ${userData.semester}`}
                    color="amber"
                  />
                )}

                {/* Enrollment No */}
                {userData?.enrollmentNo && (
                  <InfoCard
                    icon={<PersonIcon className="text-pink-400" />}
                    label="Enrollment No"
                    value={userData.enrollmentNo}
                    color="pink"
                  />
                )}

                {/* Member Since */}
                <InfoCard
                  icon={<CalendarTodayIcon className="text-green-400" />}
                  label="Member Since"
                  value={memberSince}
                  color="green"
                />

                {/* Connections */}
                <InfoCard
                  icon={
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                  }
                  label="Connections"
                  value={`${userData?.connectionsCount || 0} connections`}
                  color="green"
                />
              </div>

              {/* Quick Actions */}
              {userData?.isOwner && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <QuickAction
                      title="Go to Dashboard"
                      subtitle="View your activity"
                      onClick={() => router.push("/dashboard")}
                    />
                    <QuickAction
                      title="My Connections"
                      subtitle="Manage connections"
                      onClick={() => router.push("/connections")}
                    />
                    <QuickAction
                      title="My Posts"
                      subtitle="View your posts"
                      onClick={() => router.push("/posts")}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {userData?.isOwner && (
        <EditProfileModal
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          user={userData}
          onSave={handleSaveProfile}
        />
      )}
    </>
  );
}

function InfoCard({ icon, label, value, color, capitalize }) {
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p
            className={`text-white font-medium ${capitalize ? "capitalize" : ""}`}
          >
            {value || "Not set"}
          </p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-4 text-left transition-all"
    >
      <p className="text-white font-medium">{title}</p>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </button>
  );
}
