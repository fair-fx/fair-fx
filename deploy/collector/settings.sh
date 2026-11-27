# shellcheck shell=bash
# What the collector is called on Google Cloud, and how big it is. Sourced by setup.sh and release.sh.
# Only the project has no default. Every other value can be set from the environment.
#
# The names are read by the scripts that source this file, not here.
# shellcheck disable=SC2034

: "${FAIRFX_GCP_PROJECT:?set FAIRFX_GCP_PROJECT to the id of your Google Cloud project}"

PROJECT="$FAIRFX_GCP_PROJECT"
REGION="${FAIRFX_GCP_REGION:-us-east4}"

IMAGE_REPOSITORY="${FAIRFX_IMAGE_REPOSITORY:-fairfx}"
REGISTRY="${REGION}-docker.pkg.dev"

SQL_INSTANCE="${FAIRFX_SQL_INSTANCE:-fairfx-db}"
SQL_TIER="${FAIRFX_SQL_TIER:-db-f1-micro}"
DATABASE="${FAIRFX_DATABASE:-fairfx}"
DATABASE_USER="${FAIRFX_DATABASE_USER:-collector}"
# Holds the whole DATABASE_URL, password included. Nothing else keeps the password.
DATABASE_URL_SECRET="${FAIRFX_DATABASE_URL_SECRET:-collector-database-url}"

COLLECTOR_JOB="${FAIRFX_COLLECTOR_JOB:-collector}"
MIGRATE_JOB="${FAIRFX_MIGRATE_JOB:-collector-migrate}"
SCHEDULE="${FAIRFX_SCHEDULE:-collector-every-5-minutes}"

RUN_ACCOUNT="${FAIRFX_RUN_ACCOUNT:-collector-run}"
SCHEDULER_ACCOUNT="${FAIRFX_SCHEDULER_ACCOUNT:-collector-scheduler}"
RUN_ACCOUNT_EMAIL="${RUN_ACCOUNT}@${PROJECT}.iam.gserviceaccount.com"
SCHEDULER_ACCOUNT_EMAIL="${SCHEDULER_ACCOUNT}@${PROJECT}.iam.gserviceaccount.com"

# A job reaches the database through this name, over a socket under /cloudsql.
SQL_CONNECTION="${PROJECT}:${REGION}:${SQL_INSTANCE}"

# A write that meets every database limit ends in 70 seconds, so a run that takes longer is stuck.
TASK_TIMEOUT=120s

export CLOUDSDK_CORE_PROJECT="$PROJECT"
export CLOUDSDK_CORE_DISABLE_PROMPTS=1

say() {
  printf '\n== %s\n' "$*"
}

require_tools() {
  local tool
  for tool in "$@"; do
    command -v "$tool" > /dev/null || {
      echo "$tool is not installed" >&2
      exit 1
    }
  done
}
