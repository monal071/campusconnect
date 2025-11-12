import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Post from "../../components/Post";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ImageIcon from "@mui/icons-material/Image";
import CloseIcon from "@mui/icons-material/Close";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";

export default function CommunityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [postImages, setPostImages] = useState([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && id) {
      fetchCommunityData();
    }
  }, [status, id, router]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const [communityRes, postsRes, membersRes] = await Promise.all([
        fetch(`/api/communities/${id}`),
        fetch(`/api/communities/${id}/posts`),
        fetch(`/api/communities/${id}/members`),
      ]);

      if (communityRes.ok) {
        const data = await communityRes.json();
        setCommunity(data.community);
      }

      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.posts || []);
      }

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
      toast.error("Failed to load community");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + postImages.length > 4) {
      toast.error("You can only upload up to 4 images per post");
      return;
    }

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Each image must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const compressedImage = canvas.toDataURL("image/jpeg", 0.8);
          setPostImages((prev) => [...prev, compressedImage]);
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  const removeImage = (index) => {
    setPostImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if ((!postContent.trim() && postImages.length === 0) || isPosting) return;

    setIsPosting(true);
    try {
      const response = await fetch(`/api/communities/${id}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent.trim(),
          images: postImages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create post");
      }

      const data = await response.json();
      setPosts([data.post, ...posts]);
      setPostContent("");
      setPostImages([]);
      toast.success("Post created successfully!");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`/api/communities/${id}/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete post");
      }

      setPosts(posts.filter((p) => p._id !== postId));
      toast.success("Post deleted successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Community not found</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{community.name} - CampusConnect</title>
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Cover Header */}
        <div className="h-48 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 relative">
          <button
            onClick={() => router.push("/communities")}
            className="absolute top-4 left-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowBackIcon />
          </button>
        </div>

        {/* Community Info */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {community.name || "Unnamed Community"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {community.description || "No description"}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <button
                    onClick={() => setShowMembers(true)}
                    className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <PeopleIcon fontSize="small" />
                    <span>{members.length} members</span>
                  </button>
                  {community.isCreator && (
                    <button className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <SettingsIcon fontSize="small" />
                      <span>Settings</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Create Post Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <form onSubmit={handleCreatePost}>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share something with the community..."
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />

              {/* Image Preview Grid */}
              {postImages.length > 0 && (
                <div
                  className={`mt-3 grid gap-2 ${
                    postImages.length === 1
                      ? "grid-cols-1"
                      : postImages.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2"
                  }`}
                >
                  {postImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <label
                    className={`flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer ${
                      postImages.length >= 4
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={postImages.length >= 4}
                    />
                    <ImageIcon />
                    <span className="text-sm">{postImages.length}/4</span>
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {postContent.length} / 1000
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={
                    (!postContent.trim() && postImages.length === 0) ||
                    isPosting
                  }
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.map((post) => (
              <Post key={post._id} post={post} onDelete={handleDeletePost} />
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
                <p className="text-gray-500 dark:text-gray-400">
                  No posts yet. Be the first to share something!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <MembersModal members={members} onClose={() => setShowMembers(false)} />
      )}
    </>
  );
}

function MembersModal({ members, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Members ({members.length})
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {member.role || "Member"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
