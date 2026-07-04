import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

// Icons
import AddIcon from "@mui/icons-material/Add";
import PeopleIcon from "@mui/icons-material/People";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LoginIcon from "@mui/icons-material/Login";
import CloseIcon from "@mui/icons-material/Close";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PhotoIcon from "@mui/icons-material/Photo";
import { useUploadThing } from "../utils/uploadthing";
import { CircularProgress } from "@mui/material";

export default function Communities() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
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
      const res = await fetch("/api/communities");
      if (res.ok) {
        const data = await res.json();
        setCommunities(data.communities || []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
      toast.error("Failed to load communities");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCommunity = (communityId) => {
    setCommunities(communities.filter((c) => c._id !== communityId));
  };

  const handleLeaveCommunity = (communityId) => {
    setCommunities(communities.filter((c) => c._id !== communityId));
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 mb-8 shadow-2xl"
          >
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-black text-white mb-2">
                  My Communities
                </h1>
                <p className="text-blue-100 text-lg">
                  Your classrooms and study groups
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold">
                    {communities.length} Joined
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowJoinModal(true)}
                  className="bg-white text-purple-600 hover:bg-gray-100 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all"
                >
                  <LoginIcon />
                  Join with Code
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-xl transition-all border border-white/30"
                >
                  <AddIcon />
                  Create Community
                </motion.button>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
          </motion.div>

          {/* Communities Grid */}
          {communities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <CommunityCard
                  key={community._id}
                  community={community}
                  onDelete={handleDeleteCommunity}
                  onLeave={handleLeaveCommunity}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-lg">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <PeopleIcon
                    className="text-blue-600 dark:text-blue-400"
                    style={{ fontSize: 40 }}
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  No Communities Yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create a community or join one with an invite code
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowJoinModal(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <LoginIcon fontSize="small" />
                    Join with Code
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowCreateModal(true)}
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <AddIcon fontSize="small" />
                    Create Community
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Create Community Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateCommunityModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              fetchCommunities();
            }}
          />
        )}
      </AnimatePresence>

      {/* Join Community Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <JoinCommunityModal
            onClose={() => setShowJoinModal(false)}
            onSuccess={() => {
              setShowJoinModal(false);
              fetchCommunities();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function CommunityCard({ community, onDelete, isAdmin, onLeave }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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
      if (onDelete) onDelete(community._id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLeave = async (e) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to leave "${community.name}"? You can rejoin later with the community code.`,
      )
    ) {
      return;
    }

    setIsLeaving(true);
    try {
      const response = await fetch(`/api/communities/${community._id}/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to leave community");
      }

      toast.success("You have left the community");
      if (onLeave) onLeave(community._id);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLeaving(false);
    }
  };

  const copyCode = (e) => {
    e.stopPropagation();
    if (community.code) {
      navigator.clipboard.writeText(community.code);
      toast.success("Community code copied!");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={() => router.push(`/communities/${community._id}`)}
      className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer"
    >
      {/* Cover */}
      <div className="relative h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>
        </div>

        {/* Community Initial */}
        <div className="absolute bottom-3 left-4 z-10">
          <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-xl shadow-lg flex items-center justify-center text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 border-4 border-white dark:border-gray-700">
            {community.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Code badge for creators */}
        {community.isCreator && community.code && (
          <button
            onClick={copyCode}
            className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:bg-white transition-colors shadow-md"
            title="Click to copy invite code"
          >
            <span className="font-mono tracking-wider">{community.code}</span>
            <ContentCopyIcon style={{ fontSize: 14 }} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
          {community.name}
        </h3>

        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {community.description || "No description available"}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <PeopleIcon fontSize="small" />
            <span>{community.memberCount || 0} members</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Leave Button - for non-creators */}
            {!community.isCreator && (
              <button
                onClick={handleLeave}
                disabled={isLeaving}
                className="flex items-center gap-1 text-red-400 hover:text-red-600 transition-colors text-sm disabled:opacity-50"
                title="Leave Community"
              >
                <ExitToAppIcon style={{ fontSize: 16 }} />
                {isLeaving ? "..." : "Leave"}
              </button>
            )}

            {/* Admin Delete Button */}
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-600 transition-colors text-sm disabled:opacity-50"
                title="Delete Community (Admin)"
              >
                {isDeleting ? "..." : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CreateCommunityModal({ onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);

  const { startUpload, isUploading: isUploadingImage } = useUploadThing("imageUploader", {
    onUploadError: (error) => {
      toast.error(`Error uploading image: ${error.message}`);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Community name is required");
      return;
    }

    setLoading(true);
    let imageUrl = null;
    try {
      if (pendingImage) {
        const uploadResult = await startUpload([pendingImage]);
        if (uploadResult && uploadResult.length > 0) {
          imageUrl = uploadResult[0].url;
        }
      }

      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, image: imageUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create community");
      }

      const data = await response.json();
      setCreatedCode(data.community?.code);
      onSuccess();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode);
      toast.success("Code copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        {createdCode ? (
          // Success screen with code
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Community Created!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Share this invite code with others to let them join
            </p>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Invite Code
              </p>
              <p className="text-4xl font-mono font-bold tracking-[0.3em] text-gray-900 dark:text-white">
                {createdCode}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyCode}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <ContentCopyIcon fontSize="small" />
                Copy Code
              </button>
              <button
                onClick={onClose}
                className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-3 rounded-xl font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          // Create form
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Community
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Community Icon Upload */}
              <div className="flex flex-col items-center justify-center mb-4">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center group cursor-pointer hover:border-blue-500 transition-colors">
                  {pendingImage ? (
                    <img 
                      src={URL.createObjectURL(pendingImage)} 
                      alt="Community Icon" 
                      className={`w-full h-full object-cover ${isUploadingImage ? 'opacity-50' : ''}`}
                    />
                  ) : (
                    <PhotoIcon className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CircularProgress size={24} />
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading || isUploadingImage}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        if (e.target.files[0].size > 5 * 1024 * 1024) {
                           toast.error("Image size should be less than 5MB");
                           return;
                        }
                        setPendingImage(e.target.files[0]);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">Optional Icon</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Data Structures - CE Dept"
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  placeholder="What is this community about?"
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 rounded-xl">
                A unique invite code will be generated. Share it with others to
                let them join your community.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || isUploadingImage}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {loading || isUploadingImage ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

function JoinCommunityModal({ onClose, onSuccess }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter a community code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/communities/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to join community");
      }

      toast.success(data.message || "Successfully joined community!");
      onSuccess();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Join Community
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Enter the invite code shared by the community creator
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toLowerCase());
                setError("");
              }}
              className="w-full px-6 py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl font-mono tracking-[0.3em] placeholder:text-base placeholder:tracking-normal placeholder:font-sans"
              placeholder="Enter code"
              maxLength={10}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
