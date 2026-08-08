.PHONY: dev down logs test validate backup prod

dev:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

validate:
	docker compose config --quiet
	docker compose --env-file .env.production.example -f docker-compose.prod.yml config --quiet

test:
	./scripts/test.sh

backup:
	./scripts/backup.sh

prod:
	docker compose -f docker-compose.prod.yml up -d --build
