FROM registry.gitlab.ics.muni.cz:443/alphafind/alphafind-api/alphafind-base:latest

COPY ./server/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir /home/protein-db-dev
WORKDIR /home/protein-db-dev

COPY . /home/protein-db-dev
COPY ./server/init.sh .
COPY ./server/run_server.py .
COPY ./server/run-worker.py .

CMD [ "/bin/bash", "./init.sh" ]