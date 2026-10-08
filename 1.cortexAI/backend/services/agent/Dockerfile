FROM node:22
WORKDIR /app
COPY 1.cortexAI/backend/services/agent/package*.json ./
RUN npm install
COPY 1.cortexAI/backend/services/agent/ ./
COPY 1.cortexAI/backend/shared/ /shared/
RUN rm -rf /shared/node_modules && ln -s /app/node_modules /shared/node_modules
EXPOSE 8003
CMD ["npm", "start"]
