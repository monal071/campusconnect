import Link from "next/link";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function Breadcrumbs({ customItems = null }) {
  const router = useRouter();

  const breadcrumbItems = useMemo(() => {
    if (customItems) return customItems;

    const pathSegments = router.pathname.split("/").filter(Boolean);
    const items = [{ label: "Home", href: "/dashboard" }];

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip dynamic route segments
      if (segment.startsWith("[")) return;

      // Convert segment to readable label
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      items.push({
        label,
        href: currentPath,
        isLast: index === pathSegments.length - 1,
      });
    });

    return items;
  }, [router.pathname, customItems]);

  if (breadcrumbItems.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href || index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            {item.isLast ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
              >
                {index === 0 && <HomeIcon className="h-4 w-4 mr-1" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Breadcrumbs with dropdown for intermediate levels
export function BreadcrumbsWithDropdown({ items }) {
  if (!items || items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={item.href || index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}

            {item.isLast ? (
              <span className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </span>
            ) : item.children && item.children.length > 0 ? (
              <div className="relative group">
                <button className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center">
                  {item.label}
                </button>
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[150px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
              >
                {index === 0 && <HomeIcon className="h-4 w-4 mr-1" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Compact breadcrumbs for mobile
export function BreadcrumbsCompact({ items }) {
  if (!items || items.length <= 1) return null;

  const currentItem = items[items.length - 1];
  const previousItem = items[items.length - 2];

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <div className="flex items-center space-x-2 text-sm">
        {previousItem && (
          <>
            <Link
              href={previousItem.href}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              ← {previousItem.label}
            </Link>
            <span className="text-gray-400">/</span>
          </>
        )}
        <span className="font-medium text-gray-900 dark:text-white">
          {currentItem.label}
        </span>
      </div>
    </nav>
  );
}

// Breadcrumbs with icons
export function BreadcrumbsWithIcons({ items }) {
  if (!items || items.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {items.map((item, index) => (
          <li key={item.href || index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
            )}
            {item.isLast ? (
              <span className="font-medium text-gray-900 dark:text-white flex items-center">
                {item.icon && <item.icon className="h-4 w-4 mr-1.5" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
              >
                {item.icon && <item.icon className="h-4 w-4 mr-1.5" />}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Helper to generate breadcrumb items from path
export const generateBreadcrumbs = (pathname, customLabels = {}) => {
  const pathSegments = pathname.split("/").filter(Boolean);
  const items = [{ label: "Home", href: "/dashboard", icon: HomeIcon }];

  let currentPath = "";
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;

    // Skip dynamic route segments
    if (segment.startsWith("[")) return;

    // Use custom label or generate from segment
    const label =
      customLabels[segment] ||
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    items.push({
      label,
      href: currentPath,
      isLast: index === pathSegments.length - 1,
    });
  });

  return items;
};
