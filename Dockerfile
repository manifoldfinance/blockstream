FROM node:14-buster-slim
ENV NODE_ENV=production

WORKDIR /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm install

COPY tsconfig.json /app/tsconfig.json
COPY source/ /app/source/

ENTRYPOINT [ "node", "--inspect=0.0.0.0", "-r", "ts-node/register", "source/index.ts" ]
