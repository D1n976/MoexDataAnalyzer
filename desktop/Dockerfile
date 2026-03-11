# Используем современную ноду
FROM eclipse-temurin:21-jre

# Устанавливаем минимальный набор зависимостей для работы GUI Electron в Linux
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libnss3 \
    libasound2 \
    libxss1 \
    libatk-bridge2.0-0 \
    libgbm1 \
    libxkbcommon0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем всё остальное
COPY . .

# Флаг --no-sandbox ОБЯЗАТЕЛЕН при запуске от root в Docker
CMD ["npm", "run", "dev", "--", "--no-sandbox"]