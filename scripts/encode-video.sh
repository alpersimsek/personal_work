#!/usr/bin/env bash
# Compresses a background video for the site and writes it to public/videos.
#
# Usage: scripts/encode-video.sh <source-video> <name>
# Example: scripts/encode-video.sh video_library/06_kocluk_netlik.mp4 netlik
#   -> public/videos/netlik.mp4, used in the code as '/videos/netlik.mp4'
#
# The site plays these videos muted in a loop, so the sound is dropped. Width is
# capped at 1280 px, H.264 at CRF 26 (lower = sharper and larger) with the
# metadata at the front so playback starts before the download finishes.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <source-video> <name>" >&2
  exit 1
fi

source_video="$1"
name="$2"
output="$(cd "$(dirname "$0")/.." && pwd)/public/videos/${name}.mp4"

if [ ! -f "$source_video" ]; then
  echo "Source video not found: $source_video" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg is not installed. Ubuntu: sudo apt-get install -y ffmpeg. macOS: brew install ffmpeg." >&2
  exit 1
fi

mkdir -p "$(dirname "$output")"
ffmpeg -hide_banner -loglevel error -y -i "$source_video" \
  -an -vf "scale='min(1280,iw)':-2" \
  -c:v libx264 -preset slow -crf 26 -profile:v high -pix_fmt yuv420p \
  -movflags +faststart "$output"

echo "Wrote $output ($(du -h "$output" | cut -f1))"
