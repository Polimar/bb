# 🧠 BrainBrawler 2.0 - Cursor Implementation Prompt (Docker Edition)

## 🎯 MISSION STATEMENT
Implementa BrainBrawler: ecosistema mobile-first quiz platform con architettura P2P distribuita. Web repository per gestione contenuti + App mobile nativa per gameplay. Modello freemium $4.99 premium.

### 🏗️ ARCHITETTURA P2P DISTRIBUITA
- **Mobile App Completa**: Ogni dispositivo ha TUTTE le features (server + client)
- **Feature Activation**: Premium unlock o emergency failover automatico
- **Server Election**: Algoritmo fault-tolerance per elezione nuovo host
- **Messaging**: Redis Streams + WebRTC per coordinazione P2P
- **Question Sets**: Formato JSON collaudato per caricamento bulk

---

##  Prerequisites
- Docker
- Docker Compose

---

## 📋 IMPLEMENTATION SEQUENCE

### PHASE 1: PROJECT & DOCKER FOUNDATION

#### STEP 1: Create Project Structure
```bash
mkdir brainbrawler
cd brainbrawler
mkdir -p web-repository/{frontend,backend} mobile-app/BrainBrawlerMobile shared-types docs
```

#### STEP 2: Create Docker Compose Configuration
Create `docker-compose.yml` in the project root (`brainbrawler/`):
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: brainbrawler_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: brainbrawler
      POSTGRES_PASSWORD: password
      POSTGRES_DB: brainbrawler
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - brainbrawler_net

  redis:
    image: redis:alpine
    container_name: brainbrawler_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    networks:
      - brainbrawler_net

  backend:
    build:
      context: ./web-repository/backend
      dockerfile: Dockerfile
    container_name: brainbrawler_backend
    restart: unless-stopped
    depends_on:
      - db
      - redis
    ports:
      - "3000:3000"
    volumes:
      - ./web-repository/backend:/app
      - /app/node_modules # Isolate node_modules
    env_file:
      - ./web-repository/backend/.env
    networks:
      - brainbrawler_net

  frontend:
    build:
      context: ./web-repository/frontend
      dockerfile: Dockerfile
    container_name: brainbrawler_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "3001:3001"
    volumes:
      - ./web-repository/frontend:/app
      - /app/node_modules # Isolate node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true # For hot-reloading in Docker
      - REACT_APP_API_BASE=http://localhost:3000/api
    networks:
      - brainbrawler_net
      
  android-builder:
    image: reactnativecommunity/react-native-android
    container_name: brainbrawler_android_builder
    restart: "no"
    volumes:
      - ./mobile-app/BrainBrawlerMobile:/home/node/project
    working_dir: /home/node/project
    command: tail -f /dev/null # Keeps container running for exec

networks:
  brainbrawler_net:
    driver: bridge

volumes:
  postgres_data:
```

#### STEP 3: Create Dockerfiles

Create `web-repository/backend/Dockerfile`:
```dockerfile
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

# Il comando di avvio verrà gestito da docker-compose
CMD ["npm", "run", "dev"]
```

Create `web-repository/frontend/Dockerfile`:
```dockerfile
# Usa un'immagine Node.js come base
FROM node:18-alpine

# Imposta la directory di lavoro nel container
WORKDIR /app

# Copia i file di dipendenze
COPY package*.json ./

# Installa le dipendenze
RUN npm install --legacy-peer-deps

# Copia il resto dei file dell'applicazione
COPY . .

# Esponi la porta per il server di sviluppo di React
EXPOSE 3001

