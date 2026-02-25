export type Surface = "website" | "webapp" | "desktop" | "mobile" | "general";

export type ThemeIdea = {
  id: string;
  title: string;
  summary: string;
  moodPrompt: string;
};

const GREETINGS = new Set(["hi", "hello", "hey", "yo", "hola", "sup"]);

const COLOR_INTENT_HINTS = [
  "palette",
  "theme",
  "color",
  "style",
  "ui",
  "luxury",
  "minimal",
  "cyberpunk",
  "corporate",
  "pastel",
  "dark",
  "light",
];

const BRAINSTORM_PATTERNS = [
  /\bideas?\b/,
  /\boptions?\b/,
  /\bsuggest(?:ion|ions)?\b/,
  /\brecommend(?:ation|ations)?\b/,
  /\binspiration\b/,
  /\bwhat (?:theme|style)\b/,
  /\bwhich (?:theme|style)\b/,
  /\bfew (?:styles?|themes?)\b/,
  /\b(?:choose|chose|pick one)\b/,
  /\bhelp me\b.*\b(?:theme|style)\b/,
];

const DIRECT_PALETTE_PATTERNS = [
  /\b(?:generate|create|make|build|show|produce|craft)\b.*\b(?:palette|colors?|theme)\b/,
  /\b(?:palette|colors?)\b.*\b(?:for|from)\b/,
  /\b(?:regenerate|regen|rebuild)\b.*\b(?:palette|theme|colors?)\b/,
  /\bapply palette\b/,
  /\bhex\b/,
];

const SURFACE_LABELS: Record<Surface, string> = {
  website: "website",
  webapp: "web app",
  desktop: "desktop app",
  mobile: "mobile app",
  general: "product",
};

