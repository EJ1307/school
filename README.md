# Hopscotch — Early Years & Primary School

A one-page website for **Hopscotch**, a small, play-based school for children aged 2 to 10 in Baner, Pune (Playgroup to Grade 5). It's a demo/pitch site: the school, people, quotes and contact details are fictional.

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no photos — every illustration is hand-written SVG, so the page is light and looks finished before a single photo is taken.

## What's in it

- **Hero** with an illustrated scene (kite, school on the hill, a chalk hopscotch court) that assembles itself on load
- **Why parents choose Hopscotch**: a bento of four reasons plus a sticky note
- **Programmes**: Playgroup, Nursery, Kindergarten, Primary, plus day care
- **A day at Hopscotch**: a scrollable timeline with an alarm clock that follows along and a rail that fills as you go
- **Campus** facilities and a safety & care strip
- **From our art wall**: children's crayon drawings taped to the staffroom fridge
- **Parents say**, **Admissions** (steps on a hopscotch path, age criteria, documents, indicative fees, enquiry form), **FAQ**, **Visit us** with an illustrated map
- A matching **404 page**

## Files

```
index.html          the whole site
404.html            "you've hopped off the court" page
style.css           all styles, organised by section (tokens at the top)
script.js           nav, timeline, accordion, form, scroll reveal, admissions hop
vercel.json         clean URLs + long cache headers for /assets
assets/
  favicon.svg         logo mark
  apple-touch-icon.png
  og-image.png        1200×630 social preview
  art/*.svg           the six children's drawings
  fonts/*.woff2       self-hosted Baloo 2, Nunito, Gochi Hand (+ OFL licences)
```

## Run it locally

From the project folder:

```bash
npx serve .
```

Then open the address it prints (usually http://localhost:3000). Any static server works; opening `index.html` directly also mostly works, but the 404 page and absolute paths need a server.

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Other**. Leave the build command and output directory empty.
4. Deploy. `vercel.json` gives you clean URLs, serves `404.html` for missing pages and caches `/assets` for a year.

Once you have a real domain, update the `canonical`, `og:url`, `og:image` and `twitter:image` URLs in the `<head>` of `index.html` (they currently point at `https://hopscotchschool.in/`).

> Assets are cached as immutable. If you replace a file in `/assets`, give it a new filename (e.g. `og-image-2.png`) so visitors get the new version.

## Customising

### School details

All copy lives in `index.html`, in the order it appears on the page. Things you'll most likely change:

- Name, address, phone, email, office hours — search for `Pallod Farms`, `98765`, `hello@` (they appear in the contact section, the footer, the form intro and the 404 page).
- Timings, ages, class sizes — the programme cards and the FAQ.
- Fees and age criteria — the tables in the Admissions section.
- The form has no backend. To receive enquiries, point the `<form>` at a form service (Formspree, Basin, Netlify-style endpoints, or your own API) and replace the success handler at the end of the "Enquiry form" block in `script.js` with a `fetch()` call.

### Colours and type

Design tokens are CSS custom properties at the top of `style.css`:

```css
--ink: #1F2547;      /* text */
--cream: #FFF8EC;    /* background */
--tomato / --sun / --sky / --grass / --lilac   /* the five brights */
--*-tint                                        /* pale versions for large areas */
```

Each numbered section takes the colour of its hopscotch square (1 tomato, 2 sun, 3 sky, 4 grass, 5 lilac, then round again), which is also the colour order of the court in the footer. Text on colour is always navy, never white, to keep contrast at AA.

The illustrations use the same hex values written directly into the SVG. If you change a brand colour, find-and-replace its hex code in `index.html` and `assets/art/*.svg` too.

Fonts are self-hosted from `assets/fonts` (Baloo 2 for headings, Nunito for text, Gochi Hand for handwritten notes), all under the SIL Open Font License.

### Swapping illustrations for photos

The site is designed to stand on its own without photography, but if the school has good photos:

- **Campus**: each facility has a `.place__art` box. Replace the `<svg>` inside with an `<img>` and add `object-fit: cover; width: 100%; height: 100%; border-radius: inherit;` to `.place__art img`.
- **Hero**: replace the `<svg class="hero-scene">` with an `<img>` (around 1000×1060, portrait). To keep the arch shape, give it `aspect-ratio: 520 / 630; object-fit: cover; border-radius: 999px 999px 32px 32px;`.
- **Art wall**: drop real scans of children's drawings into `assets/art/` and update the `src`, `alt` and the name/age caption for each `<figure class="drawing">`. Get parents' permission first.
- Always write meaningful `alt` text, and export photos at no more than 2× their displayed size (WebP or AVIF where you can).

### Motion

Motion is CSS-first, with a little JavaScript for the timeline and the admissions hop. Everything is in section 18 of `style.css`. It is switched off for visitors who prefer reduced motion, and content is never hidden if JavaScript doesn't run.

## Accessibility notes

- One `h1`, logical headings, landmarks and a skip link.
- Meaningful SVGs have `role="img"` and a title; decorative ones are `aria-hidden`.
- The mobile menu, FAQ accordion and form are fully keyboard-operable (Esc closes the menu, errors are announced inline and focus moves to the first problem).
- Visible focus styles throughout.
