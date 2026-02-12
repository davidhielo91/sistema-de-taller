# Sistema de Taller - Gestión de Órdenes de Servicio

Sistema profesional para talleres de reparación de equipos de cómputo. Permite gestionar órdenes de servicio, inventario de partes, notificaciones por WhatsApp y más.

## Requisitos

- [Node.js](https://nodejs.org) v18 o superior

## Instalación

1. Abre una terminal en la carpeta del proyecto
2. Instala las dependencias:

```bash
npm install
```

3. Crea el archivo de configuración (opcional):

```bash
cp .env.local.example .env.local
```

4. Compila el proyecto:

```bash
npm run build
```

5. Inicia el servidor:

```bash
npm start
```

6. Abre tu navegador en **http://localhost:3000**

## Acceso al panel de administración

- URL: **http://localhost:3000/admin**
- Contraseña por defecto: `admin123`

Para cambiar la contraseña, edita el archivo `.env.local`:

```
ADMIN_PASSWORD=tu_nueva_contraseña
```

## Características

- **Órdenes de servicio**: Crear, editar, cambiar estado, imprimir recibos
- **Seguimiento público**: Los clientes consultan el estado de su orden desde la página principal
- **Inventario de partes**: Control de stock con alertas de bajo inventario
- **Notificaciones WhatsApp**: Mensajes automáticos al crear orden o cuando está lista
- **Firma digital**: Captura de firma del cliente al recibir el equipo
- **Fotos del equipo**: Documentación fotográfica del estado del dispositivo
- **Reportes**: Estadísticas de órdenes, ganancias y costos
- **Respaldos**: Exportación en CSV (Excel) y JSON completo
- **Personalizable**: Nombre, logo, color, teléfono, dirección, horario, plantillas WhatsApp

## Personalización

Ve a **Admin → Configuración** para personalizar:

- Nombre del negocio
- Teléfono, email, dirección
- Número de WhatsApp
- Horario de atención
- Logo (URL)
- Color de marca
- Plantillas de mensajes WhatsApp
- Umbral de stock bajo

## Respaldos

En **Admin → Configuración → Respaldo de Información**:

- **CSV**: Exporta las órdenes en formato Excel
- **JSON**: Backup completo (órdenes + configuración + inventario)

## Desarrollo

Para modo desarrollo con recarga automática:

```bash
npm run dev
```

El servidor se inicia en **http://localhost:3000**

## Estructura

```
├── src/
│   ├── app/           # Páginas y rutas API (Next.js App Router)
│   ├── components/    # Componentes reutilizables
│   ├── lib/           # Lógica de almacenamiento
│   └── types/         # Tipos TypeScript
├── data/              # Datos locales (no se sube a Git)
├── public/            # Archivos estáticos
└── package.json
```
