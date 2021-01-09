# docker build --tag cratermaik/mychat . && docker run -p 3030:3030 cratermaik/mychat

FROM node:12-alpine

WORKDIR /home/mychat

ENV NODE_ENV="production"

# Dependencias nativas
RUN apk add --no-cache build-base python3

# Copiando lista de dependencias
COPY package.json .
# Instalando dependencias
RUN npm install --only=production

# Liberando espacio
RUN apk add --no-cache curl bash
RUN curl -sfL https://install.goreleaser.com/github.com/tj/node-prune.sh | bash -s -- -b /usr/local/bin
RUN /usr/local/bin/node-prune
RUN apk del curl bash build-base python3 \
    && rm -rf /usr/include \
    && rm -rf /var/cache/apk/* /usr/share/man /tmp/*

# Copiando los archivos de MyChat
COPY . .

# Forzando un puerto
ENV PORT=3030
EXPOSE 3030

# CMD ["node", "."]
CMD ["npm", "start"]