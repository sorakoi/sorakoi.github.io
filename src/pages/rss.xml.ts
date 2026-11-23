import rss from "@astrojs/rss";
import { getSortedPosts } from "@utils/content-utils";
import { url } from "@utils/url-utils";
import type { APIContext } from "astro";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { siteConfig } from "@/config";

const parser = new MarkdownIt({ html: true });

const linkToEmbed: sanitizeHtml.Transformer = (_tag, attribs) => {
	const src = attribs.src || "";
	const video = URL.canParse(src) ? new URL(src) : undefined;
	const youtubeId =
		video?.hostname === "www.youtube.com" &&
		video.pathname.match(/^\/embed\/([\w-]+)\/?$/)?.[1];
	return {
		tagName: "a",
		attribs: {
			href: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : src,
		},
		text: youtubeId ? "在 YouTube 观看视频" : attribs.title || "查看嵌入内容",
	};
};

function stripInvalidXmlChars(str: string): string {
	return str.replace(
		// biome-ignore lint/suspicious/noControlCharactersInRegex: https://www.w3.org/TR/xml/#charsets
		/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
		"",
	);
}

export async function GET(context: APIContext) {
	const blog = await getSortedPosts();

	return rss({
		title: siteConfig.title,
		description: siteConfig.subtitle || "No description",
		site: context.site ?? "https://fuwari.vercel.app",
		items: blog.map((post) => {
			const content =
				typeof post.body === "string" ? post.body : String(post.body || "");
			const cleanedContent = stripInvalidXmlChars(content);
			return {
				title: post.data.title,
				pubDate: post.data.published,
				description: post.data.description || "",
				link: url(`/posts/${post.id}/`),
				content: sanitizeHtml(parser.render(cleanedContent), {
					allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
					transformTags: { iframe: linkToEmbed },
				}),
			};
		}),
		customData: `<language>${siteConfig.lang}</language>`,
	});
}
