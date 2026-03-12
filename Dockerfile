FROM node:20

RUN apt-get update && apt-get install -y \
  xvfb \
  xauth \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libnss3 \
  libxss1 \
  libasound2t64 \
  libx11-xcb1 \
  libdrm2 \
  libgbm1 \
  libxcomposite1 \
  libxrandr2 \
  libxdamage1 \
  libxfixes3 \
  libxrender1 \
  libxcursor1 \
  libxi6 \
  libxtst6 \
  libglib2.0-0 \
  ca-certificates \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx tsc --project tsconfig.main.json
RUN npx tsc --project tsconfig.renderer.json
RUN npm run build

EXPOSE 39143
EXPOSE 39144

CMD ["npm", "run", "dev:headless"]

RUN useradd --create-home --shell /bin/bash appuser
USER appuser
