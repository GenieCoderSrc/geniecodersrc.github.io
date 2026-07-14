import { AppConfig } from "../config.js";

/**
 * ============================================================
 * GitHub API Client
 * ============================================================
 * Responsibilities
 *  - Perform GitHub REST requests
 *  - Handle rate limits
 *  - Retry transient failures
 *  - Cache GET requests
 *  - Support pagination
 *
 * This class MUST NOT know anything about packages,
 * pub.dev or UI.
 * ============================================================
 */

export class GitHubApi {

    constructor() {
        this.baseUrl = "https://api.github.com";
        this.cache = new Map();
    }

    // ============================================================
    // Public API
    // ============================================================

    async getRepositories() {

        return this.#request(

            `/users/${AppConfig.github.user}/repos`,

            {
                per_page: AppConfig.github.repositoriesPerPage,
                sort: "updated",
            }

        );

    }

    async getMonorepoPackages() {

        return this.#request(

            `/repos/${AppConfig.github.user}/${AppConfig.github.monorepo}/contents/${AppConfig.github.packagesDirectory}`

        );

    }

    async getRepository(repositoryName) {

        return this.#request(

            `/repos/${AppConfig.github.user}/${repositoryName}`

        );

    }

    async getRepositoryContents(repositoryName, path = "") {

        return this.#request(

            `/repos/${AppConfig.github.user}/${repositoryName}/contents/${path}`

        );

    }

    async getFile(repositoryName, path) {

        return this.#request(

            `/repos/${AppConfig.github.user}/${repositoryName}/contents/${path}`

        );

    }

    async getBranches(repositoryName) {

        return this.#request(

            `/repos/${AppConfig.github.user}/${repositoryName}/branches`

        );

    }

    // ============================================================
    // Internal request engine
    // ============================================================

    async #request(endpoint, query = {}) {

        const url = this.#buildUrl(endpoint, query);

        if (AppConfig.cache.enabled) {

            const cached = this.#readCache(url);

            if (cached != null) {
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

        const retries = 3;

        let lastError;

        for (let attempt = 1; attempt <= retries; attempt++) {

            try {

                const response = await fetch(url, {
                    headers: {
                        Accept: "application/vnd.github+json",
                    },
                });

                if (response.status === 403) {

                    const remaining = response.headers.get("X-RateLimit-Remaining");

                    if (remaining === "0") {

                        const reset = response.headers.get("X-RateLimit-Reset");

                        throw new Error(
                            `GitHub API rate limit exceeded. Reset at ${new Date(
                                Number(reset) * 1000
                            ).toLocaleTimeString()}`
                        );

                    }

                }

                if (response.status >= 500) {

                    throw new Error("GitHub temporary server error.");

                }

                return response;

            } catch (error) {

                lastError = error;

                if (attempt < retries) {

                    await this.#delay(attempt * 1000);

                }

            }

        }

        throw lastError;

    }

    async #throwHttpError(response) {

        let message = `GitHub request failed (${response.status})`;

        try {

            const json = await response.json();

            if (json.message) {

                message = json.message;

            }

        } catch (_) {}

        throw new Error(message);

    }

    // ============================================================
    // Cache
    // ============================================================

    #readCache(key) {

        const item = this.cache.get(key);

        if (!item) {

            return null;

        }

        const ageMinutes =
            (Date.now() - item.time) / 1000 / 60;

        if (ageMinutes > AppConfig.cache.githubExpiryInMinutes) {

            this.cache.delete(key);

            return null;

        }

        return item.value;

    }

    #writeCache(key, value) {

        this.cache.set(key, {

            value,

            time: Date.now(),

        });

    }

    clearCache() {

        this.cache.clear();

    }

    // ============================================================
    // Helpers
    // ============================================================

    #buildUrl(endpoint, query) {

        const url = new URL(
            this.baseUrl + endpoint
        );

        Object.entries(query).forEach(([key, value]) => {

            if (value !== undefined && value !== null) {

                url.searchParams.set(key, value);

            }

        });

        return url.toString();

    }

    #delay(milliseconds) {

        return new Promise(resolve => {

            setTimeout(resolve, milliseconds);

        });

    }

}

export const githubApi = new GitHubApi();