const IDEA_LIBRARY: Record<Surface, ThemeIdea[]> = {
  desktop: [
    {
      id: "desktop-enterprise-slate",
      title: "Enterprise Slate",
      summary:
        "Cool slate neutrals with confident blue actions for dense, professional workflows.",
      moodPrompt:
        "Professional desktop app theme with slate neutrals, focused blue actions, clear hierarchy, and strong readability for long work sessions.",
    },
    {
      id: "desktop-nordic-minimal",
      title: "Nordic Minimal",
      summary:
        "Clean light surfaces, muted contrast, and restrained accents for a calm productivity feel.",
      moodPrompt:
        "Minimal desktop productivity theme with soft cool grays, subtle accent colors, and a clean, distraction-free UI tone.",
    },
    {
      id: "desktop-noir-command",
      title: "Noir Command Center",
      summary:
        "Dark graphite foundation with vivid accents for focused, power-user interfaces.",
      moodPrompt:
        "Dark desktop control-center theme with graphite backgrounds, high-contrast text, and bright accent cues for critical actions.",
    },
    {
      id: "desktop-warm-studio",
      title: "Warm Studio",
      summary:
        "Warm neutrals with elegant highlights for creative tools and maker-style products.",
      moodPrompt:
        "Warm creative desktop app theme with paper-like neutrals, tasteful amber accents, and balanced contrast for editor-focused layouts.",
    },
  ],
  mobile: [
    {
      id: "mobile-fintech-clean",
      title: "Fintech Clean",
      summary:
        "Trust-focused blues, airy backgrounds, and crisp contrast for transaction clarity.",
      moodPrompt:
        "Modern mobile fintech theme with trustworthy blues, bright clean backgrounds, and high readability for balances and actions.",
    },
    {
      id: "mobile-playful-bloom",
      title: "Playful Bloom",
      summary:
        "Friendly pastel base with energetic accents for social or learning apps.",
      moodPrompt:
        "Playful mobile app palette with soft pastel surfaces, cheerful accents, and legible text for an inviting experience.",
    },
    {
      id: "mobile-midnight-neon",
      title: "Midnight Neon",
      summary:
        "Dark-mode first with electric highlights for modern, expressive interfaces.",
      moodPrompt:
        "Dark mobile app theme with deep night backgrounds, electric accent colors, and clear high-contrast text.",
    },
    {
      id: "mobile-luxe-minimal",
      title: "Luxe Minimal",
      summary:
        "Refined neutrals and gold-like accents for premium subscription experiences.",
      moodPrompt:
        "Premium mobile product theme with refined neutrals, restrained luxe accents, and elegant readable contrast.",
    },
  ],
  webapp: [
    {
      id: "webapp-ops-blueprint",
      title: "Ops Blueprint",
      summary:
        "Structured blue-gray system optimized for dashboards, data tables, and admin surfaces.",
      moodPrompt:
        "Enterprise web app dashboard theme with blue-gray structure, practical contrast, and clear emphasis for analytics and controls.",
    },
    {
      id: "webapp-forest-analytics",
      title: "Forest Analytics",
      summary:
        "Grounded green-leaning palette that feels stable and sustainable for reporting tools.",
      moodPrompt:
        "Data-heavy web app theme with grounded green tones, neutral supports, and strong readability across charts and cards.",
    },
    {
      id: "webapp-carbon-pro",
      title: "Carbon Pro",
      summary:
        "Dark industrial base with crisp cyan accents for technical monitoring products.",
      moodPrompt:
        "Dark professional web app theme with carbon backgrounds, sharp cyan accents, and accessible contrast for monitoring interfaces.",
    },
    {
      id: "webapp-sandstone-workbench",
      title: "Sandstone Workbench",
      summary:
        "Warm neutral canvas with restrained color pops for long-form workflow software.",
      moodPrompt:
        "Warm-neutral web app theme with sandstone-inspired surfaces, subtle accents, and comfortable contrast for all-day use.",
    },
  ],
  website: [
    {
      id: "website-editorial-premium",
      title: "Editorial Premium",
      summary:
        "Elegant high-contrast typography palette with selective rich accents.",
      moodPrompt:
        "Premium marketing website theme with elegant neutrals, selective rich accents, and strong text contrast for storytelling sections.",
    },
    {
      id: "website-sunrise-brand",
      title: "Sunrise Brand",
      summary:
        "Warm, optimistic color system ideal for creative portfolio or agency pages.",
      moodPrompt:
        "Warm and optimistic website theme with sunrise-inspired accents, clean backgrounds, and readable body text.",
    },
    {
      id: "website-midnight-studio",
      title: "Midnight Studio",
      summary:
        "Bold dark-first visual language for modern studios and tech landing pages.",
      moodPrompt:
        "Dark website theme for modern product marketing with deep backgrounds, bold accents, and clear readable text.",
    },
    {
      id: "website-minimal-monochrome",
      title: "Minimal Monochrome",
      summary:
        "Black, white, and one accent color for focused conversion-oriented messaging.",
      moodPrompt:
        "Minimal monochrome website palette with one strong accent color and high readability for conversion-focused pages.",
    },
  ],
  general: [
    {
      id: "general-modern-neutral",
      title: "Modern Neutral",
      summary:
        "Balanced neutral foundation with one bold accent, safe for many product types.",
      moodPrompt:
        "Modern neutral UI palette with clean background, clear text contrast, and one bold accent for actions.",
    },
    {
      id: "general-calm-professional",
      title: "Calm Professional",
      summary:
        "Soft cool tones that feel reliable, suitable for business and productivity products.",
      moodPrompt:
        "Calm professional app palette with cool tones, dependable contrast, and measured accents for clarity.",
    },
    {
      id: "general-bold-contrast",
      title: "Bold Contrast",
      summary:
        "High-energy accents over dark or deep backgrounds for expressive brand character.",
      moodPrompt:
        "Bold high-contrast palette with deep foundations, bright accents, and accessible text for impactful interfaces.",
    },
    {
      id: "general-warm-creative",
      title: "Warm Creative",
      summary:
        "Inviting warm base with playful accents for creative and community-driven products.",
      moodPrompt:
        "Warm creative theme with inviting neutrals, expressive accents, and comfortable readability for varied UI surfaces.",
    },
  ],
};

function normalizeText(text: string) {
  return text.trim().toLowerCase();
}

function tokenScore(idea: ThemeIdea, prompt: string) {
  const normalizedPrompt = normalizeText(prompt);
  const searchable =
    `${idea.title} ${idea.summary} ${idea.moodPrompt}`.toLowerCase();
  const emphasisTokens = [
    "minimal",
    "modern",
    "corporate",
    "premium",
    "luxury",
    "dark",
    "light",
    "warm",
    "cool",
    "playful",
    "bold",
  ];

  return emphasisTokens.reduce((score, token) => {
    if (normalizedPrompt.includes(token) && searchable.includes(token)) {
      return score + 1;
    }
    return score;
  }, 0);
}

