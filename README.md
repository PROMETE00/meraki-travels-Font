# Meraki Travels - Frontend

Este es el frontend moderno e interactivo del sistema de reservas **Meraki Travels**, desarrollado con **Next.js 14/15** y **React 18/19**. 

Ofrece una experiencia de usuario fluida con animaciones inmersivas y una integración directa con el Backend API y NocoDB.

## Tecnologías

- **Next.js** (App Router)
- **React 18/19**
- **Tailwind CSS**
- **GSAP** & **Framer Motion**
- **Three.js** (Galería 3D)
- **Zustand** (Estado global)
- **Prisma** (PostgreSQL)
- **Docker**

## Configuración y Despliegue con Docker

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/meraki-travels-frontend.git
cd meraki-travels-frontend/app-reservas
```

### 2. Variables de entorno
Copia el archivo de ejemplo y edita tus credenciales:
```bash
cp .env.example .env
```
*Asegúrate de configurar `NEXT_PUBLIC_API_URL`, `DATABASE_URL` y las claves de NocoDB.*

### 3. Levantar con Docker
```bash
docker-compose up -d --build
```

- **App:** [http://localhost:3005](http://localhost:3005)

---

## Características UI
- **Buscador de Viajes:** Filtros inteligentes por destino y presupuesto.
- **Galería 3D:** Visualización de destinos en una esfera interactiva.
- **Banners Dinámicos:** Carruseles animados sincronizados con el backend.
- **WhatsApp Widget:** Integración directa para soporte al cliente.

## Contribuciones
¡Bienvenidas! Abre un issue o un PR para mejorar la interfaz.

##Licencia
Este proyecto está bajo la Licencia MIT.
