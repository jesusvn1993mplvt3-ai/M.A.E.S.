# Escáner Tejido v1.9

Esta versión incorpora la comprobación de nuevas versiones desde GitHub. El APK consulta `update.json`, compara `versionCode`, valida que la descarga pertenezca al Release autorizado y verifica SHA-256 antes de abrir el instalador oficial de Android.

La actualización requiere la confirmación normal del sistema Android y, si el teléfono lo solicita, activar temporalmente el permiso para instalar aplicaciones desconocidas para esta aplicación.
