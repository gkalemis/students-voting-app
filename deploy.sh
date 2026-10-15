#!/usr/bin/env bash
set -Eeuo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
umask 077

service="voting-app"
stopped=false
finished=false
previous_image=""
image_name=""
backup_dir=""
check_only=false
case "${1:-}" in
  --check) check_only=true ;;
  '') ;;
  *) printf 'Usage: %s [--check]\n' "$0" >&2; exit 2 ;;
esac
[ "$#" -le 1 ] || { printf 'Too many arguments\n' >&2; exit 2; }

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

env_value() {
  local key="$1" value
  value="$(awk -v key="$key" '
    $0 ~ "^[[:space:]]*" key "[[:space:]]*=" {
      sub("^[[:space:]]*" key "[[:space:]]*=[[:space:]]*", "")
      result=$0
    }
    END { printf "%s", result }
  ' .env | tr -d '\r')"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

recover() {
  local code=$?
  trap - EXIT INT TERM
  if [ "$finished" = false ] && [ "$stopped" = true ] && [ -n "$previous_image" ] && [ -n "$image_name" ]; then
    printf '\nDeployment failed; restoring the previous image...\n' >&2
    docker tag "$previous_image" "$image_name" || true
    docker compose up -d --no-deps --force-recreate --no-build "$service" || true
  fi
  [ -z "$backup_dir" ] || printf 'Backup directory: %s\n' "$backup_dir" >&2
  exit "$code"
}
trap recover EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

require docker
require curl
require git
require tar
[ -f .env ] || fail '.env is missing'

if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  fail 'Working tree is not clean; review and commit local changes before pulling or deploying. Nothing was discarded.'
fi

branch="$(git symbolic-ref --quiet --short HEAD)" || fail 'Deployments require a named Git branch'
upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null)" \
  || fail "Branch ${branch} has no configured upstream"
remote="$(git config --get "branch.${branch}.remote")"
[ -n "$remote" ] || fail "Branch ${branch} has no configured remote"

printf 'Fetching %s for synchronization verification...\n' "$remote"
git fetch --prune "$remote"
local_commit="$(git rev-parse HEAD)"
upstream_commit="$(git rev-parse '@{upstream}')"
merge_base="$(git merge-base HEAD '@{upstream}')"
printf 'Local:    %s %s\n' "$branch" "${local_commit:0:12}"
printf 'Upstream: %s %s\n' "$upstream" "${upstream_commit:0:12}"

if [ "$local_commit" != "$upstream_commit" ]; then
  if [ "$local_commit" = "$merge_base" ]; then
    printf '\nIncoming changes from %s:\n' "$upstream"
    git log --oneline "HEAD..@{upstream}" >&2
    git diff --stat "HEAD..@{upstream}" >&2
    git diff --name-status "HEAD..@{upstream}" >&2
    if [ "$check_only" = true ]; then
      printf '\nFast-forward is possible. Review with: git diff HEAD..%s\nRun ./deploy.sh to confirm the pull and deploy.\n' "$upstream"
      exit 0
    fi
    [ -t 0 ] || fail 'Pull requires interactive confirmation; run ./deploy.sh from a terminal'
    read -r -p 'Pull these reviewed changes and deploy? Type yes: ' answer
    [ "$answer" = yes ] || fail 'Cancelled before pull or deployment'
    source_backup="backups/pre-pull-$(date +%Y%m%d-%H%M%S)-${local_commit:0:12}"
    mkdir -p "$source_backup"
    git archive --format=tar.gz HEAD > "$source_backup/source.tar.gz"
    tar -tzf "$source_backup/source.tar.gz" > /dev/null
    printf 'Source backup: %s/source.tar.gz\n' "$source_backup"
    # Merge the exact commit just reviewed; do not fetch a different commit during pull.
    git merge --ff-only "$upstream_commit"
    printf '%s\n' 'Updated source. Restarting the updated deployment script...'
    exec bash ./deploy.sh
  elif [ "$upstream_commit" = "$merge_base" ]; then
    printf '\nDeployment stopped: local source contains commits not pushed to %s.\n' "$upstream" >&2
    git log --oneline "@{upstream}..HEAD" >&2
    printf '\nReview and push the commits before deployment.\n' >&2
  else
    printf '\nDeployment stopped: %s and %s have diverged.\n' "$branch" "$upstream" >&2
    printf 'Resolve the branches manually; do not reset or force-push production history.\n' >&2
  fi
  exit 1
fi
printf '%s\n' 'Git synchronization verified.'
if [ "$check_only" = true ]; then
  printf '%s\n' 'No incoming changes. No pull, build or deployment performed.'
  exit 0
fi

docker compose config --quiet
public_base_url="$(env_value PUBLIC_BASE_URL)"
case "$public_base_url" in
  https://*) public_base_url="${public_base_url%/}" ;;
  *) fail 'PUBLIC_BASE_URL must be an HTTPS URL in .env' ;;
esac

container_id="$(docker compose ps -q "$service")"
if [ -n "$container_id" ]; then
  previous_image="$(docker inspect "$container_id" --format '{{.Image}}')"
  image_name="$(docker inspect "$container_id" --format '{{.Config.Image}}')"
fi

printf '%s\n' 'Building the application image before downtime...'
docker compose build "$service"

timestamp="$(date +%Y%m%d-%H%M%S)"
backup_dir="backups/pre-deploy-${timestamp}"
archive_tmp="${backup_dir}/data.tar.gz.tmp"
archive="${backup_dir}/data.tar.gz"
mkdir -p "$backup_dir"

printf '%s\n' 'Stopping the application for a consistent backup...'
docker compose stop "$service"
stopped=true

docker compose run --rm --no-deps -T data-init \
  sh -c 'tar -C /app/data -czf - .' > "$archive_tmp"
tar -tzf "$archive_tmp" > "${backup_dir}/contents.txt"
grep -qx './db.json' "${backup_dir}/contents.txt" || fail 'Backup does not contain db.json'
mv "$archive_tmp" "$archive"
printf 'Verified backup: %s\n' "$archive"

printf '%s\n' 'Starting the new image...'
docker compose up -d --no-deps --force-recreate --no-build "$service"

container_id="$(docker compose ps -q "$service")"
[ -n "$container_id" ] || fail 'Application container was not created'
health="starting"
for _ in $(seq 1 45); do
  health="$(docker inspect "$container_id" --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}')"
  [ "$health" = healthy ] && break
  [ "$health" = unhealthy ] && break
  sleep 2
done
[ "$health" = healthy ] || { docker compose logs --no-color --tail=100 "$service"; fail "Container health is $health"; }

health_body="$(curl -fsS --retry 5 --retry-all-errors --retry-delay 2 --max-time 20 "${public_base_url}/api/health")"
printf '%s' "$health_body" | grep -q '"status":"ok"' || fail 'Public health response is invalid'

headers_file="$(mktemp)"
curl -fsS -I --max-time 20 "$public_base_url/" > "$headers_file"
for header in content-security-policy strict-transport-security x-content-type-options x-frame-options; do
  grep -qi "^${header}:" "$headers_file" || fail "Missing public security header: $header"
done
rm -f "$headers_file"

ports="$(docker inspect "$container_id" --format '{{json .NetworkSettings.Ports}}')"
printf '%s' "$ports" | grep -q '"3000/tcp":null' || fail 'Application port is unexpectedly published on the host'

finished=true
trap - EXIT INT TERM
printf '\nDeployment successful.\n'
printf 'Health: %s\n' "$health"
printf 'Backup: %s\n' "$archive"
printf 'Image: %s\n' "$(docker inspect "$container_id" --format '{{.Image}}')"
