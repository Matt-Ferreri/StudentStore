const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "into",
  "onto",
  "over",
  "under",
  "that",
  "this",
  "these",
  "those",
  "you",
  "your",
  "our",
  "are",
  "was",
  "were",
  "been",
  "have",
  "has",
  "had",
  "not",
  "but",
  "nor",
  "its",
  "looking",
  "look",
  "want",
  "wanted",
  "wants",
  "need",
  "needed",
  "needs",
  "please",
  "any",
  "some",
  "hoping",
  "hope",
  "find",
  "finding",
  "buy",
  "buying",
]);

export function wishMatchesListing(phrase: string, listingText: string): boolean {
  const wishTokens = meaningfulTokens(phrase);
  if (wishTokens.size === 0) {
    return false;
  }

  const listingTokens = meaningfulTokens(listingText);
  for (const token of wishTokens) {
    if (!listingTokens.has(token)) {
      return false;
    }
  }

  return true;
}

function meaningfulTokens(text: string): Set<string> {
  const tokens = new Set<string>();

  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOP_WORDS.has(raw)) {
      continue;
    }

    tokens.add(stem(raw));
  }

  return tokens;
}

function stem(word: string): string {
  if (word.length > 4 && word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }

  return word;
}
