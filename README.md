# Agenda Empresarial — Demo

**Agenda Empresarial** es un sistema de gestión empresarial para administrar agendas, notas, compromisos, recordatorios, usuarios, departamentos, permisos y actividades mediante una interfaz web moderna.

Esta edición es una **demostración autónoma** y una **plantilla reutilizable** para futuros desarrollos. Funciona sin PHP, sin MySQL, sin cPanel y sin ningún servidor: toda la información se guarda en el navegador mediante **IndexedDB**.

> **Aviso:** los datos de esta demostración son ficticios y se almacenan localmente en tu navegador. No se envían a ningún servidor. Si borras los datos del sitio desde el navegador, la información de la demo se eliminará.

---

## Contenido

- [Qué es](#qué-es)
- [Funcionalidades](#funcionalidades)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Ejecución local](#ejecución-local)
- [Compilación](#compilación)
- [Modo demostración](#modo-demostración)
- [Dónde se guardan los datos](#dónde-se-guardan-los-datos)
- [Restablecer la demostración](#restablecer-la-demostración)
- [Recursos gráficos](#recursos-gráficos)
- [Limitaciones de la demo](#limitaciones-de-la-demo)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Publicar en GitHub](#publicar-en-github)
- [Verificación realizada](#verificación-realizada)

---

## Qué es

Agenda Empresarial permite registrar notas y compromisos con fecha, hora, prioridad, categoría, área y estado. Las notas pueden compartirse con áreas o con personas concretas, adjuntar imágenes y audio, posponerse, marcarse como cumplidas, enviarse a la papelera y restaurarse.

La aplicación está construida con React + TypeScript + Vite y una capa de datos local sobre IndexedDB. No hay llamadas HTTP a una API, no hay sesiones de servidor, no se utilizan cookies de autenticación y no se necesita una base de datos externa.

El objetivo del proyecto es servir como:

- Demostración funcional de un panel de gestión empresarial.
- Plantilla base para prototipos y desarrollos futuros.
- Ejemplo de aplicación React con persistencia local real.

---

## Funcionalidades

### Calendario y notas

- Vista mensual con navegación entre meses y selector de día.
- Indicadores visuales de notas vencidas, próximas y completadas.
- Creación de notas desde cualquier día del calendario.
- Edición de título, descripción, fecha, hora, prioridad, categoría, estado y área propietaria.
- Estados: pendiente, completada e incumplida.
- Posponer notas con historial de cambios de fecha y hora.
- Filtros por área para usuarios con rol de gerencia.

### Compartición

- Compartir notas con una o varias áreas.
- Compartir notas con uno o varios usuarios.
- Combinar áreas y usuarios en la misma nota.
- Permisos locales coherentes con el rol del usuario: gerencia ve todo, el creador y el área propietaria pueden editar, la compartición explícita con personas es de solo lectura.

### Usuarios y áreas

- Listado de usuarios ficticios.
- Creación y eliminación de usuarios.
- Asignación de rol y área.
- Gestión de áreas y departamentos.
- Protección de la propia cuenta y de las áreas en uso.

### Recordatorios y multimedia

- Alarmas internas para notas del día y fechas próximas.
- Avisos visuales dentro de la aplicación.
- Adjuntar imágenes y audio a las notas.
- Grabación de audio desde el navegador.
- Visualización y reproducción desde IndexedDB.

### Papelera e historial

- Envío de notas a la papelera.
- Restauración de notas eliminadas.
- Historial de cambios de fecha y hora.
- Conservación de datos al cerrar sesión.

### Apariencia

- Tema claro y oscuro.
- Formato de hora de 12 o 24 horas.
- Selección del primer día de la semana.
- Diseño responsive para escritorio, tableta y móvil.

---

## Tecnologías

- React 19
- TypeScript
- Vite 8
- React Router 7
- Tailwind CSS 3
- Lucide React
- IndexedDB
- Web Audio API para la grabación de audio

---

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Un navegador moderno con soporte para IndexedDB.

No se necesita PHP, MySQL, Apache, Nginx ni ningún servicio externo.

---

## Ejecución local

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite, normalmente:

```text
http://localhost:5173
```

Para comprobar la compilación de producción:

```bash
npm run build
npm run preview
```

---

## Compilación

```bash
npm run build
```

El resultado se genera en `dist/`.

Por defecto, la aplicación funciona en la raíz del dominio. Para publicarla en un subdirectorio, por ejemplo GitHub Pages:

```bash
VITE_BASE=/agenda-empresarial-demo/ npm run build
```

La variable `VITE_BASE` se utiliza tanto para los recursos estáticos como para el `basename` de React Router, de modo que las rutas internas siguen funcionando en la raíz y en subdirectorios.

---

## Modo demostración

La pantalla de acceso incluye el botón **«Entrar en modo demostración»**, que inicia sesión directamente sin correo ni contraseña.

El administrador principal es:

| Campo | Valor |
|---|---|
| Nombre | Administrador Demo |
| Correo | `admin@demo.local` |
| Contraseña | `demo1234` |
| Rol | `manager` |
| Área | Gerencia |

También se puede entrar con el formulario normal usando las cuentas ficticias incluidas:

| Nombre | Correo | Contraseña | Rol | Área |
|---|---|---|---|---|
| Administrador Demo | `admin@demo.local` | `demo1234` | manager | Gerencia |
| Ana Demo | `ana.demo@demo.local` | `Demo2026#` | employee | Administración |
| Carlos Demo | `carlos.demo@demo.local` | `Demo2026#` | employee | Contabilidad |
| María Demo | `maria.demo@demo.local` | `Demo2026#` | employee | Ventas |
| Javier Demo | `javier.demo@demo.local` | `Demo2026#` | employee | Soporte Técnico |
| Sofía Demo | `sofia.demo@demo.local` | `Demo2026#` | employee | Marketing |

Todas las cuentas, nombres y correos son ficticios. Las contraseñas se guardan localmente sin cifrado y solo deben utilizarse en esta demostración.

### Datos de ejemplo

La primera vez que se abre la aplicación se crean automáticamente:

- 12 notas de ejemplo.
- 6 usuarios ficticios.
- 6 áreas.
- 1 imagen de ejemplo.
- 1 audio de ejemplo.

El seed se ejecuta una sola vez y queda marcado en IndexedDB. Si el visitante modifica o elimina datos, la aplicación no vuelve a sobrescribirlos.

### Identificación del modo

La sesión de demostración se identifica explícitamente mediante la marca `isDemoMode` y la clave local `agenda-empresarial:demo:session:v1`. No se deduce del correo ni del nombre del usuario.

### Cerrar sesión

Cerrar sesión elimina únicamente la marca de sesión. **No borra IndexedDB**, por lo que las notas, usuarios, áreas y adjuntos se conservan para la próxima entrada.

---

## Dónde se guardan los datos

IndexedDB es la única fuente de datos de la aplicación.

Base de datos: **`agenda-empresarial-demo`** (versión 1).

| Almacén | Contenido |
|---|---|
| `notes` | Notas, estados, fechas, historial, papelera, comparticiones y recordatorios |
| `media` | Imágenes y audio almacenados como `Blob` |
| `areas` | Áreas y departamentos |
| `users` | Usuarios ficticios y permisos |
| `meta` | Marcas de inicialización, versión y fecha del seed |

También se utilizan algunas claves ligeras de `localStorage`:

| Clave | Uso |
|---|---|
| `agenda-empresarial:demo:session:v1` | Sesión explícita del modo demostración (LocalStorage, o SessionStorage si se desmarca «Recordar sesión») |
| `agenda-empresarial:prefs` | Tema, formato de hora y primer día de la semana |
| `agenda-empresarial:alarms:v1` | Recordatorios ya descartados |

No se utilizan cookies de autenticación ni almacenamiento remoto.

---

## Restablecer la demostración

Desde **Ajustes → Datos de la demostración → Restablecer demostración**:

1. Se solicita confirmación explícita.
2. Se borra **solo** la base IndexedDB `agenda-empresarial-demo` de esta aplicación.
3. Se vuelven a crear los datos de ejemplo.
4. Se limpian los avisos y alarmas locales.
5. La sesión de demostración se mantiene abierta.

La acción no se puede deshacer.

---

## Recursos gráficos

Esta versión **no incluye logotipos, banners ni favicon corporativos**. La identidad visual se compone con tipografía, colores e iconos genéricos de Lucide.

Si deseas añadir recursos propios:

- Guárdalos en `public/` con nombres neutros.
- Actualiza las referencias en el código.
- No utilices logotipos, nombres ni imágenes de terceros sin autorización.

Mantén cualquier recurso que no forme parte de la identidad actual fuera de la carpeta publicable y correctamente excluido en `.gitignore`.

---

## Limitaciones de la demo

- **No hay backend**: no existe API PHP, MySQL, cPanel ni sincronización entre dispositivos.
- **Los datos viven en un navegador y perfil concretos**. Dos navegadores distintos no comparten información.
- **No hay notificaciones Web Push reales**. Requieren un servidor con claves VAPID y un proceso de envío; esta integración está desactivada para no generar errores. Las alarmas y avisos internos sí funcionan.
- **El login es local**. No hay recuperación de contraseña, correo de verificación ni cuentas reales.
- **Las contraseñas de los usuarios ficticios se guardan en IndexedDB sin cifrado**. Es aceptable únicamente porque son datos de demostración; no introduzcas información real.
- **No hay servicio de correo, SMS ni integraciones externas.**
- **La grabación de audio** requiere permiso del micrófono y un contexto seguro (`https` o `localhost`).
- **Borrar los datos del sitio** desde el navegador elimina la demo completa.
- **La papelera y el historial** son locales; no hay auditoría del lado del servidor.

---

## Estructura del proyecto

```text
.
├── src/
│   ├── app/                    Configuración de la app, rutas y basename
│   ├── components/
│   │   ├── calendar/           Calendario y panel del día
│   │   ├── layout/             Layout, navegación e indicador de demo
│   │   ├── media/              Imágenes, audio y grabadora
│   │   ├── notes/              Tarjetas, editor, detalle y posposición
│   │   ├── reminders/          Alarmas internas y avisos
│   │   └── ui/                 Modales, toasts y estados vacíos
│   ├── hooks/                  Auth, notas, áreas, preferencias, multimedia, push
│   ├── pages/                  Login, calendario, historial, papelera, ajustes…
│   ├── services/
│   │   ├── auth/               Autenticación local de la demo
│   │   ├── areas/              Servicio de áreas
│   │   ├── db/                 Apertura, esquema y transacciones de IndexedDB
│   │   ├── demo/               Sesión, seed, repositorio, almacenamiento y reset
│   │   ├── reminders/          Alarmas locales
│   │   └── storage/            Contrato de almacenamiento y permisos
│   ├── styles/                 Tailwind y estilos globales
│   ├── types/                  Tipos de notas y usuarios
│   └── utils/                  Fechas, validaciones y utilidades
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Publicar en GitHub

El proyecto no contiene backend, esquema SQL, scripts de administración ni documentación de servidor.

Pasos sugeridos para crear un repositorio público nuevo:

```bash
# 1. Crea un repositorio vacío en GitHub (sin README ni .gitignore).
# 2. Dentro de esta carpeta:
git init
git add .
git commit -m "Agenda Empresarial: versión demostración con IndexedDB"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/agenda-empresarial-demo.git
git push -u origin main
```

Si la carpeta ya incluye un historial nuevo (por ejemplo, la copia preparada para publicación), omite `git init` y el primer commit: solo configura el remoto y publica.

Antes de publicar:

- Revisa que no existan archivos `.env`, claves privadas ni configuraciones locales.
- No incluyas `node_modules/`, `dist/` ni recursos gráficos que no formen parte de la identidad actual.
- Comprueba el título de la pestaña y los textos de la interfaz.
- No reutilices un historial de Git que pueda contener credenciales o información de versiones anteriores. Crea un historial nuevo.

Para publicar en GitHub Pages con un repositorio de proyecto:

```bash
VITE_BASE=/agenda-empresarial-demo/ npm run build
```

Después publica el contenido de `dist/` con el método que prefieras.

---

## Verificación realizada

La versión incluida en este repositorio se comprobó con:

```bash
npm run typecheck
npm run build
```

Además se ejecutaron pruebas de navegador (Chromium headless) sobre la compilación de producción que verificaron:

- Entrada en modo demostración sin credenciales.
- Rol `manager` y área Gerencia.
- Creación única de datos de ejemplo.
- Creación, edición, compartición y adjunto de imágenes.
- Visualización de imágenes y reproducción de audio desde IndexedDB.
- Marcado como cumplida, posposición e historial.
- Papelera y restauración.
- Gestión de usuarios y áreas.
- Cierre de sesión conservando los datos.
- Persistencia tras recargar el navegador.
- Restablecimiento de la demo sin cerrar sesión.
- Login local con cuenta ficticia y acceso restringido para empleados.
- Cero peticiones a `/api/` o archivos `.php`.
- Consola sin errores relevantes.
- Funcionamiento en la raíz y en un subdirectorio con `VITE_BASE`.

---

## Licencia y uso

Este repositorio se publica como demostración técnica y plantilla reutilizable. Los datos, nombres, correos y contenidos incluidos son ficticios y no representan a personas ni organizaciones reales.
