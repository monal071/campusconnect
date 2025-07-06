import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Set admin session in localStorage
    localStorage.setItem("admin", "true");
    localStorage.setItem("userId", "admin");
    localStorage.setItem("name", "admin");
    fetchPosts();
    fetchUsers();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.data || []);
  };
  const fetchUsers = async () => {
    const res = await fetch("/api/connections/users?q=");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleDeletePost = async (id) => {
    setMessage("");
    const res = await fetch(`/api/posts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage("Post deleted.");
      fetchPosts();
    } else {
      setMessage("Failed to delete post.");
    }
  };

  const handleDeleteUser = async (id) => {
    setMessage("");
    const res = await fetch(`/api/connections/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage("User deleted.");
      fetchUsers();
    } else {
      setMessage("Failed to delete user.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-900 via-pink-800 to-purple-900 p-8">
      <div className="bg-white/80 dark:bg-gray-900/90 rounded-2xl shadow-2xl p-10 flex flex-col items-center backdrop-blur-lg w-full max-w-3xl">
        <h1 className="text-3xl font-black text-red-900 dark:text-white mb-2">Welcome, Admin</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">You are now logged in as <b>admin</b>.</p>
        {message && <div className="mb-4 text-center text-red-600">{message}</div>}
        <div className="w-full mb-8">
          <h2 className="text-xl font-bold mb-2">Delete Posts</h2>
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post._id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded p-3">
                <span>{post.content}</span>
                <button onClick={() => handleDeletePost(post._id)} className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
              </li>
            ))}
            {posts.length === 0 && <li className="text-gray-400">No posts found.</li>}
          </ul>
        </div>
        <div className="w-full">
          <h2 className="text-xl font-bold mb-2">Delete Users</h2>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user._id} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 rounded p-3">
                <span>{user.name} ({user.email})</span>
                <button onClick={() => handleDeleteUser(user._id)} className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
              </li>
            ))}
            {users.length === 0 && <li className="text-gray-400">No users found.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
