import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  return getAllBlogPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  const url = `https://pingerhq.com/blog/${slug}`;

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Pinger" },
    publisher: { "@type": "Organization", name: "Pinger", url: "https://pingerhq.com" },
    mainEntityOfPage: `https://pingerhq.com/blog/${slug}`,
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-[680px] px-6 py-14">
        <Link href="/blog" className="text-sm font-medium underline">← Back to blog</Link>

        <header className="mt-6 mb-10">
          <p className="text-sm text-zinc-500">{post.date}{post.author ? ` · ${post.author}` : ""}</p>
          <h1 className="text-4xl font-bold mt-3 leading-tight tracking-tight">{post.title}</h1>
          <p className="text-lg text-zinc-600 mt-4 leading-8">{post.description}</p>
        </header>

        <div className="blog-prose" dangerouslySetInnerHTML={{ __html: post.html }} />

        <footer className="mt-14 rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Ready to keep clients calm during outages?</h2>
          <p className="text-zinc-600 mt-2">Try Pinger free and share beautiful real-time status pages with your clients.</p>
          <Link href="/" className="mt-4 inline-block font-medium underline">Start free with Pinger</Link>
        </footer>
      </article>
    </main>
  );
}
