export const siteConfig = {
    brand: "TooonRan",
    blogUrl: "https://blog.tooonran.top/",
    contactEmail: "tooonran@gmail.com",
    rssUrl: "https://blog.tooonran.top/rss2.xml",
    playlistId: "514347228",
    hero: {
        coordinate: "36.6512° N · 117.1201° E",
        video: "/videos/hero.mp4",
        poster: "/images/hero-observatory.jpg",
        mottoLines: ["Explore the unknown,", "illuminate the possible."],
    },
    about: {
        avatar: "/images/avatar.jpg",
        skills: [
            { label: "Java", icon: "code" },
            { label: "Spring Boot", icon: "leaf" },
            { label: "Vue", icon: "layers" },
            // { label: "Astro", icon: "rocket" },
            { label: "Redis", icon: "database" },
            { label: "摄影", icon: "camera" },
            { label: "音乐", icon: "music" },
        ],
    },
    socials: [
        {
            label: "GitHub",
            href: "https://github.com/TheSummer001",
            icon: "github",
        },
        {
            label: "Bilibili",
            href: "https://space.bilibili.com/350074542",
            icon: "bilibili",
        },
        {
            label: "QQ",
            href: "tencent://AddContact/?fromId=50&fromSubId=All&SubCmd=CALL&uin=2026263245",
            icon: "qq",
        },
        { label: "Email", href: "mailto:tooonran@gmail.com", icon: "email" },
    ],
    resources: [
        {
            title: "开发工具",
            subtitle: "Build",
            items: [
                {
                    name: "GitHub",
                    url: "https://github.com",
                    desc: "代码托管与开放协作",
                    icon: "github",
                },
                {
                    name: "VS Code",
                    url: "https://code.visualstudio.com",
                    desc: "轻量、可扩展的代码编辑器",
                    icon: "terminal",
                },
                {
                    name: "MDN",
                    url: "https://developer.mozilla.org",
                    desc: "可靠的 Web 开发参考",
                    icon: "book",
                },
                {
                    name: "Can I use",
                    url: "https://caniuse.com",
                    desc: "前端特性兼容性速查",
                    icon: "check",
                },
            ],
        },
        {
            title: "设计工具",
            subtitle: "Shape",
            items: [
                {
                    name: "Figma",
                    url: "https://figma.com",
                    desc: "界面设计与原型协作",
                    icon: "figma",
                },
                {
                    name: "Coolors",
                    url: "https://coolors.co",
                    desc: "快速生成配色灵感",
                    icon: "palette",
                },
                {
                    name: "Iconify",
                    url: "https://iconify.design",
                    desc: "统一检索开源图标",
                    icon: "shapes",
                },
            ],
        },
        {
            title: "日常工具",
            subtitle: "Keep",
            items: [
                {
                    name: "Notion",
                    url: "https://notion.so",
                    desc: "笔记、整理与协作",
                    icon: "notion",
                },
                {
                    name: "Excalidraw",
                    url: "https://excalidraw.com",
                    desc: "像手绘一样快速表达",
                    icon: "pen",
                },
                {
                    name: "DeepL",
                    url: "https://www.deepl.com",
                    desc: "自然流畅的翻译工具",
                    icon: "translate",
                },
            ],
        },
    ],
} as const;
