FROM node:22
WORKDIR /app
COPY 1.cortexAI/backend/gateway/package*.json ./
RUN npm install
COPY 1.cortexAI/backend/gateway/ ./
COPY 1.cortexAI/backend/shared/ /shared/
RUN rm -rf /shared/node_modules && ln -s /app/node_modules /shared/node_modules
EXPOSE 8000
CMD ["npm", "start"]
