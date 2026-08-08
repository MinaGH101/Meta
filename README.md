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
- Admin login: `http://localhost:8000/admin/`
- API documentation: `http://localhost:8000/docs`
- Readiness check: `http://localhost:8000/health/ready`

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
docker compose -f docker-compose.prod.yml up -d --build
```

Production includes migrations, Gunicorn/Uvicorn workers, Nginx, PostgreSQL and media volumes, health checks, restart policies, and an automated backup container.

Use HTTPS, strong secrets, restricted database networking, and off-server backup copies in production.

## Backup and restore

```bash
./scripts/backup.sh
./scripts/restore.sh backups/meta_TIMESTAMP.dump backups/media_TIMESTAMP.tar.gz
```

Test restoration on a separate database before production deployment.

## Validation

```bash
./scripts/test.sh
```

## Nezarat Excel table

In the admin panel, open **Projects → Nezarat** and upload an `.xlsx` or `.xlsm` file in **جدول اکسل پروژه‌های نظارت**. The first non-empty row of every non-empty sheet is used as the table header. Each visible sheet is rendered as a separate tab on the public Nezarat page; hidden helper sheets and sheets named `Table` are ignored. Uploading another workbook replaces the currently published table.
