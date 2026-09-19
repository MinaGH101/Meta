.PHONY: dev down logs test validate backup deploy prod

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
	sh ./scripts/test.sh

backup:
	sh ./scripts/backup.sh

deploy:
	sh ./scripts/deploy.sh

prod: deploy
