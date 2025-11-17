/**
 * Route preloading utilities for performance optimization
 */

// Preload functions for critical routes
export const preloadDashboard = () => import("../pages/DashboardAnimated");
export const preloadFileView = () => import("../pages/FileView");
export const preloadHome = () => import("../pages/Home");
export const preloadSharePage = () => import("../pages/SharePage");
