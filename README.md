# Steve Barber Shop — Frontend

Repositorio independiente de la interfaz React, TypeScript, Vite y Tailwind. No contiene base de datos ni claves. La API se consume mediante rutas `/api` del mismo dominio.

## Desarrollo

```sh
npm ci
npm run dev
```

Vite envía `/api` al backend local en `http://127.0.0.1:3000`. Inicia el backend por separado. Producción: `npm run build` genera `dist/`. `npm run typecheck` comprueba TypeScript.

## Docker

```sh
docker build -t steve-barber-shop-frontend .
```

El Dockerfile compila con Node 24 y sirve los archivos con Nginx en el puerto 8080. Nginx envía `/api` a `backend:3000`; ambos contenedores deben compartir una red Docker con ese nombre para el backend.

## Hostinger VPS y dominio

Clona ambos repositorios como carpetas hermanas llamadas `frontend` y `backend`:

```sh
git clone https://github.com/josuedapaco/steve-barber-shop-frontend.git frontend
git clone https://github.com/josuedapaco/steve-barber-shop-backend.git backend
cp backend/.env.example backend/.env
# Edita backend/.env: STAFF_PIN privado de al menos 12 caracteres y códigos de los barberos.
cd frontend
docker compose up -d --build
```

El archivo `compose.yaml` construye ambos servicios. SQLite queda en el volumen `barber_data`; Caddy mantiene sus certificados en volúmenes separados. No ejecutes `docker compose down -v` si quieres conservar esos datos.

Antes de arrancar en el VPS:

- Apunta el registro A de `stevesbarbershopny.com` a la IP del VPS. Configura `www` hacia el dominio principal; elimina un AAAA antiguo solo si no corresponde a tu servidor.
- Los puertos 80 y 443 deben estar disponibles y accesibles. Si ya hay otro proxy o más webs en el servidor, integra estas rutas en el proxy existente antes de iniciar Caddy.
- Caddy gestiona HTTPS para `stevesbarbershopny.com` y redirige `www` al dominio principal. El frontend queda en `/` y el backend en `/api`.
- No cambies los registros MX/TXT del correo. Comprueba si el dominio ya sirve otra web antes de reemplazar registros.

Este despliegue Docker requiere un VPS o un servicio que admita contenedores, red interna y volúmenes persistentes. No se ha modificado el DNS ni desplegado en Hostinger.

El acceso de manager es `https://stevesbarbershopny.com/staff`. Las claves se configuran en el backend.