# Il comando di avvio verrà gestito da docker-compose
CMD ["npm", "start"]
```

### PHASE 2: BACKEND APPLICATION SETUP

#### STEP 4: Configure Backend Project
Ensure `web-repository/backend/package.json` contains the necessary dependencies and scripts. The `docker-compose build` command will handle the installation.
```json
{
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "helmet": "^6.0.1",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.0",
    "prisma": "^4.11.0",
    "@prisma/client": "^4.11.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.2",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/ioredis": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.1",
    "@types/node": "^18.15.11",
    "nodemon": "^2.0.22",
    "ts-node": "^10.9.1",
    "typescript": "^5.0.3"
  },
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio"
  }
}
```
Ensure `web-repository/backend/tsconfig.json` is configured:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### STEP 5: Environment and Database
Create `web-repository/backend/.env` **manually**. This file is critical and should not be committed to git.
```env
DATABASE_URL="postgresql://brainbrawler:password@db:5432/brainbrawler"
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
REDIS_URL="redis://redis:6379"
PORT=3000
NODE_ENV=development
```

Create `web-repository/backend/prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid())
  username       String    @unique
  email          String    @unique
  passwordHash   String    @map("password_hash")
  accountType    AccountType @default(FREE) @map("account_type")
  emailVerified  Boolean   @default(false) @map("email_verified")
  level          Int       @default(1)
  xp             Int       @default(0)
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  questionSets   QuestionSet[]
  musicTracks    MusicTrack[]
  friendRequests Friendship[] @relation("Requester")
  friendAddresses Friendship[] @relation("Addressee")
  hostedGames    Game[]
  gameParticipations GamePlayer[]
  stats          UserStats?

  @@map("users")
}

enum AccountType {
  FREE
  PREMIUM
  ADMIN
}

model QuestionSet {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  name            String
  description     String?
  language        Language
  category        String
  totalQuestions  Int       @default(0) @map("total_questions")
  isPublic        Boolean   @default(false) @map("is_public")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  questions       Question[]
  games           Game[]

  @@map("question_sets")
}

enum Language {
  IT
  EN
  ES
  DE
  FR
}

model Question {
  id              String      @id @default(uuid())
  questionSetId   String      @map("question_set_id")
  text            String
  options         Json        // ["Option A", "Option B", "Option C", "Option D"]
  correctAnswer   Int         @map("correct_answer") // 0-3 index
  difficulty      Difficulty  @default(MEDIUM)
  explanation     String?
  createdAt       DateTime    @default(now()) @map("created_at")

  questionSet     QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)

  @@map("questions")
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

model MusicTrack {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  title     String
  fileUrl   String   @map("file_url")
  fileSize  Int      @map("file_size")
  duration  Int?     // in seconds
  mood      String?  // 'energetic', 'calm', 'intense', etc.
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("music_tracks")
}

