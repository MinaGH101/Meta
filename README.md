# Meta Holding unified website

This repository contains the existing React/Vite website, a focused FastAPI API, PostgreSQL, and a server-rendered SQLAdmin management dashboard.

## Run in development

From the project root:

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Website: `http://localhost:5173`
- Admin login: `https://metaholding.ir/api/admin/`
- API documentation: `https://metaholding.ir/api/docs`
- Readiness check: `https://metaholding.ir/api/health/ready`

Default local administrator:

```text
admin@example.com
ChangeMe123!
```

Change the administrator password and secrets in `.env` before deployment.

The development Compose file bind-mounts both applications. Vite and Uvicorn reload automatically when source files change.

## Admin dashboard

`/admin/` opens SQLAdmin authentication and then the custom management dashboard at `/admin/management`.

### Projects

The Projects area has three tabs:

- **Tarahi**: project CRUD, one uploaded cover per project, and project-level subgroup CRUD. Every subgroup has a name, optional description, and multiple uploaded images with previews and deletion controls.
- **Nezarat**: region CRUD, project CRUD, project image management, and Nezarat table CRUD.
- **Ejra**: project CRUD and project image management. Ejra intentionally has no category.

Each project form supports:

- name, slug, metraj, location, description, open/closed state, year, and display order;
- Tarahi project subgroups (for example Design, Structure, and Electrical) or Nezarat region;
- Nezarat orientation;
- one Tarahi cover plus multiple uploaded images inside every Tarahi subgroup;
- existing frontend image filenames, one filename per line;
- image filename/URL editing, alt text, caption, order, cover selection, replacement upload, and deletion.

### Users

The Users area supports listing, creating, editing, activating/deactivating, changing roles/passwords, and deleting users. The same operations are exposed through `/api/v1/admin/users`.

### Messages

The Messages area has Received, Sent, and Compose tabs.

- Received messages are contact messages submitted to the website.
- Sent messages show the administrator, selected recipients, channel, status, and message body.
- Compose supports selecting multiple registered users and choosing `email` or `phone`.

Email and phone delivery are stored as queued records only. Provider integration can be added later without changing the admin workflow.

## Project images

No project image files are included in this repository.

Place your existing frontend files in:

```text
frontend/src/static/images/
```

For legacy Nezarat/Ejra image references, the project form can store filenames such as:

```text
project-01.jpg
project-02.webp
```

The database stores them as `/images/<filename>`, and Vite/Nginx serves them from the frontend. Tarahi covers and subgroup images are uploaded directly in the admin, stored in the persistent backend media volume, and exposed as `/media/...`.

## Public project API

```text
GET /api/v1/tarahi/projects
GET /api/v1/tarahi/projects/{slug}

GET /api/v1/nezarat/regions
GET /api/v1/nezarat/projects
GET /api/v1/nezarat/projects/{slug}
GET /api/v1/nezarat/table

GET /api/v1/ejra/projects
GET /api/v1/ejra/projects/{slug}
```

The Tarahi, Nezarat, and Ejra frontend pages use these endpoints for project text, metadata, project sections/regions, table rows, covers, and albums. There are no hardcoded project catalogs.

## Database schema

- `tarahi_projects`
- `tarahi_project_sections`
- `tarahi_project_images`
- `nezarat_regions`
- `nezarat_projects`
- `nezarat_project_images`
- `nezarat_table_rows`
- `ejra_projects`
- `ejra_project_images`
- `users`
- `contact_messages`
- `outbound_messages`
- `outbound_message_recipients`

Alembic is the only schema authority. The migrations also handle databases created by the earlier conflicting development build without requiring the PostgreSQL volume to be deleted.

If an existing installation reports that `tarahi_project_images.section_id` does not exist, run this once from the project root:

```bash
docker compose exec backend alembic upgrade head
```

## Production on Linux

```bash
cp .env.production.example .env
make deploy
```

`make deploy` is the production deployment entry point. It starts PostgreSQL, creates and verifies a complete pre-deployment backup, and only then builds and replaces the application containers. Use this command instead of running `docker compose build` or `docker compose up --build` directly.

Production includes migrations, Gunicorn/Uvicorn workers, Nginx, PostgreSQL and media volumes, health checks, restart policies, and an automated backup container.

