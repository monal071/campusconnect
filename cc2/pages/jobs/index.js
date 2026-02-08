import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import AddJobModal from "../../components/AddJobModal";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function Jobs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showAddJob, setShowAddJob] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchJobs();
  }, [status]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/jobs");
      const data = await response.json();
      setJobs(
        Array.isArray(data)
          ? data
          : Array.isArray(data.items)
            ? data.items
            : [],
      );
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (jobData) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isPending) {
          toast.success("Job submitted for approval");
        } else {
          toast.success("Job added successfully");
          fetchJobs();
        }
      } else {
        toast.error(data.error || "Failed to add job");
      }
    } catch (error) {
      toast.error("Error adding job");
    } finally {
      setShowAddJob(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      job.title?.toLowerCase().includes(term) ||
      job.company?.toLowerCase().includes(term) ||
      job.description?.toLowerCase().includes(term) ||
      job.location?.toLowerCase().includes(term) ||
      job.skills?.some((s) => s.toLowerCase().includes(term));

    const matchesType = selectedType === "all" || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
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
        <title>Jobs - CampusConnect</title>
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Jobs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Find opportunities and internships
          </p>
        </div>
        <button
          onClick={() => setShowAddJob(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Job
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs, companies, skills..."
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
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
        </select>
      </div>

      {/* Jobs List */}
      {filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <BriefcaseIcon className="h-3.5 w-3.5" />
                      {job.company}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPinIcon className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                    {job.type}
                  </span>
                  {job.expiresAt && new Date(job.expiresAt) < new Date() && (
                    <span className="text-xs text-red-500">Expired</span>
                  )}
                </div>
              </div>

              {job.salary && (
                <p className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-3">
                  <CurrencyDollarIcon className="h-4 w-4" />
                  {job.salary}
                </p>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {job.description}
              </p>

              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {job.postedAt && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Posted {new Date(job.postedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500">
            {searchTerm ? "No jobs matching your search" : "No jobs posted yet"}
          </p>
        </div>
      )}

      <AddJobModal
        isOpen={showAddJob}
        onClose={() => setShowAddJob(false)}
        onAdd={handleAddJob}
      />
    </div>
  );
}
