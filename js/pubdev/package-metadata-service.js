import { AppConfig } from "../config.js";

/**
 * ============================================================
 * Package Metadata Service
 * ============================================================
 *
 * Responsibility
 * --------------
 * Retrieves metadata that is NOT available from the official
 * pub.dev REST API.
 *
 * Examples:
 *  • Pub Points
 *  • Popularity
 *  • Likes
 *
 * This service intentionally does NOT communicate with GitHub.
 *
 * ============================================================
 */

export class PackageMetadataService {

    constructor() {

        this.cache = new Map();

    }

    async getMetadata(packageName) {

        const cache = this.#readCache(packageName);

        if (cache) {
            return cache;
        }

        const metadata = await this.#load(packageName);

        this.#writeCache(packageName, metadata);

        return metadata;

    }

    async getLikes(packageName) {

        const metadata = await this.getMetadata(packageName);

        return metadata.likes;

    }

    async getPubPoints(packageName) {

        const metadata = await this.getMetadata(packageName);

        return metadata.points;

    }

    async getPopularity(packageName) {

        const metadata = await this.getMetadata(packageName);

        return metadata.popularity;

    }

    async getHealth(packageName) {

        const metadata = await this.getMetadata(packageName);

        return metadata.health;

    }

    clearCache() {

        this.cache.clear();

    }

    // ============================================================
    // Private
    // ============================================================

    async #load(packageName) {

        /**
         * --------------------------------------------------------
         * IMPORTANT
         * --------------------------------------------------------
         *
         * The official pub.dev API DOES NOT expose:
         *
         * • Likes
         * • Pub Points
         * • Popularity
         *
         * Those values are only visible on the website.
         *
         * Scraping HTML from the browser introduces CORS issues
         * and is fragile because the page structure may change.
         *
         * Therefore this implementation returns null values.
         *
         * In the future, replace this method with:
         *
         * 1. Official pub.dev endpoint (preferred)
         * 2. Cloud Function / Backend proxy
         * 3. GitHub Action that periodically caches package scores
         *
         * --------------------------------------------------------
         */

        return {

            likes: null,

            points: null,

            popularity: null,

            health: null,

        };

    }

    #readCache(packageName) {

        const cache = this.cache.get(packageName);

        if (!cache) {

            return null;

        }

        const age =
            (Date.now() - cache.time) / 1000 / 60;

        if (
            age >
            AppConfig.cache.packageExpiryInMinutes
        ) {

            this.cache.delete(packageName);

            return null;

        }

        return cache.value;

    }

    #writeCache(packageName, value) {

        this.cache.set(packageName, {

            value,

            time: Date.now(),

        });

    }

}

export const packageMetadataService =
    new PackageMetadataService();
