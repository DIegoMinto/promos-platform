# Promos Platform

## Tecnologías

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma

### Base de datos

- PostgreSQL
- Docker

### Herramientas

- Git
- GitHub
- Docker Compose

# Requisitos

Antes de instalar el proyecto se deben tener instaladas las siguientes herramientas:

### 1. Node.js

Se requiere Node.js para ejecutar el frontend y backend.

Se recomienda utilizar una versión LTS reciente de Node.js.

Para comprobar la instalación:

```bash
node -v
npm -v
```

### 2. Docker Desktop

Se utiliza Docker para ejecutar PostgreSQL de forma local, sin necesidad de instalar PostgreSQL directamente en el sistema operativo.

Comprobar la instalación:

```bash
docker --version
docker compose version
```

Además, **Docker Desktop debe estar ejecutándose** antes de iniciar la base de datos.

### 3. Git

Se utiliza Git para descargar el proyecto desde GitHub.

Comprobar la instalación:

```bash
git --version
```

# Instalación

## 1. Clonar el proyecto

Abrir una terminal y ejecutar:

```bash
git clone https://github.com/DIegoMinto/promos-platform.git
cd promos-platform
```

## 2. Configurar el Backend

Ingresar a la carpeta del backend:

```bash
cd backend
```

Instalar las dependencias:

```bash
npm install
```

## 3. Configurar las variables de entorno

Dentro de la carpeta `backend` existe un archivo:

```text
.env.example
```

Crear una copia llamada:

```text
.env
```

En Windows PowerShell se puede ejecutar:

```powershell
Copy-Item .env.example .env
```

El archivo `.env` debe contener las variables necesarias para conectar el backend con PostgreSQL y configurar JWT.

Ejemplo:

```env
DATABASE_URL="postgresql://promos_user:promos_password@localhost:5432/promos_db"

JWT_SECRET="CAMBIAR_ESTE_SECRETO"

PORT=3000
```

> **Importante:** El archivo `.env` contiene configuraciones locales y no debe subirse al repositorio de GitHub.

## 4. Iniciar PostgreSQL

Desde la carpeta `backend`, ejecutar:

```bash
docker compose up -d
```

Esto creará e iniciará el contenedor de PostgreSQL utilizado por la aplicación.

Para comprobar que el contenedor está funcionando:

```bash
docker ps
```

Debe aparecer el contenedor:

```text
promos-postgres
```

## 5. Generar Prisma Client

Después de instalar las dependencias y configurar el archivo `.env`, ejecutar:

```bash
npx prisma generate
```

Este comando genera el cliente de Prisma utilizado por el backend para comunicarse con PostgreSQL.

## 6. Aplicar las migraciones de la base de datos

Ejecutar:

```bash
npx prisma migrate deploy
```

Esto crea y actualiza las tablas necesarias en PostgreSQL de acuerdo con las migraciones incluidas en el proyecto.

# Ejecutar el Backend

Desde:

```text
promos-platform/backend
```

ejecutar:

```bash
npm run start:dev
```

Si todo está funcionando correctamente, aparecerá un mensaje similar a:

```text
Nest application successfully started
```

El backend estará disponible en:

```text
http://localhost:3000
```

# Ejecutar el Frontend

Abrir **otra terminal** sin cerrar la terminal donde está ejecutándose el backend.

Ingresar a la carpeta del frontend:

```bash
cd frontend
```

Si todavía no se instalaron las dependencias:

```bash
npm install
```

Luego iniciar el servidor:

```bash
npm run dev
```

El frontend estará disponible en:

```text
http://localhost:5173
```

Abrir esa dirección en el navegador.

# Orden completo de instalación

Para facilitar la instalación, el procedimiento completo es:

```text
1. Instalar Node.js
        ↓
2. Instalar Docker Desktop
        ↓
3. Instalar Git
        ↓
4. Clonar el proyecto
        ↓
5. Entrar a backend
        ↓
6. npm install
        ↓
7. Crear .env desde .env.example
        ↓
8. docker compose up -d
        ↓
9. npx prisma generate
        ↓
10. npx prisma migrate deploy
        ↓
11. npm run start:dev
        ↓
12. Abrir otra terminal
        ↓
13. Entrar a frontend
        ↓
14. npm install
        ↓
15. npm run dev
```

# Direcciones del proyecto

Una vez iniciados ambos servidores:

| Componente    | Dirección                           |
| ------------- | ----------------------------------- |
| Frontend      | http://localhost:5173               |
| Backend       | http://localhost:3000               |
| API Health    | http://localhost:3000/api/health    |
| API Health DB | http://localhost:3000/api/health/db |

# Base de datos

La aplicación utiliza PostgreSQL ejecutado mediante Docker.

Configuración utilizada:

```text
Motor: PostgreSQL
Base de datos: promos_db
Usuario: promos_user
Puerto: 5432
Contenedor: promos-postgres
```

Los datos de PostgreSQL se almacenan en un volumen Docker para conservar la información aunque el contenedor sea detenido.

Para detener PostgreSQL:

```bash
docker compose down
```

Para volver a iniciarlo:

```bash
docker compose up -d
```

> No utilizar `docker compose down -v` si se desea conservar los datos almacenados en la base de datos.

# Estructura del proyecto

```text
promos-platform/
│
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── .gitignore
├── README.md
└── ...
```

# Desarrollo

Durante el desarrollo se deben mantener funcionando:

**Terminal 1 — Backend**

```bash
cd backend
npm run start:dev
```

**Terminal 2 — Frontend**

```bash
cd frontend
npm run dev
```

**Docker Desktop**

Debe permanecer ejecutándose para que PostgreSQL esté disponible.

# Notas importantes

- No eliminar la carpeta `backend/prisma/migrations`.
- No subir archivos `.env` a GitHub.
- No compartir secretos utilizados para JWT.
- Docker Desktop debe estar ejecutándose antes de iniciar PostgreSQL.
- Si se descarga nuevamente el proyecto desde GitHub, se deben instalar nuevamente las dependencias con `npm install`.
- Si Prisma presenta errores relacionados con el cliente generado, ejecutar:

```bash
npx prisma generate
```

- Si el backend no puede conectarse a PostgreSQL, verificar primero que Docker Desktop esté ejecutándose y que el contenedor `promos-postgres` esté activo.

# Estado del proyecto

Versión inicial de desarrollo.

Actualmente incluye:

- Registro de usuarios
- Inicio de sesión
- Autenticación mediante JWT
- Gestión de usuarios
- Roles de usuario
- PostgreSQL
- Prisma ORM
- API REST
- Frontend React
- Interfaz inicial de la plataforma

El proyecto se encuentra preparado para continuar con el desarrollo de los módulos de negocios, categorías y promociones.
