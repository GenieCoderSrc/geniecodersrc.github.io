import { AppConfig } from "../config.js";
import { githubApi } from "./github-api.js";

/**
 * ============================================================
 * Repository Service
 * ============================================================
 *
 * Responsibility:
 *  - Discover standalone package repositories.
 *  - Filter out non-package repositories.
 *  - Return clean package models.
 *
 * NOT responsible for:
 *  - pub.dev
 *  - UI
 *  - Rendering
 *  - HTML
 *
 * ============================================================
 */

export class RepositoryService {

    /**
     * Returns all standalone package repository names.
     */
    async getPackages() {

        const repositories = await githubApi.getRepositories();

        return repositories
            .filter(repository => this.#isPackageRepository(repository))
            .map(repository => repository.name)
            .sort((a, b) => a.localeCompare(b));

    }

    /**
     * Returns package models.
     */
    async getPackageModels() {

        const repositories = await githubApi.getRepositories();

        return repositories
            .filter(repository => this.#isPackageRepository(repository))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(repository => this.#toPackageModel(repository));

    }

    /**
     * Checks if a package exists.
     */
    async contains(packageName) {

        const packages = await this.getPackages();

        return packages.includes(packageName);

    }

    /**
     * Finds a repository by package name.
     */
    async find(packageName) {

        const repositories = await githubApi.getRepositories();

        const repository = repositories.find(
            repository => repository.name === packageName
        );

        if (!repository) {
            return null;
        }

        return this.#toPackageModel(repository);

    }

    /**
     * Returns repository URL.
     */
    getRepositoryUrl(packageName) {

        return `https://github.com/${AppConfig.github.user}/${packageName}`;

    }

    /**
     * Returns pub.dev URL.
     */
    getPubDevUrl(packageName) {

        return `${AppConfig.pubDev.baseUrl}/packages/${packageName}`;

    }

    /**
     * Number of standalone repositories.
     */
    async count() {

        const packages = await this.getPackages();

        return packages.length;

    }

    /**
     * Debug helper.
     */
    async printPackages() {

        const packages = await this.getPackageModels();

        console.table(packages);

    }

    // ============================================================
    // Private
    // ============================================================

    #isPackageRepository(repository) {

        if (!repository) {
            return false;
        }

        if (repository.fork) {
            return false;
        }

        if (repository.archived) {
            return false;
        }

        if (repository.disabled) {
            return false;
        }

        if (
            AppConfig.repositories.excluded.includes(repository.name)
        ) {
            return false;
        }

        if (repository.name.startsWith(".")) {
            return false;
        }

        return true;

    }

    #toPackageModel(repository) {

        return {

            name: repository.name,

            description: repository.description ?? "",

            repository: repository.name,

            repositoryUrl: repository.html_url,

            pubDevUrl: this.getPubDevUrl(repository.name),

            homepage: repository.homepage,

            defaultBranch: repository.default_branch,

            topics: repository.topics ?? [],

            stars: repository.stargazers_count,

            watchers: repository.watchers_count,

            forks: repository.forks_count,

            issues: repository.open_issues_count,

            visibility: repository.visibility,

            language: repository.language,

            createdAt: repository.created_at,

            updatedAt: repository.updated_at,

            source: "repository",

        };

    }

}

export const repositoryService = new RepositoryService();
