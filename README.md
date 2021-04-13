# ![MyChat](https://i.imgur.com/CAGI9V6.png)

# MyChat

MyChat es una aplicación de mensajería en tiempo real con servidores de Discord de código abierto (similar a un canal de Discord). MyChat utiliza la autenticación (OAuth2) de una cuenta de usuario Discord y mediante la integración de un webhook para conectarse a un canal de Discord. MyChat está programado con Express, socket.io, passport y Discord.js en el servidor (back-end) y Materialize CSS y JQuery en el cliente (front-end).

[Demo](https://mychat-discord.herokuapp.com/)

## Instrucciones para desplegar a producción

**1- Crear archivo `.env`**

-   Un ejemplo se encuentra en `.env.example` (`cp .env.example .env` en Linux)
-   Configurar las siguientes variables:

> ```ENV
> PORT=3030 # El puerto donde MyChat escuchará para recibir las peticiones HTTP.
> ID_WH="" # El ID de el webhook que usará MyChat para enviar mensajes (desde la web a Discord).
> TOKEN_WH="" # El TOKEN de el webhook que usará MyChat para enviar mensajes (desde la web a Discord).
> CLIENT_ID="" # El ID del cliente de la app de Discord que usará MyChat de https://discord.dev
> CLIENT_SECRET="" # El código secreto del cliente de la app de Discord que usará MyChat de https://discord.dev
> URL="http://localhost:3030" # Esta URL deberá ser configurada en https://discord.dev, poner /login al final en discord.dev
> ID_CHANNEL_LOG="" # El ID del canal de Discord en donde se envian registros (logs) de la web.
> ID_CHANNEL="" # El ID del canal de Discord en donde se enviarán y recibirán mensajes. # Adicional: El webhook los envia a el canal donde se estableció.
> DISCORD_TOKEN="" # Token del bot de Discord donde MyChat iniciará sesión.
> BLACKLIST="" # Las IDs aquí no pueden usar MyChat. Ponerlo en formato "1234,5678" (cada coma separa una ID);
> GUILDONLY="" # Poner "true" para aceptar únicamente miembros del servidor donde se encuentra el canal que usted puso.
> ```

**2- Ejecutar MyChat**

-   Ejecutar el siguiente comando:

> ```bash
> npm install
> ```

> ```bash
> npm start
> ```
>
> Ó
>
> ```bash
> node index.js
> ```

**3.0- Ejecutar MyChat como servicio**

De esa manera se mantendrá encendido junto con el sistema sin molestar otras apps o la UI (como la terminal).
Aqui algunos administradores de servicio:

-   [PM2](https://github.com/Unitech/pm2) (todos los SO que pueden ejecutar Node.js):

Aplicación recomendable para ejecutar apps de Node.js como este:

> `pm2 start index.js`

o también puede seguir el ejemplo del ecosistema en `mychat-pm2.config.js`

> `pm2 start mychat-pm2.config.js`

-   [SystemD](https://wiki.debian.org/es/systemd) (sólo Linux):

Administrador incluido en varias distribuciones de Linux.

Un ejemplo se encuentra en `mychat.service`. Modifíquelo dependiendo de dónde se ubique Node.js y MyChat

> `cp mychat.service /etc/systemd/system`

> `systemctl enable --now mychat`

> `systemctl status mychat`

-   [DaemonMaster](https://github.com/TWC-Software/DaemonMaster) (sólo Windows):

Recomendable cuando tienes una máquina con Windows y quieres tener un mejor control de tus servicios.

Cree un servicio, ponga nombre y descripción, ubique la instalación de Node.js y ponga la ruta completa donde se encuentre MyChat en la sección de parámetros (ejemplo `C:\Users\Admin\MyChat\index.js`).

Luego acepte el formulario, haga click derecho en el servicio e inícielo.

Si aún deseas ver la consola, inicia el servicio en tu sesión actual.

**3.1- Ejecutar MyChat en un contenedor (Docker)**

Si no quieres molestarte en instalar Node.js o los paquetes, y tienes Docker, una vez hecho el paso 2, realizar estos 2 comandos:

> `docker build --tag cratermaik/mychat .`

> `docker run -p 3030:3030 cratermaik/mychat`

La app escuchará al puerto 3030, si necesitas otro puerto sólo cambialo (ej. `5000:3030`).
