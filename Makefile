.PHONY: build test lint up down logs clean install all

install:
	$(MAKE) -C backend install

build:
	$(MAKE) -C backend build

test:
	$(MAKE) -C backend test

lint:
	$(MAKE) -C backend lint

up:
	$(MAKE) -C backend up

all: up
	cd frontend && npm run dev

down:
	$(MAKE) -C backend down

logs:
	$(MAKE) -C backend logs

clean:
	$(MAKE) -C backend clean

