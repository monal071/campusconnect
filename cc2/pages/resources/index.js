import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import {
  getResources,
  addResource as apiAddResource,
  updateResource as apiUpdateResource,
  deleteResource as apiDeleteResource,
  updateResourceLikes as apiUpdateResourceLikes,
  trackResourceView,
  trackResourceDownload,
} from "../../utils/api";
import AddResourceModal from "../../components/AddResourceModal";
import ResourceCard from "../../components/ResourceCard";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";

const ITEMS_PER_PAGE = 12;

export default function Resources() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResources, setTotalResources] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchResources = async (page = 1, replace = true) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: ITEMS_PER_PAGE,
        sort: sortBy,
        search: searchTerm || undefined,
        type: selectedType !== "all" ? selectedType : undefined,
      };

      const result = await getResources(params);

      if (replace) {
        setResources(result.data || []);
      } else {
        setResources((prev) => [...prev, ...(result.data || [])]);
      }

      setTotalResources(result.total || 0);
      setHasMore(result.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      setError("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchResources(1, true);
    }
  }, [searchTerm, selectedType, sortBy, status]);

  const handleAddResource = async (resourceData) => {
    try {
      const result = await apiAddResource(resourceData);
      if (result.data) {
        setResources((prev) => [result.data, ...prev]);
        setTotalResources((prev) => prev + 1);
      }
      setShowAddModal(false);
      toast.success("Resource added successfully");
    } catch (error) {
      toast.error(error.message || "Failed to add resource");
    }
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    setShowAddModal(true);
  };

  const handleUpdateResource = async (resourceData) => {
    try {
      const result = await apiUpdateResource(resourceData);
      if (result.data) {
        setResources((prev) =>
          prev.map((r) =>
            r._id === resourceData.resourceId ? result.data : r,
          ),
        );
      }
      setShowAddModal(false);
      setEditingResource(null);
      toast.success("Resource updated");
    } catch (error) {
      toast.error(error.message || "Failed to update resource");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await apiDeleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r._id !== resourceId));
      setTotalResources((prev) => prev - 1);
      toast.success("Resource deleted");
    } catch (error) {
      toast.error(error.message || "Failed to delete resource");
    }
  };

  const handleLike = async (resourceId) => {
    try {
      const result = await apiUpdateResourceLikes(resourceId);
      setResources((prev) =>
        prev.map((r) =>
          r._id === resourceId
            ? {
                ...r,
                likes: result.likes,
                likedBy: result.liked
                  ? [...(r.likedBy || []), session?.user?.id].filter(Boolean)
                  : (r.likedBy || []).filter((id) => id !== session?.user?.id),
              }
            : r,
        ),
      );
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleView = async (resourceId) => {
    try {
      await trackResourceView(resourceId);
      setResources((prev) =>
        prev.map((r) =>
          r._id === resourceId ? { ...r, views: (r.views || 0) + 1 } : r,
        ),
      );
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handleDownload = async (resourceId) => {
    try {
      await trackResourceDownload(resourceId);
      setResources((prev) =>
        prev.map((r) =>
          r._id === resourceId
            ? { ...r, downloads: (r.downloads || 0) + 1 }
            : r,
        ),
      );
    } catch (error) {
      console.error("Error tracking download:", error);
    }
  };

  const handleVerify = async (resourceId) => {
    try {
      const response = await fetch("/api/resources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId, action: "verify" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify resource");
      }

      setResources((prev) =>
        prev.map((r) =>
          r._id === resourceId ? { ...r, isVerified: true } : r,
        ),
      );
      toast.success("Resource verified");
    } catch (error) {
      toast.error(error.message || "Failed to verify resource");
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingResource(null);
  };

  if (loading && resources.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Head>
        <title>Resources - CampusConnect</title>
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Resources
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Share and discover academic materials
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Resource
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">All Types</option>
          <option value="document">Documents</option>
          <option value="book">Books</option>
          <option value="video">Videos</option>
          <option value="link">Links</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="popular">Most Popular</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          <button
            onClick={() => fetchResources(1, true)}
            className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1"
          >
            Try again
          </button>
        </div>
      )}

      {/* Resources Grid */}
      {resources.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => (
              <ResourceCard
                key={resource._id}
                resource={resource}
                onLike={handleLike}
                onEdit={handleEditResource}
                onDelete={handleDeleteResource}
                onView={handleView}
                onDownload={handleDownload}
                onVerify={handleVerify}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => fetchResources(currentPage + 1, false)}
                disabled={loading}
                className="px-5 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading
                  ? "Loading..."
                  : `Load More (${resources.length} of ${totalResources})`}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">
            {searchTerm || selectedType !== "all"
              ? "No resources match your filters"
              : "No resources shared yet"}
          </p>
          {!searchTerm && selectedType === "all" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Share the first resource
            </button>
          )}
        </div>
      )}

      <AddResourceModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onAdd={editingResource ? handleUpdateResource : handleAddResource}
        resource={editingResource}
      />
    </div>
  );
}
