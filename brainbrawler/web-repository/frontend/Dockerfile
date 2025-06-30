# Usa un'immagine Node.js come base
FROM node:18-alpine

# Imposta la directory di lavoro nel container
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto dei file dell'applicazione
COPY . .

# Esponi la porta per il server di sviluppo di React
EXPOSE 3001

# Il comando 'npm start' verrà eseguito da docker-compose
CMD ["npm", "start"] 