/**
 * ============================================================
 * Portfolio Configuration
 * ============================================================
 * All application-wide constants should live here.
 * No business logic.
 * ============================================================
 */

export const AppConfig = Object.freeze({

    github: Object.freeze({

        user: "GenieCoderSrc",

        monorepo: "pub_package_monorepo",

        branch: "main",

        packagesDirectory: "packages",

        repositoriesPerPage: 100,

    }),

    pubDev: Object.freeze({

        publisher: "geniecodersrc",

        baseUrl: "https://pub.dev",

        apiBaseUrl: "https://pub.dev/api",

    }),

    cache: Object.freeze({

        enabled: true,

        version: "1.0.0",

        packageExpiryInMinutes: 60,

        githubExpiryInMinutes: 30,

    }),

    ui: Object.freeze({

        defaultCategory: "all",

        debounceMilliseconds: 250,

        packageAnimationMilliseconds: 180,

    }),

    categories: Object.freeze({

        state: [
            "bloc",
            "cubit",
            "provider",
            "navigation",
            "router",
            "route",
            "state",
            "storage",
            "db",
            "database",
            "firestore",
            "repository",
        ],

        ui: [
            "widget",
            "dialog",
            "toast",
            "picker",
            "indicator",
            "button",
            "card",
            "list",
            "view",
            "screen",
            "editor",
            "form",
            "theme",
            "color",
            "icon",
        ],

        utility: [
            "utils",
            "helper",
            "parser",
            "converter",
            "generator",
            "logger",
            "validator",
            "serializer",
            "json",
            "extension",
            "common",
        ],

    }),

    repositories: Object.freeze({

        excluded: Object.freeze([

            "pub_package_monorepo",

            "geniecodersrc.github.io",

            ".github",

            "ape_kini",

            "bakir_hishab",

            "icon_data_generator",

            "navigation_wihout_context",

        ]),

    }),

});
