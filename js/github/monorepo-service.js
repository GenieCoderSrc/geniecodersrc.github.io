import { AppConfig } from "../config.js";
import { githubApi } from "./github-api.js";

/**
 * ============================================================
 * Monorepo Service
 * ============================================================
 *
 * Responsibility:
 *  - Discover packages inside the monorepo.
 *  - Return clean package names.
 *
 * NOT responsible for:
 *  - pub.dev
 *  - UI
 *  - Rendering
 *  - HTML
 *
 * ============================================================
 */

export class MonorepoService {

    /**
     * Returns all package names found in:
     *
     * pub_package_monorepo/packages/
     */
    async getPackages() {

        const directories = await githubApi.getMonorepoPackages();

        return directories
            .filter(directory => this.#isPackageDirectory(directory))
            .map(directory => directory.name)
            .sort((a, b) => a.localeCompare(b));

    }

    /**
     * Returns package models.
     */
    async getPackageModels() {

        const names = await this.getPackages();

        return names.map(name => ({
            name,
            repository: AppConfig.github.monorepo,
            repositoryUrl: this.getRepositoryUrl(name),
            pubDevUrl: this.getPubDevUrl(name),
            source: "monorepo",
        }));

    }

    /**
     * Returns whether the package exists.
     */
    async contains(packageName) {

        const packages = await this.getPackages();

        return packages.includes(packageName);

    }

    /**
     * Returns package GitHub URL.
     */
    getRepositoryUrl(packageName) {

        return `https://github.com/${AppConfig.github.user}/${AppConfig.github.monorepo}/tree/${AppConfig.github.branch}/${AppConfig.github.packagesDirectory}/${packageName}`;

    }

    /**
     * Returns package pub.dev URL.
     */
    getPubDevUrl(packageName) {

        return `${AppConfig.pubDev.baseUrl}/packages/${packageName}`;

    }

    /**
     * Returns package path inside monorepo.
     */
    getPackagePath(packageName) {

        return `${AppConfig.github.packagesDirectory}/${packageName}`;

    }

    /**
     * Number of packages.
     */
    async count() {

        const packages = await this.getPackages();

        return packages.length;

    }

    /**
     * Debug helper.
     */
    async printPackages() {

        const packages = await this.getPackages();

        console.table(packages);

    }

    /**
     * Valid package folder.
     */
    #isPackageDirectory(item) {

        if (!item) return false;

        if (item.type !== "dir") return false;

        if (!item.name) return false;

        if (item.name.startsWith(".")) return false;

        return true;

    }

}

export const monorepoService = new MonorepoService();
