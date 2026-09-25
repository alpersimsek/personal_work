# Background videos

The site's background videos are served by the site itself from `public/videos/` (about 4.6 MB in total). They are committed to git, so `git pull` brings them and `npm run dev`, `npm run build` and production all serve them at `/videos/<name>.mp4`. No video tooling is needed to run the site.

| File | Used in |
|---|---|
| `hero.mp4` | Hero section |
| `yaklasim.mp4` | Approach section (`FeaturedVideoSection`) |
| `netlik.mp4`, `donusum.mp4`, `denge.mp4` | Coaching area cards (`ServicesSection`); `denge.mp4` is also the philosophy section |

## Adding or replacing a video

1. Keep the original outside git (the `video_library/` folder is ignored).
2. Install ffmpeg once: Ubuntu `sudo apt-get install -y ffmpeg`, macOS `brew install ffmpeg`.
3. Compress it: `scripts/encode-video.sh video_library/<original>.mp4 <name>` writes `public/videos/<name>.mp4` (no sound, at most 1280 px wide, H.264 CRF 26). Aim for 1 to 3 MB per clip; raise the CRF number in the script for smaller files.
4. Use `/videos/<name>.mp4` in the component. The clips are muted loops, so keep `muted`, `playsInline` and `loop` on the `<video>`.
5. Commit the file. Do not commit originals: every video stays in git history for good.

The content security policy allows media only from the site itself (`media-src 'self'` in `server/app.ts`), so a video from another host will not play until that list is changed.
