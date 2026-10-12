#!/usr/bin/env bash
set -Eeuo pipefail

expected_sha="${1:?Pass the GitHub commit SHA}"
[[ "$expected_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 2; }

app_dir=/home/tugbasim/tugba-app
node_activate=/home/tugbasim/nodevenv/tugba-app/22/bin/activate
health_url=https://www.tugbasimsek.com.tr/api/health

[[ -d "$app_dir/.git" ]] || { echo "Git checkout not found: $app_dir" >&2; exit 1; }
[[ -f "$node_activate" ]] || { echo "Node 22 activation not found: $node_activate" >&2; exit 1; }
command -v flock >/dev/null || { echo 'flock is required' >&2; exit 1; }

exec 9>"$HOME/.tugba-app-deploy.lock"
flock -w 600 9 || { echo 'Another deployment is running' >&2; exit 1; }

cd "$app_dir"
source "$node_activate"
[[ "$(node -p 'process.versions.node.split(".")[0]')" == 22 ]] || {
  echo 'Node 22 is required' >&2
  exit 1
}
[[ "$(git branch --show-current)" == main ]] || { echo 'Server checkout must be on main' >&2; exit 1; }
[[ -z "$(git status --porcelain --untracked-files=no)" ]] || {
  echo 'Server checkout has tracked changes; resolve them before deploying' >&2
  exit 1
}
if [[ ! -f .env && -z "${DB_NAME:-}" ]]; then
  echo 'Production database settings must be available to this SSH shell or in the server-only .env file' >&2
  exit 1
fi

git fetch --no-tags origin main
git merge-base --is-ancestor "$expected_sha" FETCH_HEAD || {
  echo 'Requested commit is not on origin/main' >&2
  exit 1
}
git merge-base --is-ancestor HEAD "$expected_sha" || {
  echo 'Server checkout cannot fast-forward to requested commit' >&2
  exit 1
}
git merge --ff-only "$expected_sha"

npm ci --include=dev
npm run build:hosting
[[ -f dist/index.html && -f dist-server/index.js && -f public/newsletter-logo.png ]] || {
  echo 'Required build output or newsletter logo is missing' >&2
  exit 1
}
npm prune --omit=dev
NODE_ENV=production npm run db:migrate:prod
NODE_ENV=production npm run images:migrate:prod

mkdir -p tmp
touch tmp/restart.txt

for attempt in {1..12}; do
  if curl --fail --silent --show-error --max-time 10 "$health_url" |
    node -e 'let body=""; process.stdin.on("data", c => body += c); process.stdin.on("end", () => { try { process.exit(JSON.parse(body).status === "ok" ? 0 : 1); } catch { process.exit(1); } });'; then
    echo "Deployment healthy at $expected_sha"
    exit 0
  fi
  echo "Health check $attempt/12 failed; retrying"
  sleep 5
done

echo "Deployment failed health check at $expected_sha" >&2
exit 1
