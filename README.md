# KayKav Academy — Domain Expert Builders

A single-page partnership site for governments, foundations and development partners.
All copy is drawn from the Partner Pitch deck and the Partnership Proposal.

## Run it

Any static server works. From this folder:

```
python3 -m http.server 4321
# then open http://127.0.0.1:4321
```

Opening `index.html` directly from the filesystem also works, but a server is
recommended so the CDN scripts and webfonts resolve consistently.

## Deploy

It is a static site with no build step. Upload the whole folder to Netlify,
Vercel, Cloudflare Pages, GitHub Pages or any host. Nothing needs compiling.

## Files

```
index.html            all markup and copy
assets/css/style.css  design system and every layout
assets/js/gl.js       the proposal-panel shader (raw WebGL, no library)
assets/js/main.js     smooth scroll, reveals, scroll-driven set pieces
assets/img/favicon.svg
assets/img/pitch-poster.jpg          video poster frame
assets/video/kaykav-deb-story.mp4          the pitch video (web encode)
```

## Dependencies

Loaded from CDN at pinned versions, no package install needed to run the site:

| Library | Version | Used for |
|---|---|---|
| GSAP + ScrollTrigger | 3.13.0 | all animation and scroll triggers |
| Lenis | 1.1.18 | smooth scrolling |
| Fraunces + Inter | Google Fonts | display serif and interface sans |

## Design system

Tokens live at the top of `style.css`.

- **Ink** `#08172B`, **navy** `#24518F`, **gold** `#C09150`, **cream** `#F4E8D7`, **paper** `#FBF8F3`
- **Fraunces** for display, **Inter** for text
- Every size uses `clamp()`, so the layout scales continuously rather than
  snapping between breakpoints

## The pitch player

The hero leads with the video. Text sits underneath it.

The player is a single element that is never re-mounted, so playback never
restarts. It is `position: fixed` and its rectangle is interpolated every scroll
frame between two targets: the `.hero__stage` box at the top of the page, and a
small box in the bottom-right corner. Because the docked rectangle is read live
from the stage, the player stays glued to the stage while you are at the top and
eases into the corner as you scroll away. Scroll back up and it returns.

The transition runs over the first `72vh` of scrolling. While floating it keeps
playing, and it offers pause, mute, seek, a button that returns you to the top,
and a dismiss button. Dismissing hides it until you scroll back to the top.

### The pitch video

`assets/video/kaykav-deb-story.mp4` is the real pitch, encoded for the web:
720p30, H.264 high profile, AAC audio, `faststart` so it begins playing before
the whole file arrives. The master (1080p60, 253MB) is kept in this folder as
`Kaykav DEB Story.mp4` and is gitignored — it is far past GitHub's 100MB file
limit and far too heavy to serve to a browser.

To re-encode from the master after an edit:

```
ffmpeg -i "assets/video/Kaykav DEB Story.mp4" \
  -c:v libx264 -preset slow -crf 24 -maxrate 1800k -bufsize 3600k \
  -vf "scale=1280:720:flags=lanczos,fps=30" -pix_fmt yuv420p \
  -c:a aac -b:a 96k -movflags +faststart -map_metadata -1 \
  assets/video/kaykav-deb-story.mp4
```

To swap in a different file entirely, replace it along with
`assets/img/pitch-poster.jpg` and update the `<source>` and `poster` attributes
on `#video` in `index.html`. Nothing else needs to change — the duration shown
next to the play button is read from the file, so it corrects itself.

For a YouTube or Vimeo embed, swap the `<video>` for the provider's `<iframe>`.
The docking mechanism only moves and resizes the container, so it works
unchanged, but you lose the custom controls and the duration readout.

## The proposal panel

The one remaining shader draws a drifting topographic field behind "One pilot
cohort." It is written in raw WebGL, roughly 80 lines, and pauses when off
screen or when the tab is hidden. Removing the hero lattice let Three.js go
with it, which took about 600KB out of the page.

## Motion

- Headings split into lines and rise behind a mask. Splitting waits for
  `document.fonts.ready`, otherwise line breaks are measured against the
  fallback font and land in the wrong place. The hero headline is exempt: it
  is a plain fade, so it can wrap freely at any width.
- The manifesto fills in word by word, tied to scroll position.
- Counters run once when they enter view.
- The six-week timeline pins and scrolls horizontally on desktop. On touch and
  narrow screens it becomes a native swipe rail with scroll snapping, which is
  a better fit for a thumb than hijacked scrolling.
- A custom cursor, hover previews on the product list and card tilt are all
  gated behind `(hover:hover) and (pointer:fine)`.

`prefers-reduced-motion` disables the smooth scroll, the reveals and the grain,
and slows the shader. The player then snaps between docked and floating with a
short CSS transition instead of tracking the scroll continuously. An inline script in `<head>` clears the preloader if a
script ever fails to load, so the page can never trap itself behind it.

## Editing copy

All text is in `index.html`. Section ids match the nav and the in-page menu:
`#problem #changed #insight #proof #method #case #programme #weeks #examples
#safeguards #impact #partner #cost #proposal #contact`.

The three PDF attachments in the footer are listed as text, not links, because
the files are not in this repository. Add them to `assets/` and link them when
they are ready.