export function detectSurface(text: string): Surface {
  const normalized = normalizeText(text);
  if (/\bmobile\b|\bios\b|\bandroid\b/.test(normalized)) return "mobile";
  if (/\bdesktop\b|\bwindows\b|\bmac\b|\belectron\b/.test(normalized))
    return "desktop";
  if (/\bweb ?app\b|\bdashboard\b|\badmin\b|\bsaas\b/.test(normalized))
    return "webapp";
  if (/\bwebsite\b|\blanding\b|\bportfolio\b|\bmarketing\b/.test(normalized))
    return "website";
  return "general";
}

export function isGreeting(text: string) {
  const normalized = normalizeText(text).replace(/[!?.,]/g, "");
  return GREETINGS.has(normalized);
}

export function isAmbiguousRequest(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  if (isGreeting(normalized)) return false;

  const words = normalized.split(/\s+/).filter(Boolean);
  const hasIntent = COLOR_INTENT_HINTS.some((hint) =>
    normalized.includes(hint),
  );
  return words.length <= 2 && !hasIntent;
}

export function isExplicitPaletteRequest(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (DIRECT_PALETTE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  const hasActionVerb =
    /\b(?:generate|create|make|build|show|produce|craft|regenerate|update|tweak)\b/.test(
      normalized,
    );
  const hasTarget = /\b(?:palette|colors?|theme|hex)\b/.test(normalized);
  return hasActionVerb && hasTarget;
}

export function isBrainstormRequest(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (isExplicitPaletteRequest(normalized)) return false;
  return BRAINSTORM_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function buildThemeIdeas(prompt: string, maxIdeas = 4): ThemeIdea[] {
  const surface = detectSurface(prompt);
  const baseIdeas = IDEA_LIBRARY[surface] || IDEA_LIBRARY.general;
  const sorted = [...baseIdeas].sort(
    (a, b) => tokenScore(b, prompt) - tokenScore(a, prompt),
  );
  return sorted.slice(0, Math.max(1, maxIdeas));
}

export function formatThemeIdeaReply(prompt: string, ideas: ThemeIdea[]) {
  const surface = detectSurface(prompt);
  const label = SURFACE_LABELS[surface];
  const lines = [
    `Good direction. Here are ${ideas.length} ${label} theme ideas you can choose from:`,
    "",
  ];

  ideas.forEach((idea, index) => {
    lines.push(`${index + 1}. ${idea.title} - ${idea.summary}`);
  });

  lines.push("");
  lines.push(
    `Reply with a number (1-${ideas.length}) and I will generate a full 5-color palette for that option.`,
  );

  return lines.join("\n");
}

export function parseIdeaSelection(
  text: string,
  ideaCount: number,
): number | null {
  if (ideaCount <= 0) return null;
  const normalized = normalizeText(text);
  if (!normalized) return null;

  if (/^\d+$/.test(normalized)) {
    const selected = Number.parseInt(normalized, 10);
    if (selected >= 1 && selected <= ideaCount) return selected - 1;
  }

  const numberedSelection = normalized.match(
    /\b(?:option|idea|style|theme|number)\s*(\d+)\b/,
  );
  if (numberedSelection) {
    const selected = Number.parseInt(numberedSelection[1], 10);
    if (selected >= 1 && selected <= ideaCount) return selected - 1;
  }

  const verbSelection = normalized.match(
    /\b(?:pick|choose|select|go with)\b[^0-9]*(\d+)\b/,
  );
  if (verbSelection) {
    const selected = Number.parseInt(verbSelection[1], 10);
    if (selected >= 1 && selected <= ideaCount) return selected - 1;
  }

  const ordinals: Array<{ token: string; index: number }> = [
    { token: "first", index: 0 },
    { token: "second", index: 1 },
    { token: "third", index: 2 },
    { token: "fourth", index: 3 },
    { token: "fifth", index: 4 },
  ];

  const looksLikeSelection =
    /\b(?:pick|choose|select|go with|option|idea|style|theme|one)\b/.test(
      normalized,
    );

  if (!looksLikeSelection) return null;

  for (const ordinal of ordinals) {
    if (normalized.includes(ordinal.token) && ordinal.index < ideaCount) {
      return ordinal.index;
    }
  }

  return null;
}
