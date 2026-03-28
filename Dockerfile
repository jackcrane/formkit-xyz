FROM node:20-alpine

WORKDIR /app

# Copy root package files and install
COPY package*.json ./
RUN npm install

# Copy react-email package files and install
COPY react-email/package*.json ./react-email/
RUN cd react-email && npm install

# Copy rest of the app
COPY . .

# Expose port 80
EXPOSE 80

# Start app
CMD ["npm", "start"]