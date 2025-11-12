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

  const filteredCommunities = communities.filter(
    (community) =>
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description?.toLowerCase().includes(searchTerm.toLowerCase())
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

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Communities
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Join communities and connect with people who share your
                interests
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 md:mt-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg transition-all"
            >
              <AddIcon />
              Create Community
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-3 px-2 font-semibold transition-colors ${
                  activeTab === "all"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                All Communities ({communities.length})
              </button>
              <button
                onClick={() => setActiveTab("my")}
                className={`pb-3 px-2 font-semibold transition-colors ${
                  activeTab === "my"
                    ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                My Communities ({myCommunities.length})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {activeTab === "all" && (
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Communities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === "all"
              ? filteredCommunities.map((community) => (
                  <CommunityCard
                    key={community._id}
                    community={community}
                    onJoin={handleJoinCommunity}
                    isMember={myCommunities.some(
                      (c) => c._id === community._id
                    )}
                  />
                ))
              : myCommunities.map((community) => (
                  <CommunityCard
                    key={community._id}
                    community={community}
                    isMember={true}
                    showEnter={true}
                  />
                ))}
          </div>

          {activeTab === "all" && filteredCommunities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? "No communities found matching your search."
                  : "No communities available yet."}
              </p>
            </div>
          )}

          {activeTab === "my" && myCommunities.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                You haven't joined any communities yet.
              </p>
            </div>
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

function CommunityCard({ community, onJoin, isMember, showEnter }) {
  const router = useRouter();
  const [joinStatus, setJoinStatus] = useState(community.joinStatus || "none");

  const handleJoinClick = async () => {
    await onJoin(community._id, community.isPrivate);
    if (community.isPrivate) {
      setJoinStatus("pending");
    } else {
      setJoinStatus("member");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Cover Image */}
      <div className="h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {community.name}
          </h3>
          <div className="flex items-center gap-2">
            {community.isPrivate ? (
              <LockIcon
                className="text-gray-500 dark:text-gray-400"
                fontSize="small"
              />
            ) : (
              <PublicIcon className="text-green-500" fontSize="small" />
            )}
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {community.description || "No description"}
        </p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <PeopleIcon fontSize="small" />
            <span>{community.memberCount || 0} members</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {community.isPrivate ? "Private" : "Public"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {showEnter || isMember ? (
            <button
              onClick={() => router.push(`/communities/${community._id}`)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-colors"
            >
              Enter Community
            </button>
          ) : joinStatus === "pending" ? (
            <button
              disabled
              className="flex-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <HourglassEmptyIcon fontSize="small" />
              Pending Approval
            </button>
          ) : joinStatus === "member" ? (
            <button
              onClick={() => router.push(`/communities/${community._id}`)}
              className="flex-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <CheckCircleIcon fontSize="small" />
              Joined
            </button>
          ) : (
            <button
              onClick={handleJoinClick}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 rounded-lg font-semibold transition-all"
            >
              {community.isPrivate ? "Request to Join" : "Join Community"}
            </button>
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
