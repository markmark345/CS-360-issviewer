FROM nikolaik/python-nodejs:latest

#RUN apt-get update
#RUN apt-get -y install redis-server

RUN mkdir /home/pn/app
RUN mkdir /home/pn/app/issviewer-master

WORKDIR /home/pn/app/issviewer-master


#WORKDIR /issviewer-master
COPY package.json /home/pn/app/issviewer-master

RUN npm install

COPY . /home/pn/app/issviewer-master

RUN npm run build

RUN pip install ephem
#RUN node --version

EXPOSE 6379
EXPOSE 3000


USER pn
#RUN nohup redis-server &> redis.log & nohup node app.js
#RUN node app.js
CMD ["node", "app.js"]