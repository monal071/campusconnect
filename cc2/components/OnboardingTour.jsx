import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
} from "@heroicons/react/24/outline";

const TOUR_STEPS = [
  {
    id: "welcome",
    title: "Welcome to CampusConnect! 🎉",
    description:
      "Let's take a quick tour to help you get started with all the amazing features.",
    target: null,
    position: "center",
  },
  {
    id: "search",
    title: "Global Search",
    description:
      "Press ⌘K (or Ctrl+K) to search across posts, resources, quizzes, events, and more!",
    target: '[data-tour="search"]',
    position: "bottom",
  },
  {
    id: "notifications",
    title: "Stay Updated",
    description:
      "Get notified about new connections, comments, quiz results, and event reminders.",
    target: '[data-tour="notifications"]',
    position: "bottom",
  },
  {
    id: "navigation",
    title: "Quick Navigation",
    description:
      "Access all sections quickly: Posts, Resources, Quizzes, Events, Jobs, and Communities.",
    target: '[data-tour="navigation"]',
    position: "bottom",
  },
  {
    id: "posts",
    title: "Share Your Thoughts",
    description:
      "Create posts with @mentions, #hashtags, and emoji reactions. Your content, your way!",
    target: '[data-tour="posts"]',
    position: "right",
  },
  {
    id: "resources",
    title: "Share Knowledge",
    description:
      "Upload and discover study materials, notes, and resources. Faculty-verified content gets a special badge!",
    target: '[data-tour="resources"]',
    position: "right",
  },
  {
    id: "quizzes",
    title: "Test Your Knowledge",
    description:
      "Take quizzes, track your progress, and see instant results. Faculty can create quizzes with various question types.",
    target: '[data-tour="quizzes"]',
    position: "right",
  },
  {
    id: "events",
    title: "Never Miss an Event",
    description:
      "Discover campus events, workshops, and activities. RSVP and get reminders!",
    target: '[data-tour="events"]',
    position: "right",
  },
  {
    id: "connections",
    title: "Build Your Network",
    description:
      "Connect with fellow students, faculty, and alumni. Follow users to personalize your feed.",
    target: '[data-tour="connections"]',
    position: "right",
  },
  {
    id: "bookmarks",
    title: "Save for Later",
    description:
      "Bookmark important posts, resources, and events to access them anytime.",
    target: '[data-tour="bookmarks"]',
    position: "right",
  },
  {
    id: "theme",
    title: "Choose Your Style",
    description:
      "Toggle between light and dark mode for comfortable viewing any time of day.",
    target: '[data-tour="theme"]',
    position: "bottom",
  },
  {
    id: "complete",
    title: "You're All Set! 🚀",
    description:
      "You've completed the tour! Remember, press ? anytime to see keyboard shortcuts. Enjoy CampusConnect!",
    target: null,
    position: "center",
  },
];

export default function OnboardingTour({ onComplete }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    // Check if user has completed tour
    const completed = localStorage.getItem("onboarding-completed");
    if (!completed) {
      // Start tour after a brief delay
      setTimeout(() => setIsActive(true), 1000);
    } else {
      setHasCompletedTour(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    completeTour();
  };

  const completeTour = () => {
    localStorage.setItem("onboarding-completed", "true");
    setIsActive(false);
    setHasCompletedTour(true);
    if (onComplete) onComplete();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    setHasCompletedTour(false);
  };

  const step = TOUR_STEPS[currentStep];
  const targetElement = step.target
    ? document.querySelector(step.target)
    : null;
  const targetRect = targetElement?.getBoundingClientRect();

  const getTooltipPosition = () => {
    if (!targetRect || step.position === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 20;
    let style = {};

    switch (step.position) {
      case "bottom":
        style = {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        };
        break;
      case "top":
        style = {
          bottom: `${window.innerHeight - targetRect.top + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: "translateX(-50%)",
        };
        break;
      case "right":
        style = {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: "translateY(-50%)",
        };
        break;
      case "left":
        style = {
          top: `${targetRect.top + targetRect.height / 2}px`,
          right: `${window.innerWidth - targetRect.left + padding}px`,
          transform: "translateY(-50%)",
        };
        break;
    }

    return style;
  };

  if (hasCompletedTour && !isActive) {
    return (
      <button
        onClick={restartTour}
        className="fixed bottom-20 right-4 z-40 px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-full shadow-lg hover:bg-blue-600 transition-colors lg:bottom-4"
        title="Restart tour"
      >
        <RocketLaunchIcon className="inline-block h-5 w-5 mr-2" />
        Tour
      </button>
    );
  }

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay with spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Spotlight on target element */}
            {targetElement && targetRect && (
              <div
                className="absolute bg-transparent border-4 border-blue-500 rounded-lg shadow-2xl"
                style={{
                  top: `${targetRect.top - 4}px`,
                  left: `${targetRect.left - 4}px`,
                  width: `${targetRect.width + 8}px`,
                  height: `${targetRect.height + 8}px`,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
                }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60] pointer-events-auto"
            style={getTooltipPosition()}
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-screen mx-4 md:w-96">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white pr-8">
                    {step.title}
                  </h3>
                  <button
                    onClick={handleSkip}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {TOUR_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        index === currentStep
                          ? "bg-blue-500"
                          : index < currentStep
                          ? "bg-blue-300 dark:bg-blue-700"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center"
                    >
                      <ChevronLeftIcon className="h-4 w-4 mr-1" />
                      Back
                    </button>
                  )}

                  {currentStep < TOUR_STEPS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="px-4 py-1.5 text-sm font-medium bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                    >
                      <CheckCircleIcon className="h-4 w-4 mr-1" />
                      Finish
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
