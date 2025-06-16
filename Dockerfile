FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install -g nodemon && npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
