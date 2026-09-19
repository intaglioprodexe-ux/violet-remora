import JobsPage from "./pages/JobsPage.js";

const routes = Object.freeze({
    "/": JobsPage
});

export function resolvePage(pathname) {
    const requestedPath = pathname || "/";
    return routes[requestedPath] || routes["/"];
}
