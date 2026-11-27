# The collector on Google Cloud

Two scripts put the collector on Google Cloud and keep it there. Both read `settings.sh`, and both can
be run again at any time.

| Script | When | What it does |
| --- | --- | --- |
| `setup.sh` | once per project | creates what is missing, releases the commit that is checked out, starts the schedule |
| `release.sh` | for each new commit | builds the image, pushes it, applies the migrations, points the job at it |

## Before the first run

- A Google Cloud project with a billing account linked to it. The scripts do not create the project.
- `gcloud` signed in (`gcloud auth login`) as an owner of that project.
- Docker running, and `openssl`.

## Run it

```sh
FAIRFX_GCP_PROJECT=my-project pnpm cloud:setup     # everything, from an empty project
FAIRFX_GCP_PROJECT=my-project pnpm cloud:release   # later: the commit that is checked out
```

- `FAIRFX_GCP_PROJECT` is the only value without a default. The region is `us-east4` unless
  `FAIRFX_GCP_REGION` says otherwise. `settings.sh` lists every other name.
- `release.sh` refuses a working tree with changes, because the image is tagged with the commit.
- A new database instance takes about 10 minutes. The rest takes about 2.

## What setup creates

| Resource | Name | Notes |
| --- | --- | --- |
| Artifact Registry repository | `fairfx` | holds `collector:<commit>` |
| Cloud SQL instance | `fairfx-db` | PostgreSQL 18, `db-f1-micro`, 10 GB SSD, one zone, daily backup, deletion protection |
| Database and user | `fairfx`, `collector` | the password is random and is never printed |
| Secret | `collector-database-url` | the whole `DATABASE_URL`, the only place that keeps the password |
| Service accounts | `collector-run`, `collector-scheduler` | the first connects to the database and reads the secret, the second may only start the job |
| Cloud Run jobs | `collector`, `collector-migrate` | one run per start, no retry, 120 second limit |
| Cloud Scheduler job | `collector-every-5-minutes` | `*/5 * * * *` in UTC |

The database instance is the part that costs money while it exists, whether or not anything runs. Read
the Cloud SQL price list for your region before the first setup.

## What it never does

- It never replaces something that exists. A second run skips the instance, the database, the secret
  and the schedule, and only releases the current commit.
- It never changes the password once the secret exists. To rotate it, set a new password for the user
  and add a new version of the secret with the new URL.
- It never deletes. To remove the setup, delete the schedule, the two jobs, the secret, the service
  accounts and the repository, then turn off deletion protection and delete the instance.

## Check a release

```sh
gcloud run jobs executions list --job=collector --region=us-east4 --project=my-project --limit=5
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="collector" AND jsonPayload.event="run"' \
  --project=my-project --freshness=1h --format='value(jsonPayload.slot,jsonPayload.outcome)'
```

Each slot of 5 minutes should show `written` once. `slot_taken` means a second start found the slot
already stored.
