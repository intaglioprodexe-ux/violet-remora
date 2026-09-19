import JobsPage from "./pages/JobsPage.js";
import MasterlistPage from "./pages/MasterlistPage.js";

const routes = Object.freeze({
    "/": JobsPage,
    "/masterlist": MasterlistPage
});

export const NAV_ITEMS = Object.freeze([
    {
        path: "/",
        label: "Job History"
    },
    {
        path: "/masterlist",
        label: "Masterlist"
    }
]);

export function normalizePath(pathname) {
    const rawPath = String(pathname || "/");
    const withoutTrailingSlash = rawPath.replace(/\/+$/, "");

    return withoutTrailingSlash || "/";
}

export function resolvePage(pathname) {
    const requestedPath = normalizePath(pathname);
    return routes[requestedPath] || routes["/"];
}
