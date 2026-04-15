# Taste — Pre-Development Platform

> *Track every film and series. Discover your cinematic DNA. Find people who watch like you.*

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS v4**, and plain CSS for animations.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + plain CSS animations |
| AI | Anthropic Claude API (ready to wire) |
| Data | Mock data in `lib/mock-data.ts` (swap for Supabase) |
| Fonts | Playfair Display · Inter · JetBrains Mono |

---

## Quick Start

```bash
# Install
npm install

# Dev server
npm run dev
# → http://localhost:3000

# Build
npm run build
```

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — marketing, pricing, DNA showcase |
| `/dashboard` | Home feed — social activity, continue watching |
| `/profile` | User profile — DNA card, chapters, stats, heatmap |
| `/discover` | Discovery — twins, director deep dive, decade explorer |
| `/calendar` | Release calendar — upcoming episodes & films |

---

## File Structure

```
taste/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout (fonts, grain overlay)
│   ├── globals.css           # All animations, design tokens
│   ├── dashboard/            # Feed + currently watching
│   ├── profile/              # Full profile page
│   ├── discover/             # Discovery engine
│   └── calendar/             # Release calendar
├── components/
│   ├── features/
│   │   ├── TasteDNACard.tsx  # Signature identity card
│   │   ├── EpisodeHeatmap.tsx # TV quality grid
│   │   └── QuickLog.tsx      # 2-tap log modal
│   ├── layout/
│   │   └── Navigation.tsx    # Sidebar (desktop) + bottom nav (mobile)
│   └── ui/
│       ├── FilmCard.tsx       # Poster card (sm/md/lg)
│       └── StarRating.tsx     # Interactive half-star rating
├── lib/
│   └── mock-data.ts          # All mock films, series, feed, chapters
├── tailwind.config.ts        # Design system tokens
└── next.config.ts
```

---

## Design System

### Colours
```
Base background:   #0D0D0D
Surface (cards):   #141414
Surface elevated:  #1A1A1A
Border:            #2A2A2A

Text primary:      #F0EDE8  (warm white)
Text secondary:    #8A8780
Text tertiary:     #504E4A

Accent gold:       #C8A96E  (cinema screen warm gold)
Success:           #4A9E6B
Warning:           #C87C2A
```

### Fonts
- **Playfair Display** — chapter titles, archetype labels, hero headlines
- **Inter** — all UI text, labels, body
- **JetBrains Mono** — ratings, stats numbers, episode codes

### Animation classes (plain CSS)
| Class | Effect |
|---|---|
| `.taste-dna-card` | Scale+blur reveal on mount |
| `.archetype-shimmer` | Gold sweep on archetype text |
| `.decade-bar` | Scale-from-left on genre/decade bars |
| `.heatmap-cell` | Staggered scale-in on episode cells |
| `.chapter-card` | Slide-in from left |
| `.feed-item` | Fade up on load |
| `.log-sheet` | Slide up from bottom |
| `.poster-reveal` | Desaturate → colour on reveal |
| `.skeleton` | Shimmer loading state |

---

## Next Steps (v1.1)

1. **Wire Supabase** — swap `lib/mock-data.ts` for real DB calls
2. **TMDB API** — replace mock posters with live search
3. **Claude API** — enable archetype generation in `/api/taste-dna`
4. **Auth** — Supabase Auth (email + Google OAuth)
5. **Trakt import** — OAuth flow at `/import/trakt`
6. **JustWatch** — streaming availability badges
7. **PWA** — manifest + service worker for add-to-homescreen

---

## Environment Variables (when wiring real data)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
TMDB_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

*Built from the Taste Pre-Development Document v1.0*
