import { AppConfig } from "../config.js";

/**
 * ============================================================
 * Pub.dev API Client
 * ============================================================
 *
 * Responsibilities
 * ----------------
 * • Communicate with pub.dev
 * • Cache responses
 * • Retry transient failures
 * • Return normalized package models
 *
 * NOT responsible for:
 * • GitHub
 * • Rendering
 * • HTML
 * • UI
 * ============================================================
 */

export class PubApi {

    constructor() {

        this.baseUrl = AppConfig.pubDev.apiBaseUrl;
        this.cache = new Map();

    }

    // ============================================================
    // Public API
    // ============================================================

    /**
     * Returns normalized package information.
     */
    async getPackage(packageName) {

        const response = await this.#request(
            `/packages/${packageName}`,
        );

        return this.#normalizePackage(response);

    }

    /**
     * Returns latest package version.
     */
    async getLatestVersion(packageName) {

        const packageInfo = await this.getPackage(packageName);

        return packageInfo.version;

    }

    /**
     * Checks if a package exists.
     */
    async exists(packageName) {

        try {

            await this.getPackage(packageName);

            return true;

        } catch (_) {

            return false;

        }

    }

    clearCache() {

        this.cache.clear();

    }

    // ============================================================
    // Request Engine
    // ============================================================

    async #request(endpoint) {

        const url = `${this.baseUrl}${endpoint}`;

        if (AppConfig.cache.enabled) {

            const cached = this.#readCache(url);

            if (cached) {
                return cached;
            }

        }

        const response = await this.#fetchWithRetry(url);

        if (!response.ok) {

            await this.#throwHttpError(response);

        }

        const json = await response.json();

        if (AppConfig.cache.enabled) {

            this.#writeCache(url, json);

        }

        return json;

    }

    async #fetchWithRetry(url) {

        let lastError;

        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                const response = await fetch(url);

                if (response.status >= 500) {

                    throw new Error(
                        "Temporary pub.dev server error.",
                    );

                }

                return response;

            } catch (error) {

                lastError = error;

                if (attempt < 3) {

                    await this.#delay(attempt * 1000);

                }

            }

        }

        throw lastError;

    }

    async #throwHttpError(response) {

        let message = `pub.dev request failed (${response.status})`;

        try {

            const json = await response.json();

            if (json.message) {

                message = json.message;

            }

        } catch (_) {}

        throw new Error(message);

    }

    // ============================================================
    // Model Mapping
    // ============================================================

    #normalizePackage(response) {

        const latest = response.latest ?? {};
        const pubspec = latest.pubspec ?? {};

        return {

            // identity

            name: response.name,

            version: latest.version,

            publisher: response.publisherId ?? null,

            // metadata

            description: pubspec.description ?? "",

            homepage: pubspec.homepage ?? null,

            repository: pubspec.repository ?? null,

            issueTracker: pubspec.issue_tracker ?? null,

            documentation: pubspec.documentation ?? null,

            license: pubspec.license ?? null,

            topics: pubspec.topics ?? [],

            platforms: pubspec.platforms ?? {},

            environment: pubspec.environment ?? {},

            dependencies: pubspec.dependencies ?? {},

            devDependencies:
                pubspec.dev_dependencies ?? {},

            screenshots:
                pubspec.screenshots ?? [],

            funding:
                pubspec.funding ?? [],

            archiveUrl:
                latest.archive_url ?? null,

            published:
                latest.published ?? null,

            // links

            pubUrl:
                `${AppConfig.pubDev.baseUrl}/packages/${response.name}`,

            apiUrl:
                `${AppConfig.pubDev.apiBaseUrl}/packages/${response.name}`,

            // placeholder values
            //
            // These are filled later by pub-score-service.js
            //

            likes: null,

            points: null,

            popularity: null,

            pubScore: null,

            health: null,

        };

    }

    // ============================================================
    // Cache
    // ============================================================

    #readCache(key) {

        const cache = this.cache.get(key);

        if (!cache) {

            return null;

        }

        const age =
            (Date.now() - cache.time) / 1000 / 60;

        if (
            age >
            AppConfig.cache.packageExpiryInMinutes
        ) {

            this.cache.delete(key);

            return null;

        }

        return cache.value;

    }

    #writeCache(key, value) {

        this.cache.set(key, {

            value,

            time: Date.now(),

        });

    }

    // ============================================================
    // Utils
    // ============================================================

    #delay(milliseconds) {

        return new Promise(resolve =>
            setTimeout(resolve, milliseconds),
        );

    }

}

export const pubApi = new PubApi();
