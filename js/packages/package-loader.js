import { monorepoService } from "../github/monorepo-service.js";
import { repositoryService } from "../github/repository-service.js";
import { pubApi } from "../pubdev/pub-api.js";

/**
 * ============================================================
 * Package Loader
 * ============================================================
 *
 * Responsibilities
 * ---------------
 * • Load packages from every source
 * • Merge duplicate packages
 * • Enrich with pub.dev metadata
 * • Return one unified package list
 *
 * Not responsible for:
 * • Rendering
 * • HTML
 * • Search
 * • Filtering
 * • UI
 *
 * ============================================================
 */

export class PackageLoader {

    async loadPackages() {

        console.time("PackageLoader");

        // -------------------------
        // Discover packages
        // -------------------------

        const [
            monorepoPackages,
            standalonePackages,
        ] = await Promise.all([
            monorepoService.getPackageModels(),
            repositoryService.getPackageModels(),
        ]);

        // -------------------------
        // Merge duplicates
        // -------------------------

        const packageMap = new Map();

        for (const pkg of monorepoPackages) {
            packageMap.set(pkg.name, pkg);
        }

        for (const pkg of standalonePackages) {

            if (packageMap.has(pkg.name)) {

                const existing = packageMap.get(pkg.name);

                packageMap.set(pkg.name, {
                    ...existing,
                    ...pkg,
                    source: "both",
                });

            } else {

                packageMap.set(pkg.name, pkg);

            }

        }

        const discoveredPackages = [...packageMap.values()];

        // -------------------------
        // Enrich with pub.dev
        // -------------------------

        const packages = await Promise.all(

            discoveredPackages.map(async (pkg) => {

                try {

                    const pubPackage =
                        await pubApi.getPackage(pkg.name);

                    return this.#mergePackage(
                        pkg,
                        pubPackage,
                    );

                } catch (error) {

                    console.warn(
                        `Unable to load pub.dev metadata for ${pkg.name}`,
                        error,
                    );

                    return this.#mergePackage(pkg, null);

                }

            }),

        );

        packages.sort((a, b) =>
            a.name.localeCompare(b.name),
        );

        console.info(
            `Loaded ${packages.length} packages.`,
        );

        console.timeEnd("PackageLoader");

        return packages;

    }

    async loadPackage(packageName) {

        const packages = await this.loadPackages();

        return (
            packages.find(
                package => package.name === packageName,
            ) ?? null
        );

    }

    async loadCategories() {

        const packages = await this.loadPackages();

        return [...new Set(packages.map(p => p.category))]
            .sort();

    }

    async loadStatistics() {

        const packages = await this.loadPackages();

        return {

            total: packages.length,

            monorepo:
                packages.filter(
                    p =>
                        p.source === "monorepo" ||
                        p.source === "both",
                ).length,

            standalone:
                packages.filter(
                    p =>
                        p.source === "repository" ||
                        p.source === "both",
                ).length,

            published:
                packages.filter(
                    p => p.isPublished,
                ).length,

        };

    }

    // ============================================================
    // Private
    // ============================================================

    #mergePackage(localPackage, pubPackage) {

        if (!pubPackage) {

            return {

                ...localPackage,

                isPublished: false,

                version: null,

                description:
                    localPackage.description ??
                    "No description available.",

                publisher: null,

                likes: 0,

                popularity: null,

                points: null,

                pubScore: null,

            };

        }

        return {

            ...localPackage,

            ...pubPackage,

            description:
                pubPackage.description ??
                localPackage.description,

            repositoryUrl:
                pubPackage.repository ??
                localPackage.repositoryUrl,

            homepage:
                pubPackage.homepage ??
                localPackage.homepage,

            version: pubPackage.version,

            publisher: pubPackage.publisher,

            likes: pubPackage.likes,

            popularity: pubPackage.popularity,

            points: pubPackage.points,

            pubScore: pubPackage.pubScore,

            isPublished: true,

        };

    }

}

export const packageLoader =
    new PackageLoader();
