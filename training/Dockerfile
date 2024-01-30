FROM python:3.8

ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

ENV DEBIAN_FRONTEND=noninteractive 
ENV TZ=Europe/Prague

RUN apt-get update && apt-get install -y libxml2 g++ vim coreutils nano git libxrender1 wget fakeroot tzdata locales && apt-get clean && rm -rf /var/lib/apt/lists/*
RUN ln -fs /usr/share/zoneinfo/Europe/Prague /etc/localtime && dpkg-reconfigure --frontend noninteractive tzdata && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen

COPY requirements.txt /var/requirements.txt
RUN pip install --upgrade pip
RUN pip install torch --index-url https://download.pytorch.org/whl/cu118 && rm -rf ~/.cache
RUN pip install -r /var/requirements.txt && rm -rf ~/.cache

COPY . /training
WORKDIR /training
RUN chmod +x /training/run.sh
CMD [ "/bin/bash", "/training/run.sh" ]