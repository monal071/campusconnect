import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import AddJobModal from '../../components/AddJobModal';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Jobs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showAddJob, setShowAddJob] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      // Defensive: ensure jobs is always an array
      setJobs(Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (jobData) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.isPending) {
          toast.success('Job submitted for approval! You will be notified once reviewed.');
        } else {
          toast.success('Job added successfully!');
          fetchJobs(); // Refresh the list for admins
        }
      } else {
        toast.error(data.error || 'Failed to add job');
      }
    } catch (error) {
      console.error('Error adding job:', error);
      toast.error('Error adding job. Please try again.');
    } finally {
      setShowAddJob(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.skills.some(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesType = selectedType === 'all' || job.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen">
      <Head>
        <title>Jobs | CampusConnect</title>
      </Head>
      <main className="page-container">
        <div className="page-header">
          <div className="flex items-center justify-between w-full">
            <h1 className="page-title">Jobs</h1>
            {session && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddJob(true)}
                className="btn btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Job</span>
              </motion.button>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input flex-1"
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="input"
          >
            <option value="all">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div className="page-content">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="card p-4 hover:shadow-md transition-all animate-fade-in"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{job.title}</h2>
                <span className="badge badge-primary">{job.type}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium mt-1 mb-3">{job.company}</p>
              <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">{job.description}</p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {job.skills.map(skill => (
                  <span key={skill} className="badge badge-blue">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        {filteredJobs.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 mt-8">
            No jobs found matching your criteria.
          </div>
        )}
      </main>

      {/* Add Job Modal */}
      <AddJobModal 
        isOpen={showAddJob} 
        onClose={() => setShowAddJob(false)} 
        onAdd={handleAddJob} 
      />
    </div>
  );
}