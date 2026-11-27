#!/usr/bin/env bash
# Puts the commit that is checked out on Google Cloud: builds the image, pushes it, applies the
# migrations with it, then points the collector job at it. Safe to run again.
#
#   FAIRFX_GCP_PROJECT=my-project deploy/collector/release.sh

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
# shellcheck source=deploy/collector/settings.sh
source "$HERE/settings.sh"

require_tools gcloud docker git

if [[ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]]; then
  echo "The working tree has changes. Commit or stash them: the image is tagged with the commit." >&2
  exit 1
fi

COMMIT="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
IMAGE="${REGISTRY}/${PROJECT}/${IMAGE_REPOSITORY}/collector:${COMMIT}"

deploy_job() {
  local job="$1"
  shift
  gcloud run jobs deploy "$job" \
    --image="$IMAGE" \
    --region="$REGION" \
    --service-account="$RUN_ACCOUNT_EMAIL" \
    --set-cloudsql-instances="$SQL_CONNECTION" \
    --set-secrets="DATABASE_URL=${DATABASE_URL_SECRET}:latest" \
    --max-retries=0 \
    --task-timeout="$TASK_TIMEOUT" \
    --cpu=1 \
    --memory=512Mi \
    --tasks=1 \
    "$@"
}

say "Build $IMAGE"
docker build --platform linux/amd64 --file "$HERE/Dockerfile" --tag "$IMAGE" "$REPO_ROOT"

say "Push it"
gcloud auth configure-docker "$REGISTRY"
docker push "$IMAGE"

say "Apply the migrations with the image"
deploy_job "$MIGRATE_JOB" \
  --command=node \
  --args=packages/db/node_modules/node-pg-migrate/bin/node-pg-migrate.js,up,--migrations-dir,packages/db/migrations
gcloud run jobs execute "$MIGRATE_JOB" --region="$REGION" --wait

say "Point the collector at the image"
deploy_job "$COLLECTOR_JOB"

say "Released $COMMIT. The next run uses it."
