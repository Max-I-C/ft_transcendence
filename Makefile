PATH_YML := ./srcs/docker-compose.yml
USER := $(shell whoami)
#DATA_DIR := /home/$(USER)/data/mariadb

.PHONY: all up clean fclean re

$(NAME): all

all:
		docker-compose -f $(PATH_YML) up --build

load_frontend: build-nginx up-nginx

up-%:
	docker compose -f srcs/docker-compose.yml up $* -d

build-%:
		docker-compose -f $(PATH_YML) build $*

clean: 
		docker-compose -f $(PATH_YML) down -v

fclean: clean
		docker system prune -af --volumes

re: fclean all
