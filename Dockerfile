FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/temp/uploads

RUN npx prisma generate
RUN npx prisma migrate deploy

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"] 