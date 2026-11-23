<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

import { authorBios } from "../config";
import I18nKey from "../i18n/i18nKey";
import { i18n } from "../i18n/translation";
import { formatDateToYYYYMMDD } from "../utils/date-utils";
import { getPostUrlBySlug } from "../utils/url-utils";

export let sortedPosts: Post[] = [];
export let authorIcon: { body: string };
export let articleIcon: { body: string };

const params = new URLSearchParams(window.location.search);
const tags = params.getAll("tag");
const categories = params.getAll("category");
const authors = params.has("author") ? params.getAll("author") : [];
const uncategorized = params.get("uncategorized");

$: authorCards = [...new Set(authors)]
	.map((name) => ({
		name,
		bio: Object.hasOwn(authorBios, name) ? authorBios[name] : "",
		count: sortedPosts.filter((post) => post.data.author === name).length,
	}))
	.filter((author) => author.count > 0);

interface Post {
	slug: string;
	data: {
		title: string;
		tags: string[];
		category?: string | null;
		author?: string;
		published: Date;
	};
}

interface Group {
	year: number;
	posts: Post[];
}

let groups: Group[] = [];

function formatTag(tagList: string[]) {
	return tagList.map((t) => `#${t}`).join(" ");
}

onMount(async () => {
	let filteredPosts: Post[] = sortedPosts;

	if (tags.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) =>
				Array.isArray(post.data.tags) &&
				post.data.tags.some((tag) => tags.includes(tag)),
		);
	}

	if (categories.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) => post.data.category && categories.includes(post.data.category),
		);
	}

	if (authors.length > 0) {
		filteredPosts = filteredPosts.filter(
			(post) => post.data.author && authors.includes(post.data.author),
		);
	}

	if (uncategorized) {
		filteredPosts = filteredPosts.filter((post) => !post.data.category);
	}

	const grouped = filteredPosts.reduce(
		(acc, post) => {
			const year = post.data.published.getUTCFullYear();
			if (!acc[year]) {
				acc[year] = [];
			}
			acc[year].push(post);
			return acc;
		},
		{} as Record<number, Post[]>,
	);

	const groupedPostsArray = Object.keys(grouped).map((yearStr) => ({
		year: Number.parseInt(yearStr, 10),
		posts: grouped[Number.parseInt(yearStr, 10)],
	}));

	groupedPostsArray.sort((a, b) => b.year - a.year);

	groups = groupedPostsArray;
});
</script>

{#each authorCards as author (author.name)}
    <section class="card-base mb-4 flex items-center gap-4 px-6 py-5 md:px-8" aria-label={i18n(I18nKey.author)}>
        <span aria-hidden="true" class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--btn-regular-bg)] text-[var(--primary)]">
            <Icon icon={{width: 24, height: 24, ...authorIcon}} class="text-3xl" />
        </span>
        <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 class="text-xl font-bold text-90">{author.name}</h2>
            <span class="inline-flex items-center gap-1 whitespace-nowrap text-sm text-50">
                <Icon icon={{width: 24, height: 24, ...articleIcon}} aria-hidden="true" />
                {author.count} {i18n(author.count === 1 ? I18nKey.postCount : I18nKey.postsCount)}
            </span>
        </div>
        {#if author.bio}
            <p class="mt-2 text-sm text-75">{author.bio}</p>
        {/if}
        </div>
    </section>
{/each}

<div class="card-base px-8 py-6">
    {#each groups as group}
        <div>
            <div class="flex flex-row w-full items-center h-[3.75rem]">
                <div class="w-[15%] md:w-[10%] transition text-2xl font-bold text-right text-75">
                    {group.year}
                </div>
                <div class="w-[15%] md:w-[10%]">
                    <div
                            class="h-3 w-3 bg-none rounded-full outline outline-[var(--primary)] mx-auto
                  -outline-offset-[2px] z-50 outline-3"
                    ></div>
                </div>
                <div class="w-[70%] md:w-[80%] transition text-left text-50">
                    {group.posts.length} {i18n(group.posts.length === 1 ? I18nKey.postCount : I18nKey.postsCount)}
                </div>
            </div>

            {#each group.posts as post}
                <a
                        href={getPostUrlBySlug(post.slug)}
                        aria-label={post.data.title}
                        class="group btn-plain !block h-10 w-full rounded-lg hover:text-[initial]"
                >
                    <div class="flex flex-row justify-start items-center h-full">
                        <!-- date -->
                        <div class="w-[15%] md:w-[10%] transition text-sm text-right text-50">
                            {formatDateToYYYYMMDD(post.data.published).slice(5)}
                        </div>

                        <!-- dot and line -->
                        <div class="w-[15%] md:w-[10%] relative dash-line h-full flex items-center">
                            <div
                                    class="transition-all mx-auto w-1 h-1 rounded group-hover:h-5
                       bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-[var(--primary)]
                       outline outline-4 z-50
                       outline-[var(--card-bg)]
                       group-hover:outline-[var(--btn-plain-bg-hover)]
                       group-active:outline-[var(--btn-plain-bg-active)]"
                            ></div>
                        </div>

                        <!-- post title -->
                        <div
                                class="w-[70%] md:max-w-[65%] md:w-[65%] text-left font-bold
                     group-hover:translate-x-1 transition-all group-hover:text-[var(--primary)]
                     text-75 pr-8 whitespace-nowrap overflow-ellipsis overflow-hidden"
                        >
                            {post.data.title}
                        </div>

                        <!-- tag list -->
                        <div
                                class="hidden md:block md:w-[15%] text-left text-sm transition
                     whitespace-nowrap overflow-ellipsis overflow-hidden text-30"
                        >
                            {formatTag(post.data.tags)}
                        </div>
                    </div>
                </a>
            {/each}
        </div>
    {/each}
</div>
