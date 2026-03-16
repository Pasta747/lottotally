import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Pinger Blog",
  description: "Uptime monitoring insights for web agencies.",
  openGraph: {
    title: "Pinger Blog",
    description: "Uptime monitoring insights for web agencies.",
    url: "https://pingerhq.com/blog",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm text-zinc-500">Pinger</p>
          <h1 className="text-4xl font-bold mt-2">Blog</h1>
          <p className="text-zinc-600 mt-3">Practical guides for agencies managing uptime, incidents, and client trust.</p>
        </div>

        <div className="space-y-5">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-xl border bg-white p-6">
              <p className="text-xs text-zinc-500">{post.date}</p>
              <h2 className="text-2xl font-semibold mt-2">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-zinc-600">{post.description}</p>
              <Link href={`/blog/${post.slug}`} className="mt-4 inline-block text-sm font-medium underline">
                Read article
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
