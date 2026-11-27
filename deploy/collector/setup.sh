#!/usr/bin/env bash
# Builds everything the collector needs in one Google Cloud project, then releases the commit that is
# checked out and starts the 5 minute schedule. It creates only what is missing, so it is safe to run
# again: it never replaces the database, its password or a schedule that exists.
#
#   FAIRFX_GCP_PROJECT=my-project deploy/collector/setup.sh
#
# Before the first run: create the project, link a billing account to it, and `gcloud auth login`.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=deploy/collector/settings.sh
source "$HERE/settings.sh"

require_tools gcloud docker git openssl

exists() {
  "$@" > /dev/null 2>&1
}

# A service that was enabled a moment ago can refuse its first calls.
retry() {
  local attempt
  for attempt in 1 2 3 4 5 6; do
    "$@" && return 0
    echo "Attempt $attempt failed, trying again in 10 seconds" >&2
    sleep 10
  done
  "$@"
}

ensure_service_account() {
  local name="$1" purpose="$2"
  exists gcloud iam service-accounts describe "${name}@${PROJECT}.iam.gserviceaccount.com" \
    || retry gcloud iam service-accounts create "$name" --display-name="$purpose"
}

say "Services"
gcloud services enable \
  run.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com

say "Image repository $IMAGE_REPOSITORY"
exists gcloud artifacts repositories describe "$IMAGE_REPOSITORY" --location="$REGION" \
  || retry gcloud artifacts repositories create "$IMAGE_REPOSITORY" \
    --repository-format=docker --location="$REGION" --description="FairFX images"

say "Database instance $SQL_INSTANCE (a new one takes about 10 minutes)"
exists gcloud sql instances describe "$SQL_INSTANCE" \
  || gcloud sql instances create "$SQL_INSTANCE" \
    --database-version=POSTGRES_18 \
    --edition=ENTERPRISE \
    --tier="$SQL_TIER" \
    --region="$REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --availability-type=zonal \
    --backup-start-time=07:00 \
    --deletion-protection

say "Database $DATABASE"
exists gcloud sql databases describe "$DATABASE" --instance="$SQL_INSTANCE" \
  || gcloud sql databases create "$DATABASE" --instance="$SQL_INSTANCE"

say "Database user $DATABASE_USER and the secret $DATABASE_URL_SECRET"
if exists gcloud secrets describe "$DATABASE_URL_SECRET"; then
  echo "The secret exists, so the user and its password are left as they are."
else
  password="$(openssl rand -hex 24)"
  if gcloud sql users list --instance="$SQL_INSTANCE" --format='value(name)' | grep --quiet --line-regexp "$DATABASE_USER"; then
    gcloud sql users set-password "$DATABASE_USER" --instance="$SQL_INSTANCE" --password="$password"
  else
    gcloud sql users create "$DATABASE_USER" --instance="$SQL_INSTANCE" --password="$password"
  fi
  printf 'postgresql://%s:%s@/%s?host=/cloudsql/%s' "$DATABASE_USER" "$password" "$DATABASE" "$SQL_CONNECTION" \
    | gcloud secrets create "$DATABASE_URL_SECRET" --replication-policy=automatic --data-file=-
  unset password
fi

say "Service accounts"
ensure_service_account "$RUN_ACCOUNT" "Runs the collector job"
ensure_service_account "$SCHEDULER_ACCOUNT" "Starts the collector job on schedule"
retry gcloud projects add-iam-policy-binding "$PROJECT" \
  --member="serviceAccount:${RUN_ACCOUNT_EMAIL}" --role=roles/cloudsql.client --condition=None > /dev/null
retry gcloud secrets add-iam-policy-binding "$DATABASE_URL_SECRET" \
  --member="serviceAccount:${RUN_ACCOUNT_EMAIL}" --role=roles/secretmanager.secretAccessor > /dev/null

"$HERE/release.sh"

say "Schedule $SCHEDULE"
gcloud run jobs add-iam-policy-binding "$COLLECTOR_JOB" --region="$REGION" \
  --member="serviceAccount:${SCHEDULER_ACCOUNT_EMAIL}" --role=roles/run.invoker > /dev/null
exists gcloud scheduler jobs describe "$SCHEDULE" --location="$REGION" \
  || gcloud scheduler jobs create http "$SCHEDULE" \
    --location="$REGION" \
    --schedule="*/5 * * * *" \
    --time-zone="Etc/UTC" \
    --uri="https://run.googleapis.com/v2/projects/${PROJECT}/locations/${REGION}/jobs/${COLLECTOR_JOB}:run" \
    --http-method=POST \
    --oauth-service-account-email="$SCHEDULER_ACCOUNT_EMAIL"

say "Done. The collector runs every 5 minutes in $PROJECT."