If the server uses a host-level Nginx for TLS, it owns public ports 80 and 443. The frontend container is intentionally published only on `127.0.0.1:8080` (`FRONTEND_PORT`), so configure the host virtual host with `proxy_pass http://127.0.0.1:8080;`. Do not publish the frontend container on host port 80, as that prevents it from starting and results in a 502 response.

Use HTTPS, strong secrets, restricted database networking, and off-server backup copies in production.

## Backup and restore

### Quick guide

Run these commands from the project directory on the Linux website server:

```bash
# Deploy safely: backup first, then build and restart the website
make deploy

# Create an extra backup manually
make backup

# View automatic backup activity
docker compose -f docker-compose.prod.yml logs -f backup

# List available backups
ls -lah backups/daily backups/weekly

# Restore one snapshot (the script asks you to type RESTORE)
sh ./scripts/restore.sh backups/daily/TIMESTAMP
```

Always use `make deploy` for production updates. Running `docker compose build` or `docker compose up --build` directly bypasses the required pre-deployment backup. Automatic backups run every 24 hours after the production stack starts.

### Verify a backup

Check that the automatic backup service is running and review its latest activity:

```bash
docker compose -f docker-compose.prod.yml ps backup
docker compose -f docker-compose.prod.yml logs --tail=20 backup
```

Validate the checksums, PostgreSQL dump, media archive, and project archive without changing production data:

```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps \
  --entrypoint sh backup -eu -c '
    cd /backups/daily/latest
    sha256sum -c SHA256SUMS
    pg_restore --list database.dump >/dev/null
    tar -tzf media.tar.gz >/dev/null
    tar -tzf project.tar.gz >/dev/null
    echo "Latest backup is readable and valid."
  '
```

Every checksum should report `OK`, followed by `Latest backup is readable and valid.` To create and inspect a fresh snapshot first, run:

```bash
make backup
ls -lah backups/daily/
```

These checks prove that the backup files are complete and readable. Periodically perform a full restore on a separate test server as the final recovery test. Never test restoration against the live website because it replaces the production database and uploaded media.

Every snapshot contains:

- a PostgreSQL custom-format dump;
- all uploaded media from the persistent Docker volume;
- the project source and `.env` deployment configuration;
- metadata and SHA-256 checksums verified before every restore.

Snapshots are written to the host's `backups/` directory. Daily snapshots are kept for 14 days by default. Every Sunday (UTC), the current snapshot is also retained as a weekly snapshot for 8 weeks. Configure this in `.env` with `DAILY_RETENTION_DAYS`, `WEEKLY_RETENTION_WEEKS`, `BACKUP_WEEKLY_DAY` (`0` is Sunday), and `BACKUP_INTERVAL_SECONDS`.

The production `backup` service runs automatically. Create an additional snapshot at any time with:

```bash
make backup
```

Snapshots appear under:

```text
backups/
  daily/TIMESTAMP/
  weekly/TIMESTAMP/
```

To restore the database and uploaded media on an existing installation:

```bash
sh ./scripts/restore.sh backups/daily/TIMESTAMP
```

The restore verifies every file, asks for explicit confirmation, stops application writers and the backup process, recreates the database, restores media, runs migrations, and restarts the website.

For complete recovery after losing the website server, copy a snapshot to the replacement server and restore the source into an empty directory first:

```bash
sh ./scripts/restore-project.sh /path/to/snapshot /srv/meta-holding
cd /srv/meta-holding
docker compose -f docker-compose.prod.yml build backup backend frontend
docker compose -f docker-compose.prod.yml up -d --wait postgres
RESTORE_CONFIRM=yes sh ./scripts/restore.sh /path/to/snapshot
```

The project archive includes `.env`, so the backup directory contains secrets. Restrict filesystem and SSH access to it. When the local backup server is configured, copy the complete `daily/` and `weekly/` directories, including `SHA256SUMS`.

Test restoration periodically on a separate server. A backup is not proven until a restore has succeeded.

## Validation

```bash
./scripts/test.sh
```

## Nezarat Excel table

In the admin panel, open **Projects → Nezarat** and upload an `.xlsx` or `.xlsm` file in **جدول اکسل پروژه‌های نظارت**. The first non-empty row of every non-empty sheet is used as the table header. Each visible sheet is rendered as a separate tab on the public Nezarat page; hidden helper sheets and sheets named `Table` are ignored. Uploading another workbook replaces the currently published table.
