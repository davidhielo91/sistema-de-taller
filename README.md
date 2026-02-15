# 🚀 Sistema de Taller 2.0 - Portal de Cliente sin Contraseñas

Sistema profesional para talleres de reparación con **innovador portal de cliente seguro sin contraseñas**. Permite gestionar órdenes, inventario, y que los clientes aprueben presupuestos desde su celular.

## ✨ Características Principales

### 🔐 Portal de Cliente (Novedad v2.0)
- **Sin contraseñas**: Verificación por teléfono + número de orden
- **Tokens seguros**: JWT con expiración de 24 horas
- **Fotos de evidencia**: Cliente ve las fotos del equipo desde su celular
- **Historial en tiempo real**: Seguimiento completo del estado
- **Aprobación de presupuestos**: Cliente aprueba/rechaza costos extra con 1-click
- **Notificaciones WhatsApp**: Enlace automático al portal del cliente

### 🛠 Gestión Completa
- **Órdenes de servicio**: Crear, editar, cambiar estado, imprimir recibos
- **Inventario de partes**: Control de stock con alertas de bajo inventario
- **Servicios**: Catálogo de servicios con precios y asignación de partes
- **Reportes**: Estadísticas de órdenes, ganancias y costos
- **Respaldos**: Exportación en CSV (Excel) y JSON completo

### 📱 Experiencia Cliente
- **Consulta pública**: Los clientes buscan su orden desde la página principal
- **Verificación segura**: Solo teléfono + número de orden (mínimo 4 dígitos)
- **Galería de fotos**: Documentación visual del equipo
- **Presupuestos interactivos**: Aprobación con comentarios opcionales
- **Estado en vivo**: Barra de progreso visual del servicio

### 🔧 Herramientas Administrativas
- **Firma digital**: Captura de firma al recibir el equipo
- **Notificaciones WhatsApp**: Mensajes automáticos personalizados
- **Personalización**: Logo, colores, horarios, plantillas
- **Multi-dispositivo**: Responsive 100% para móviles y escritorio

## 🚀 Demo Rápido

### Flujo del Portal Cliente
1. Cliente busca su orden en tu web pública
2. Ingresa teléfono (mínimo 4 dígitos) + número de orden
3. Accede a portal personalizado con:
   - Fotos del equipo
   - Historial de estados
   - Presupuesto pendiente (si aplica)
   - Botones de Aprobar/Rechazar
4. Recibe confirmación por WhatsApp

### Flujo del Administrador
1. Crea orden → diagnostica → agrega servicios/costos
2. Haz clic en **"Enviar Presupuesto"**
3. Cliente recibe WhatsApp con enlace al portal
4. Cliente aprueba/rechaza desde su celular
5. Tú ves el resultado en el panel admin

## 📋 Requisitos

- [Node.js](https://nodejs.org) v18 o superior
- Navegador web moderno

## ⚙️ Instalación

1. **Clona el repositorio**:
```bash
git clone https://github.com/davidhielo91/sistema-de-taller.git
cd sistema-de-taller
```

2. **Instala dependencias**:
```bash
npm install
```

3. **Configura variables de entorno** (opcional):
```bash
cp .env.local.example .env.local
```

4. **Inicia en modo desarrollo**:
```bash
npm run dev
```

5. **Abre tu navegador** en **http://localhost:3000**

## 🔑 Acceso

### Panel de Administración
- **URL**: `http://localhost:3000/admin`
- **Contraseña por defecto**: `admin123`

Para cambiar la contraseña, edita `.env.local`:
```env
ADMIN_PASSWORD=tu_nueva_contraseña
CLIENT_TOKEN_SECRET=secreto-para-tokens-clientes
```

### Portal de Cliente
- **URL**: `http://localhost:3000/orden/[NUMERO_ORDEN]`
- **Acceso**: Teléfono + número de orden (verificación automática)

## 🎯 Personalización

Ve a **Admin → Configuración** para personalizar:

- Nombre del negocio y logo
- Teléfono, email, dirección
- Número de WhatsApp
- Horario de atención
- Color de marca
- Plantillas de mensajes WhatsApp
- Umbral de stock bajo
- Moneda y país

## 📊 Reportes y Respaldos

En **Admin → Configuración → Respaldo de Información**:

- **CSV**: Exporta órdenes para Excel
- **JSON**: Backup completo (órdenes + configuración + inventario)

## 🏗️ Arquitectura Técnica

### Stack
- **Frontend**: Next.js 14 App Router + TypeScript
- **Estilos**: TailwindCSS
- **Base de datos**: JSON local (file-based)
- **Autenticación**: Tokens JWT con HMAC-SHA256
- **Deployment**: Docker con `output: standalone`

### Seguridad
- **Tokens cliente**: Expiran en 24 horas
- **Verificación telefónica**: Mínimo 4 dígitos + match por sufijo
- **Middleware**: Rutas protegidas por roles
- **Sin datos sensibles**: Portal no expone notas internas ni costos de piezas

### Estructura
```
├── src/
│   ├── app/
│   │   ├── admin/           # Panel administrativo
│   │   ├── api/             # Rutas API
│   │   ├── orden/           # Portal cliente
│   │   └── page.tsx         # Página pública
│   ├── components/          # Componentes UI
│   ├── lib/                # Lógica de negocio
│   └── types/              # Tipos TypeScript
├── data/                   # Datos locales (no sube a Git)
├── Dockerfile             # Configuración Docker
└── next.config.js         # Configuración Next.js
```

## 🐳 Docker Deployment

```bash
# Construir imagen
docker build -t sistema-taller .

# Correr contenedor
docker run -p 3000:3000 -v $(pwd)/data:/app/data sistema-taller
```

## 🌟 Novedades v2.0

- ✨ **Portal de cliente sin contraseñas**
- 🔐 **Tokens JWT seguros con expiración**
- 📱 **Galería de fotos para clientes**
- 💰 **Aprobación de presupuestos online**
- 🔔 **Integración mejorada con WhatsApp**
- 🛡️ **Verificación telefónica mejorada**
- 📊 **UI/UX optimizada para móviles**

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Siéntete libre de:
- Reportar bugs
- Sugerir mejoras
- Enviar pull requests
- Compartir tu experiencia usando el sistema

## 📄 Licencia

Este proyecto es **Open Source**. Puedes usarlo, modificarlo y distribuirlo libremente.

## 📞 Soporte

¿Tienes preguntas?
- 📧 Crea un issue en GitHub
- 💬 Comenta en el repositorio
- 🔄 Revisa las discusiones existentes

---

**⭐ Si te gusta el proyecto, ¡dale una estrella en GitHub!**

🔗 **Repositorio**: https://github.com/davidhielo91/sistema-de-taller
