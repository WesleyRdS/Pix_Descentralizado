# Usa uma imagem base do Node.js
FROM node:latest

# Diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos necessários
COPY API/package*.json ./API/
COPY API/.env ./API/
COPY API/App.js ./API/
COPY static ./static/
COPY templates ./templates/

# Instala as dependências
RUN npm install --prefix API

# Abre a porta que a aplicação vai escutar
EXPOSE 9985

# Comando para iniciar a aplicação
CMD ["node", "API/App.js"]