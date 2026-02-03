# Lista de Verificación para Despliegue en Vercel

El código ya está corregido. El problema anterior ("No se encontraron emails") era porque la web en producción apuntaba a una función vieja. Ahora apunta a la nueva integración de Hunter.

Para que funcione en Vercel, solo falta un paso crítico: **Configurar la API Key**.

## Pasos para Activar Producción

1.  Ve a tu proyecto en **Vercel Dashboard**.
2.  Clic en **Settings** (arriba) -> **Environment Variables**.
3.  Agrega una nueva variable:
    -   **Key**: `HUNTER_API_KEY`
    -   **Value**: `df86375e5cb407215038dd25dfe5f3b7a7615275` (Tu llave real)
    -   Selecciona: Production, Preview, Development (Todo).
4.  **IMPORTANTE**: Después de guardar, debes **Redesplegar** para que tome el cambio.
    -   Ve a la pestaña **Deployments**.
    -   En el último commit (el que acabo de subir), dale a los 3 puntitos -> **Redeploy**.

## Verificación

Una vez termine el deploy (unos 2 min):
1.  Abre tu URL pública (`tudominio.vercel.app`).
2.  Ve a "Mis Leads".
3.  Prueba "Buscar Dueño".
4.  Debería funcionar igual de rápido y bien que en local.

¡Ya podrás cerrar el servidor local y liberar tu PC!