model Friendship {
  id           String           @id @default(uuid())
  requesterId  String           @map("requester_id")
  addresseeId  String           @map("addressee_id")
  status       FriendshipStatus @default(PENDING)
  createdAt    DateTime         @default(now()) @map("created_at")
  updatedAt    DateTime         @updatedAt @map("updated_at")

  requester    User             @relation("Requester", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee    User             @relation("Addressee", fields: [addresseeId], references: [id], onDelete: Cascade)

  @@unique([requesterId, addresseeId])
  @@map("friendships")
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

model Game {
  id               String      @id @default(uuid())
  hostId           String      @map("host_id")
  questionSetId    String?     @map("question_set_id")
  name             String
  language         Language
  maxPlayers       Int         @default(8) @map("max_players")
  questionCount    Int         @default(10) @map("question_count")
  timePerQuestion  Int         @default(15) @map("time_per_question") // seconds
  isPrivate        Boolean     @default(false) @map("is_private")
  passwordHash     String?     @map("password_hash")
  status           GameStatus  @default(WAITING)
  startedAt        DateTime?   @map("started_at")
  completedAt      DateTime?   @map("completed_at")
  createdAt        DateTime    @default(now()) @map("created_at")

  host             User        @relation(fields: [hostId], references: [id], onDelete: Cascade)
  questionSet      QuestionSet? @relation(fields: [questionSetId], references: [id])
  players          GamePlayer[]

  @@map("games")
}

enum GameStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
}

model GamePlayer {
  id            String   @id @default(uuid())
  gameId        String   @map("game_id")
  userId        String   @map("user_id")
  finalScore    Int      @default(0) @map("final_score")
  finalPosition Int?     @map("final_position")
  answers       Json?    // Array of answer objects
  joinedAt      DateTime @default(now()) @map("joined_at")

  game          Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([gameId, userId])
  @@map("game_players")
}

model UserStats {
  id                    String   @id @default(uuid())
  userId                String   @unique @map("user_id")
  totalGames            Int      @default(0) @map("total_games")
  totalWins             Int      @default(0) @map("total_wins")
  totalScore            Int      @default(0) @map("total_score")
  averageAccuracy       Decimal  @default(0.00) @map("average_accuracy") @db.Decimal(5,2)
  averageResponseTime   Decimal  @default(0.00) @map("average_response_time") @db.Decimal(8,2)
  updatedAt             DateTime @updatedAt @map("updated_at")

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_stats")
}
```

#### STEP 6: Backend Core Structure
(The content for `server.ts`, `middleware/auth.ts`, `routes/auth.ts`, etc., remains the same as the original prompt. The key is they run inside the container now).

### PHASE 3: FRONTEND APPLICATION SETUP

#### STEP 7: Configure Frontend Project
Ensure `web-repository/frontend/package.json` is set up for a React/TypeScript project. `docker-compose build` will install dependencies. `tailwind.config.js`, `postcss.config.js`, and `src/index.css` should be configured as per the original prompt.

#### STEP 8: React App Structure
(The content for `src/types/index.ts`, `src/services/api.ts`, `src/App.tsx`, etc., remains the same. `REACT_APP_API_BASE` in `api.ts` will now be picked from the `docker-compose.yml` environment variable.)

### PHASE 4: MOBILE APP SETUP

#### STEP 9: Mobile Project Setup
The `android-builder` service is prepared for development. The source code from `mobile-app/BrainBrawlerMobile` is mounted into the container. To work on the mobile app:
1.  Enter the container: `docker-compose exec android-builder bash`
2.  Run commands like `npm install`, `npm run android`, etc., from within the container's shell.

---

## 🔥 EXECUTION COMMANDS (DOCKER WORKFLOW)

### First-Time Setup:
1.  **Build all images:**
    ```bash
    docker-compose build
    ```
2.  **Start all services in the background:**
    ```bash
    docker-compose up -d
    ```
3.  **Run database migration:**
    ```bash
    docker-compose exec backend npm run db:push
    ```
    *If you get a connection error, wait a few seconds for the DB to initialize and try again.*
4.  **Verify services are running:**
    -   Backend: [http://localhost:3000/health](http://localhost:3000/health)
    -   Frontend: [http://localhost:3001](http://localhost:3001)
    -   Prisma Studio (optional): `docker-compose exec backend npm run db:studio`

### Daily Development:
-   **Start services:** `docker-compose up -d`
-   **Stop services:** `docker-compose down`
-   **View logs:** `docker-compose logs -f` or `docker-compose logs -f <service_name>` (e.g., `backend`)
-   **Run a command in a container:** `docker-compose exec <service_name> <command>` (e.g., `docker-compose exec backend npm install some-package`)

### Mobile Development (Android):
1.  **Enter the builder container:**
    ```bash
    docker-compose exec android-builder bash
    ```
2.  **Inside the container, run React Native commands:**
    ```bash
    # e.g., to run the packager
    npm start
    
    # e.g., to build a debug APK
    npm run android
    ```
*Note: For this to work, you need a physical Android device connected via USB with debugging enabled, or a properly configured emulator on the host machine that can connect to the Docker network. This setup is advanced.*

---

## ✅ COMPLETION CHECKLIST

**Phase 1 Foundation:**
- [ ] Project structure created
- [ ] Backend with Express + TypeScript setup
- [ ] Prisma database schema implemented
- [ ] Authentication system working
- [ ] React frontend with routing
- [ ] React Native app with navigation
- [ ] API endpoints for auth working
- [ ] Database connected and migrations run
- [ ] JSON question sets format implemented
- [ ] Bulk upload endpoint working
- [ ] P2P game engine classes created
- [ ] Server election algorithm implemented
- [ ] Redis Streams coordination setup
- [ ] WebRTC P2P foundation ready
- [ ] Feature activation logic implemented

**P2P Architecture Validation:**
1. Mobile app contains ALL features (server + client)
2. Server election algorithm works correctly
3. Emergency mode activates for FREE users
4. Redis Streams messaging functional
5. WebRTC peer connections establish
6. Question distribution system ready
7. JSON format validation working

**Validation Steps:**
1. Backend server starts on port 3000
2. Frontend loads on port 3001
3. User registration/login works via API
4. Mobile app compiles and runs
5. Database schema matches requirements
6. All TypeScript compiles without errors
7. Question sets JSON upload works
8. P2P classes instantiate without errors
9. Redis connection established
10. Emergency promotion logic triggers

**Next Phase Ready When:**
- Auth flow works end-to-end
- Database queries successful
- Mobile app connects to backend API
- P2P foundation architecture complete
- JSON question sets uploadable
- Server election deterministic
- No compilation or runtime errors

---

## 🎯 P2P ARCHITECTURE CRITICAL CONCEPTS

### 🚨 EVERY MOBILE DEVICE = COMPLETE SYSTEM
- **ALL Features Installed**: Server + Client capabilities on every device
- **Activation Logic**: Premium enables creation, Emergency enables hosting
- **No Degraded Modes**: FREE users have full functionality (just locked)

### 🔄 Server Election Priority
1. **PREMIUM/ADMIN** - Can always host (primary servers)
2. **Connection Stability** - Most reliable network wins
3. **Battery Level** - Device with more power hosts
4. **Deterministic Fallback** - Alphabetical ID prevents conflicts

### 📡 Messaging Architecture
- **Redis Streams** - Coordination and signaling
- **WebRTC Data Channels** - Direct P2P game data
- **Heartbeat Monitoring** - 5-second timeout detection
- **Emergency Promotion** - Automatic failover activation

### 🎮 Game Flow Distribution
- **Host Downloads Questions** - From selected question set
- **Real-time Distribution** - Questions sent to clients on-demand
- **Answer Collection** - Responses gathered via P2P
- **Score Calculation** - Host manages all game state
- **Results Upload** - Final data synced to web repository

### 🆘 Emergency Mode Logic
```
Host Disconnects → Detection (5s timeout) → Election Algorithm → 
Emergency Promotion → FREE User Becomes Host → Game Continues
```

---

## 🚨 CRITICAL REQUIREMENTS

1. **USE TYPESCRIPT EVERYWHERE** - No JavaScript files
2. **ERROR HANDLING** - Try/catch all async operations
3. **VALIDATION** - Validate all inputs client and server side
4. **SECURITY** - JWT tokens, password hashing, input sanitization
5. **MOBILE-FIRST** - React Native optimized, not mobile web
6. **P2P ARCHITECTURE** - Every device has ALL features (server + client)
7. **PREMIUM GATING** - Features locked but not removed from codebase
8. **EMERGENCY ACTIVATION** - FREE users can become hosts in failover
9. **JSON QUESTION FORMAT** - Use exact format specified for uploads
10. **REDIS STREAMS** - Message coordination for P2P signaling
11. **WEBRTC DATA CHANNELS** - Direct peer communication for gameplay
12. **SERVER ELECTION** - Deterministic algorithm for host selection

**P2P IMPLEMENTATION MUSTS:**
- Mobile app contains COMPLETE functionality on every device
- Server/Client roles are runtime activation, not compile-time
- Emergency mode overrides account type restrictions
- Question distribution happens real-time (not pre-loaded)
- Host manages ALL game state and score calculations
- Failover must be transparent to players

**STOP AND ASK IF:**
- Any step fails or errors occur
- Unclear on P2P implementation details
- Need clarification on server election logic
- Emergency activation not working correctly
- Ready to proceed to next phase

IMPLEMENT EXACTLY AS SPECIFIED ALWAYS IN THINKING MODE. NO SHORTCUTS. NO ASSUMPTIONS. 