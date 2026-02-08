import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Icons
import AddIcon from "@mui/icons-material/Add";
import PublicIcon from "@mui/icons-material/Public";
import LockIcon from "@mui/icons-material/Lock";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

export default function Communities() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [communities, setCommunities] = useState([]);
  const [myCommunities, setMyCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' or 'my'
  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchCommunities();
    }
  }, [status, router]);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const [allRes, myRes] = await Promise.all([
        fetch("/api/communities"),
        fetch("/api/communities/my"),
      ]);

      if (allRes.ok) {
        const data = await allRes.json();
        setCommunities(data.communities || []);
      }

      if (myRes.ok) {
        const data = await myRes.json();
        setMyCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async (communityId, isPrivate) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to join community");
      }

      if (isPrivate) {
        toast.success("Join request sent! Waiting for approval.");
      } else {
        toast.success("Successfully joined community!");
        fetchCommunities();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteCommunity = (communityId) => {
    setCommunities(communities.filter((c) => c._id !== communityId));
    setMyCommunities(myCommunities.filter((c) => c._id !== communityId));
  };

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Communities - CampusConnect</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header with gradient */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 mb-8 shadow-2xl"
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
                  <span className="text-5xl">🌐</span>
                  Communities
                </h1>
                <p className="text-blue-100 text-lg">
                  Join communities and connect with people who share your
                  interests
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold">
                    {communities.length} Total Communities
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold">
                    {myCommunities.length} Joined
                  </div>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="mt-6 md:mt-0 bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all"
              >
                <AddIcon className="text-2xl" />
                Create Community
              </motion.button>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          </motion.div>

          {/* Modern Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 inline-flex gap-2">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  🌍 All Communities
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {communities.length}
                  </span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab("my")}
                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                  activeTab === "my"
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  ⭐ My Communities
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {myCommunities.length}
                  </span>
                </span>
              </button>
            </div>
          </motion.div>

          {/* Enhanced Search Bar */}
          {activeTab === "all" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 transition-opacity blur"></div>
                <div className="relative">
                  <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-2xl" />
                  <input
                    type="text"
                    placeholder="🔍 Search communities by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === "all"
              ? filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community._id}
                    community={community}
                    onJoin={handleJoinCommunity}
                    onDelete={handleDeleteCommunity}
                    isAdmin={isAdmin}
                    isMember={myCommunities.some(
                      (c) => c._id === community._id,
                    )}
                  />
                ))
              : myCommunities.map((community) => (
                  <CommunityCard
                    key={community._id}
                    community={community}
                    isMember={true}
                    showEnter={true}
                    onDelete={handleDeleteCommunity}
                    isAdmin={isAdmin}
                  />
                ))}
          </div>

          {/* Enhanced Empty States */}
          {activeTab === "all" && filteredCommunities.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg">
                <div className="text-7xl mb-4">{searchTerm ? "🔍" : "🌟"}</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? "No Results Found" : "No Communities Yet"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Be the first to create a community!"}
                </p>
                {!searchTerm && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all"
                  >
                    Create First Community
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "my" && myCommunities.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg">
                <div className="text-7xl mb-4">👋</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Communities Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Start exploring and join communities that match your
                  interests!
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab("all")}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all"
                >
                  Explore Communities
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <CreateCommunityModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCommunities();
          }}
        />
      )}
    </>
  );
}

function CommunityCard({
  community,
  onJoin,
  isMember,
  showEnter,
  onDelete,
  isAdmin,
}) {
  const router = useRouter();
  const [joinStatus, setJoinStatus] = useState(community.joinStatus || "none");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleJoinClick = async () => {
    await onJoin(community._id, community.isPrivate);
    if (community.isPrivate) {
      setJoinStatus("pending");
    } else {
      setJoinStatus("member");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${community.name}"? This will delete all posts and cannot be undone.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/communities/${community._id}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete community");
      }

      toast.success("Community deleted successfully");
      if (onDelete) {
        onDelete(community._id);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
    >
      {/* Enhanced Cover Image with Gradient Overlay */}
      <div className="relative h-40 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        {/* Privacy Badge */}
        <div className="absolute top-4 right-4 z-10">
          {community.isPrivate ? (
            <div className="bg-orange-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-white font-semibold text-xs shadow-lg">
              <LockIcon fontSize="small" />
              Private
            </div>
          ) : (
            <div className="bg-green-500/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-white font-semibold text-xs shadow-lg">
              <PublicIcon fontSize="small" />
              Public
            </div>
          )}
        </div>

        {/* Community Initial/Icon */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-white dark:border-gray-700">
            {community.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-3">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
            {community.name}
          </h3>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
          {community.description || "No description available"}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <PeopleIcon
                className="text-blue-600 dark:text-blue-400"
                fontSize="small"
              />
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {community.memberCount || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Members
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 dark:text-purple-400 text-lg">
                📝
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                {community.postCount || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {showEnter || isMember ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/communities/${community._id}`)}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>🚀</span> Enter Community
            </motion.button>
          ) : joinStatus === "pending" ? (
            <button
              disabled
              className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg cursor-not-allowed"
            >
              <HourglassEmptyIcon fontSize="small" className="animate-pulse" />
              Pending Approval
            </button>
          ) : joinStatus === "member" ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/communities/${community._id}`)}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircleIcon fontSize="small" />
              View Community
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleJoinClick}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {community.isPrivate ? (
                <>
                  <LockIcon fontSize="small" /> Request to Join
                </>
              ) : (
                <>
                  <span>✨</span> Join Now
                </>
              )}
            </motion.button>
          )}

          {/* Admin Delete Button */}
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete Community (Admin)"
            >
              {isDeleting ? "⏳" : "🗑️"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CreateCommunityModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Community name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, isPrivate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create community");
      }

      toast.success("Community created successfully!");
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Create New Community
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Community Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Sports Enthusiasts"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Tell people what this community is about..."
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Private Community
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Require approval to join
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Community"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
