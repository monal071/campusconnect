import { Toaster } from "react-hot-toast";

export default function ImprovedToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: "var(--toast-bg)",
          color: "var(--toast-color)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
          maxWidth: "500px",
        },
        // Success
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#10b981",
            secondary: "#fff",
          },
          style: {
            background: "#ecfdf5",
            color: "#065f46",
            border: "1px solid #10b981",
          },
        },
        // Error
        error: {
          duration: 5000,
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #ef4444",
          },
        },
        // Loading
        loading: {
          iconTheme: {
            primary: "#3b82f6",
            secondary: "#fff",
          },
          style: {
            background: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #3b82f6",
          },
        },
      }}
    />
  );
}

// Custom toast variants
export const customToast = {
  promise: (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || "Loading...",
      success: messages.success || "Success!",
      error: messages.error || "Error occurred",
    });
  },

  info: (message) => {
    return toast(message, {
      icon: "ℹ️",
      style: {
        background: "#eff6ff",
        color: "#1e40af",
        border: "1px solid #3b82f6",
      },
    });
  },

  warning: (message) => {
    return toast(message, {
      icon: "⚠️",
      style: {
        background: "#fffbeb",
        color: "#92400e",
        border: "1px solid #f59e0b",
      },
    });
  },

  custom: (message, options = {}) => {
    return toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              {options.icon && (
                <div className="flex-shrink-0 pt-0.5">{options.icon}</div>
              )}
              <div className="ml-3 flex-1">
                {options.title && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {options.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200 dark:border-gray-700">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      ),
      options
    );
  },
};

// Progress toast
export const progressToast = {
  start: (message = "Uploading...") => {
    return toast.loading(message, {
      id: "progress-toast",
    });
  },

  update: (progress, message) => {
    toast.loading(
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">{message}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-semibold">{progress}%</span>
      </div>,
      {
        id: "progress-toast",
      }
    );
  },

  success: (message = "Upload complete!") => {
    toast.success(message, {
      id: "progress-toast",
    });
  },

  error: (message = "Upload failed") => {
    toast.error(message, {
      id: "progress-toast",
    });
  },
};
