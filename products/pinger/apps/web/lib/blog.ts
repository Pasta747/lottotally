import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  author?: string;
};

export type BlogPost = BlogPostMeta & {
  html: string;
};

function readMarkdownFile(filePath: string) {
  return fs.readFileSync(filePath, "utf8");
}

function stripInternalNotes(markdown: string) {
  const lines = markdown.split("\n");
  const filtered = lines.filter((line) => {
    const t = line.trim();
    if (t.startsWith("**Target keyword:**")) return false;
    if (t.startsWith("**Word count:**")) return false;
    if (t.startsWith("**CTA:**")) return false;
    if (t.startsWith("**Status:")) return false;
    return true;
  });

  // Remove consecutive leading separators created after stripping note lines.
  while (filtered[0]?.trim() === "") filtered.shift();
  if (filtered[0]?.trim() === "---") filtered.shift();
  while (filtered[0]?.trim() === "") filtered.shift();

  return filtered.join("\n");
}

export function getAllBlogPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = readMarkdownFile(path.join(BLOG_DIR, file));
      const { data, content } = matter(raw);
      const cleanedContent = stripInternalNotes(content);
      const heading = cleanedContent.match(/^#\s+(.+)$/m)?.[1] ?? slug;
      const firstParagraph = cleanedContent.split("\n\n").find((p) => p.trim() && !p.trim().startsWith("#")) ?? "";

      return {
        slug,
        title: String(data.title ?? heading),
        description: String(data.description ?? firstParagraph.slice(0, 180)),
        date: String(data.date ?? ""),
        author: data.author ? String(data.author) : undefined,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = readMarkdownFile(filePath);
  const { data, content } = matter(raw);
  let cleanedContent = stripInternalNotes(content);
  // Remove the leading H1/H2 title from body — it's already rendered in the header
  cleanedContent = cleanedContent.replace(/^\s*#{1,2}\s+.+\n*/, "");
  const html = await marked.parse(cleanedContent);
  const heading = cleanedContent.match(/^#\s+(.+)$/m)?.[1] ?? slug;
  const firstParagraph = cleanedContent.split("\n\n").find((p) => p.trim() && !p.trim().startsWith("#")) ?? "";

  return {
    slug,
    title: String(data.title ?? heading),
    description: String(data.description ?? firstParagraph.slice(0, 180)),
    date: String(data.date ?? ""),
    author: data.author ? String(data.author) : undefined,
    html,
  };
}
