import AppShell from "./components/layout/AppShell.js";
import { resolvePage } from "./router.js";
import { normalizePath } from "./router.js";

const {
    computed,
    createApp,
    defineComponent,
    onBeforeUnmount,
    ref
} = window.Vue;

const AppRoot = defineComponent({
    name: "AppRoot",
    components: {
        AppShell
    },
    setup() {
        const currentPath = ref(normalizePath(window.location.pathname));
        const activePage = computed(() => resolvePage(currentPath.value));

        function handlePopState() {
            currentPath.value = normalizePath(window.location.pathname);
        }

        function navigate(path) {
            const nextPath = normalizePath(path);

            if (nextPath === currentPath.value) {
                return;
            }

            window.history.pushState({}, "", nextPath);
            currentPath.value = nextPath;
        }

        window.addEventListener("popstate", handlePopState);

        onBeforeUnmount(() => {
            window.removeEventListener("popstate", handlePopState);
        });

        return {
            currentPath,
            activePage,
            navigate
        };
    },
    template: `
        <AppShell :current-path="currentPath" @navigate="navigate">
            <component :is="activePage" />
        </AppShell>
    `
});

createApp(AppRoot).mount("#app");
