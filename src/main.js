import { resolvePage } from "./router.js";

const { createApp, defineComponent } = window.Vue;

const ActivePage = resolvePage(window.location.pathname);

const AppRoot = defineComponent({
    name: "AppRoot",
    components: {
        ActivePage
    },
    template: "<ActivePage />"
});

createApp(AppRoot).mount("#app");
