.PHONY: build up down logs test lint clean

COMPOSE ?= docker compose -f compose.yaml
PYTHON ?= python3
VENV ?= .venv
VENV_BIN := $(VENV)/bin
PIP := $(VENV_BIN)/pip
PYTEST := $(VENV_BIN)/pytest
RUFF := $(VENV_BIN)/ruff
VENV_MARK := $(VENV)/.installed
DOCKER_OK := $(shell docker info >/dev/null 2>&1 && echo yes || echo no)

$(VENV_BIN)/python:
	$(PYTHON) -m venv $(VENV)

$(VENV_MARK): requirements.txt | $(VENV_BIN)/python
	$(PIP) install -r requirements.txt
	touch $(VENV_MARK)

build:
ifeq ($(DOCKER_OK),yes)
	$(COMPOSE) build
else
	@echo "Docker not available; creating local venv in $(VENV)"
	$(MAKE) $(VENV_MARK)
endif

up:
ifeq ($(DOCKER_OK),yes)
	$(COMPOSE) up -d
else
	@echo "Docker not available; cannot start compose services."
	@exit 2
endif

down:
ifeq ($(DOCKER_OK),yes)
	$(COMPOSE) down
else
	@echo "Docker not available; nothing to stop."
endif

logs:
ifeq ($(DOCKER_OK),yes)
	$(COMPOSE) logs -f --tail=200
else
	@echo "Docker not available; no compose logs."
	@exit 2
endif

test:
ifeq ($(DOCKER_OK),yes)
	$(COMPOSE) run --rm api pytest -q
else
	$(MAKE) $(VENV_MARK)
	MONGO_URI=mongomock://localhost/auntleah PYTHONPATH=src $(PYTEST) -q
endif

lint:
	pip install ruff
	ruff check .
	ruff format --check .

clean:
ifeq ($(DOCKER_OK),yes)
	$(COMPOSE) down -v
else
	rm -rf $(VENV)
endif

