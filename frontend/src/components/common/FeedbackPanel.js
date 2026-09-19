const { defineComponent } = window.Vue;

export default defineComponent({
    name: "FeedbackPanel",
    props: {
        tone: {
            type: String,
            default: "info"
        },
        title: {
            type: String,
            default: ""
        },
        message: {
            type: String,
            default: ""
        }
    },
    template: `
        <div v-if="message" class="feedback-panel" :class="'feedback-panel--' + tone" role="status">
            <strong v-if="title" class="feedback-panel__title">{{ title }}</strong>
            <span>{{ message }}</span>
        </div>
    `
});
