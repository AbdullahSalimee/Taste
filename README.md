# Taste

### *Discover Your Cinematic DNA.*

---

## ✨ The Premise

In a world overflowing with content, **Taste** isn't another watchlist—it's your identity. It's a pre-development platform that transforms how you track, understand, and share your film and series journey. Because what you watch isn't just entertainment; it's a reflection of who you are.

**Taste** is your digital soul, made of scenes.

---

## 🎬 The Experience

| Your Journey | What You'll Find |
| :--- | :--- |
| **Landing** | A stunning marketing showcase that whispers the promise of your cinematic self. |
| **Dashboard** | Your social feed, bubbling with activity, and your "Continue Watching" lifeline. |
| **Profile** | Your hall of fame. Your **Taste DNA Card**, your viewing stats, and an Episode Heatmap that paints the story of your year in TV. |
| **Discover** | Find your "Taste Twins." Dive deep into a director's filmography or explore a decade of cinema. |
| **Calendar** | Never miss a premiere again. Your upcoming episodes and films, all in one place. |

---

## 🧬 The Signature

At the heart of **Taste** lies the **Taste DNA Card** —a living, breathing identity. It's not just a profile picture. It's a generated archetype, a reflection of your unique viewing habits, powered by the Anthropic Claude API and your personal data. It’s the centerpiece of a beautifully crafted profile page that feels less like a dashboard and more like a museum dedicated to you.

### A Glimpse at the Architecture

This isn't just a design; it's a carefully constructed experience. Here's a peek under the hood.

```text
taste/
├── app/                    # Next.js 15 App Router at its core
│   ├── page.tsx            # The cinematic landing page
│   ├── layout.tsx          # The foundation (fonts, grain overlay)
│   ├── globals.css         # Where animations breathe and design tokens live
│   ├── dashboard/          # Your feed
│   ├── profile/            # Your legacy
│   ├── discover/           # Your exploration
│   └── calendar/           # Your future
├── components/
│   ├── features/           # The soul of Taste
│   │   ├── TasteDNACard.tsx # The identity that defines you
│   │   ├── EpisodeHeatmap.tsx # The grid of your dedication
│   │   └── QuickLog.tsx    # A 2-tap portal to logging
│   └── layout/
│       └── Navigation.tsx  # Seamless navigation, from desktop sidebar to mobile bottom bar
└── lib/
    └── mock-data.ts        # The seed of your future database
```

---

## 🎨 The Design Language

### A Palette of Prestige

- **Backgrounds:** `#0D0D0D` to `#1A1A1A`—a foundation of deep, immersive darkness.
- **Text:** `#F0EDE8` (warm white) and its subtle, sophisticated descendants.
- **The Gold:** `#C8A96E`—the cinema screen's warm glow, our guiding accent.

### The Typography of Cinema

- **Playfair Display:** For chapter titles, archetype labels, and hero headlines—the voice of drama and elegance.
- **Inter:** For the UI, the body, the labels—the voice of clarity.
- **JetBrains Mono:** For ratings, stats, and episode codes—the voice of precision.

### The Art of the Subtle

- **`taste-dna-card`**: A scale and blur reveal on mount, as if your identity is coalescing.
- **`archetype-shimmer`**: A gold sweep across your cinematic archetype text—a true signature.
- **`decade-bar`**: Bars that scale from the left on genre and decade selections.
- **`heatmap-cell`**: A staggered scale-in on episode cells, telling a visual story.
- **`chapter-card`**: Slide-in from the left, like turning a page.
- **`feed-item`**: Fade-up on load, as if emerging from the content stream.
- **`log-sheet`**: Slides up from the bottom, a gentle sheet of paper.
- **`poster-reveal`**: Desaturate to color on reveal—a moment of discovery.
- **`skeleton`**: A shimmering loading state, promising richness to come.

---

## 🛠️ The Craftsmanship

Built with a modern stack for a modern experience:

- **Next.js 15 (App Router):** The framework for the cinematic web.
- **TypeScript:** The language of reliability.
- **Tailwind CSS v4 + Plain CSS Animations:** The perfect union of utility and soul.

---

## 🚀 The Road Ahead (v1.1)

The pre-development platform is just the beginning. The next scenes are ready to be shot:

1.  **Wire Supabase:** Transition from `mock-data.ts` to a living, breathing database.
2.  **TMDB API:** Swap mock posters for the vast, real world of live movie data.
3.  **Claude API:** Unlock the true power of the `Taste DNA Card` with real-time archetype generation.
4.  **Auth:** Secure your identity with Supabase Auth (Email + Google OAuth).
5.  **Trakt import:** Bring your history with you.
6.  **JustWatch:** See where to watch, right from the card.
7.  **PWA:** Make Taste a permanent part of your home screen.

---

## 🎯 The Quick Start

Ready to see what your cinematic DNA looks like?

```bash
# Clone the repository
# Install the magic
npm install

# Ignite the dev server
npm run dev
# → http://localhost:3000

# Build for the world
npm run build
```

---

*Taste is born from the **Taste Pre-Development Document v1.0**. It's a platform waiting for your data, your identity, your story.*

---

**Your taste is your identity.**

**Taste** is the place to discover it.
