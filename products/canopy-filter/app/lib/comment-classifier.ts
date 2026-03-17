import type { YouTubeComment } from "@/lib/youtube";

export type CommentCategory = "toxic" | "spam" | "constructive" | "positive";

export type ClassifiedComment = YouTubeComment & {
  category: CommentCategory;
  confidence: number;
  method: "llm" | "heuristic";
};

const CATEGORY_ORDER: CommentCategory[] = ["toxic", "spam", "constructive", "positive"];

export function classifyHeuristic(text: string): { category: CommentCategory; confidence: number } {
  const t = text.toLowerCase();

  const toxicTerms = ["idiot", "stupid", "dumb", "hate you", "kill yourself", "trash", "ugly", "moron"];
  const spamTerms = ["dm me", "check my profile", "free followers", "crypto", "giveaway", "whatsapp", "http://", "https://"];
  const constructiveTerms = ["could you", "i suggest", "it would help", "maybe try", "would be better", "next time"];
  const positiveTerms = ["love this", "amazing", "thank you", "so helpful", "great video", "you inspired me", "beautiful"];

  if (toxicTerms.some((w) => t.includes(w))) return { category: "toxic", confidence: 0.72 };
  if (spamTerms.some((w) => t.includes(w))) return { category: "spam", confidence: 0.7 };
  if (constructiveTerms.some((w) => t.includes(w))) return { category: "constructive", confidence: 0.66 };
  if (positiveTerms.some((w) => t.includes(w))) return { category: "positive", confidence: 0.65 };

  return { category: "constructive", confidence: 0.51 };
}

export async function classifyComments(comments: YouTubeComment[]): Promise<ClassifiedComment[]> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || comments.length === 0) {
    return comments.map((comment) => {
      const fallback = classifyHeuristic(comment.text);
      return { ...comment, ...fallback, method: "heuristic" };
    });
  }

  const prompt = [
    "Classify each YouTube comment into exactly one category:",
    "- toxic: insults, harassment, abuse, demeaning attacks",
    "- spam: promotional scams, repetitive self-promo, irrelevant solicitation",
    "- constructive: criticism, suggestions, nuanced disagreement, neutral feedback",
    "- positive: praise, support, gratitude, encouragement",
    'Return strict JSON array with shape: [{"commentId":"...","category":"toxic|spam|constructive|positive","confidence":0.0-1.0}]',
  ].join("\n");

  const input = comments.map((comment) => ({ commentId: comment.commentId, text: comment.text }));

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-nano",
      input: `${prompt}\n\n${JSON.stringify(input)}`,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    return comments.map((comment) => {
      const fallback = classifyHeuristic(comment.text);
      return { ...comment, ...fallback, method: "heuristic" };
    });
  }

  const data = await res.json();
  const outputText = typeof data?.output_text === "string" ? data.output_text : "";

  try {
    const parsed = JSON.parse(outputText) as Array<{ commentId: string; category: string; confidence: number }>;
    const byId = new Map(parsed.map((entry) => [entry.commentId, entry]));

    return comments.map((comment) => {
      const item = byId.get(comment.commentId);
      if (!item || !CATEGORY_ORDER.includes(item.category as CommentCategory)) {
        const fallback = classifyHeuristic(comment.text);
        return { ...comment, ...fallback, method: "heuristic" };
      }

      const confidence = Number(item.confidence);
      return {
        ...comment,
        category: item.category as CommentCategory,
        confidence: Number.isFinite(confidence) ? Math.min(Math.max(confidence, 0), 1) : 0.66,
        method: "llm",
      };
    });
  } catch {
    return comments.map((comment) => {
      const fallback = classifyHeuristic(comment.text);
      return { ...comment, ...fallback, method: "heuristic" };
    });
  }
}

export function summarizeCategories(items: ClassifiedComment[]) {
  const total = items.length;
  const counts: Record<CommentCategory, number> = {
    toxic: 0,
    spam: 0,
    constructive: 0,
    positive: 0,
  };

  for (const item of items) counts[item.category] += 1;

  const percentages: Record<CommentCategory, number> = {
    toxic: total ? Math.round((counts.toxic / total) * 100) : 0,
    spam: total ? Math.round((counts.spam / total) * 100) : 0,
    constructive: total ? Math.round((counts.constructive / total) * 100) : 0,
    positive: total ? Math.round((counts.positive / total) * 100) : 0,
  };

  return { total, counts, percentages };
}
