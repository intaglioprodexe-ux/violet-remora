import { NAV_ITEMS } from "../../router.js";

const { defineComponent } = window.Vue;

export default defineComponent({
    name: "AppShell",
    props: {
        currentPath: {
            type: String,
            default: "/"
        }
    },
    emits: ["navigate"],
    setup(props, { emit }) {
        function isActive(path) {
            return props.currentPath === path;
        }

        function handleNavigation(event, path) {
            if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            event.preventDefault();
            emit("navigate", path);
        }

        return {
            navItems: NAV_ITEMS,
            isActive,
            handleNavigation
        };
    },
    template: `
        <div class="app-shell">
            <aside class="app-sidebar">
                <div class="app-brand">
                    <div class="app-brand__mark" aria-hidden="true">VR</div>
                    <div>
                        <strong class="app-brand__name">Violet Remora</strong>
                        <span class="app-brand__subtitle">Production ERP</span>
                    </div>
                </div>

                <nav class="app-navigation" aria-label="Primary navigation">
                    <p class="app-navigation__label">Workspace</p>
                    <a
                        v-for="item in navItems"
                        :key="item.path"
                        class="app-navigation__link"
                        :class="{ 'app-navigation__link--active': isActive(item.path) }"
                        :href="item.path"
                        :aria-current="isActive(item.path) ? 'page' : undefined"
                        @click="handleNavigation($event, item.path)"
                    >
                        <span class="app-navigation__indicator" aria-hidden="true"></span>
                        <span>{{ item.label }}</span>
                    </a>
                </nav>

                <div class="app-sidebar__footer">
                    <span class="app-sidebar__footer-label">Data mode</span>
                    <span class="app-sidebar__footer-value">Read-only</span>
                </div>
            </aside>

            <div class="app-content">
                <header class="app-topbar">
                    <span>Production monitoring</span>
                    <span class="app-topbar__status">Read-only API</span>
                </header>
                <div class="app-content__body">
                    <slot></slot>
                </div>
            </div>
        </div>
    `
});
