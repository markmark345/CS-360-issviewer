FROM nikolaik/python-nodejs:latest

RUN wget http://download.redis.io/redis-stable.tar.gz && \
    tar xvzf redis-stable.tar.gz && \
    cd redis-stable && \
    make && \
    mv src/redis-server /usr/bin/ && \
    cd .. && \
    rm -r redis-stable && \
    npm install -g concurrently   

EXPOSE 6379

RUN mkdir /home/pn/app
RUN mkdir /home/pn/app/issviewer-master

WORKDIR /home/pn/app/issviewer-master

COPY package.json /home/pn/app/issviewer-master

RUN npm install

COPY . /home/pn/app/issviewer-master

RUN npm run build

RUN pip install ephem

EXPOSE 6379
EXPOSE 3000


USER pn
#RUN nohup redis-server &> redis.log & nohup node app.js
#RUN node app.js
# CMD ["node", "app.js"]
CMD concurrently "/usr/bin/redis-server --bind '0.0.0.0'" "sleep 5s; node app.js" 