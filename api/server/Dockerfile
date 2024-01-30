FROM python:3.8

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Prague

RUN apt-get update && apt-get install -y libxml2 g++ vim coreutils nano git libxrender1 wget fakeroot tzdata locales nginx parallel && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN ln -fs /usr/share/zoneinfo/Europe/Prague /etc/localtime && dpkg-reconfigure --frontend noninteractive tzdata && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen

RUN addgroup --gid 1000 user
RUN adduser --gid 1000 --uid 1000 --disabled-password --gecos user user
WORKDIR /home
RUN chown -R user:user /home
RUN chmod 755 /home

RUN mkdir -p /var/lib/nginx/body /var/lib/nginx/fastcgi /var/lib/nginx/proxy /var/lib/nginx/uwsgi /var/lib/nginx/scgi
RUN chown -R user:user /home /var/lib/nginx
RUN chmod 755 /home /var/lib/nginx
RUN touch /var/log/nginx/access.log /var/log/nginx/error.log
RUN chown -R user:user /var/log/nginx/access.log /var/log/nginx/error.log
RUN chmod 644 /var/log/nginx/access.log /var/log/nginx/error.log
RUN touch /run/nginx.pid && chown -R user:user /run/nginx.pid

COPY requirements.txt /var/requirements.txt
RUN pip install --upgrade pip
RUN pip install torch --index-url https://download.pytorch.org/whl/cu118 && rm -rf ~/.cache
RUN pip install -r /var/requirements.txt
RUN rm -rf ~/.cache

EXPOSE 5000
USER 1000

COPY ./server/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir /home/alphafind
WORKDIR /home/alphafind

COPY . /home/alphafind
COPY ./server/init.sh .
COPY ./server/run_server.py .
COPY ./server/run-worker.py .

CMD [ "/bin/bash", "./init.sh" ]