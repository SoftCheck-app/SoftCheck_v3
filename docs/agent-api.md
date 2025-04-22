# API de Validación de Software para Agentes

Esta documentación describe la API utilizada por los agentes de SoftCheck para validar e informar sobre instalaciones de software en los equipos de los empleados.

## Endpoint

```
POST /api/validate_software
```

## Autenticación

La API utiliza autenticación por clave API. Cada solicitud debe incluir una cabecera `X-API-Key` con una clave API válida.

```
X-API-Key: tu_clave_api
```

Las claves API se almacenan de forma segura en la base de datos utilizando un hash SHA-256.

## Estructura de la Solicitud

La solicitud debe ser una petición POST con un cuerpo JSON que contenga la información del software detectado.

### Ejemplo de Solicitud

```json
{
  "device_id": "DEVICE-ABC123",
  "user_id": "nombre_usuario",
  "software_name": "Adobe Photoshop",
  "version": "24.0.0",
  "vendor": "Adobe",
  "install_date": "2023-06-15T10:30:00Z",
  "install_path": "/Applications/Adobe Photoshop 2023.app",
  "install_method": "manual",
  "last_executed": "2023-06-16T14:22:00Z",
  "is_running": true,
  "digital_signature": "true",
  "is_approved": false,
  "detected_by": "macos_agent",
  "sha256": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z",
  "notes": null
}
```

### Campos Requeridos

- `device_id`: Identificador único del dispositivo
- `software_name`: Nombre del software detectado
- `version`: Versión del software

### Campos Opcionales

- `user_id`: Nombre o ID del usuario (si se proporciona un nombre, se intentará buscar en la base de datos)
- `vendor`: Fabricante del software
- `install_date`: Fecha de instalación (formato ISO)
- `install_path`: Ruta de instalación
- `install_method`: Método de instalación (manual, auto, etc.)
- `last_executed`: Fecha de última ejecución (formato ISO)
- `is_running`: Si el software está en ejecución (true/false)
- `digital_signature`: Estado de la firma digital (true/false como texto)
- `is_approved`: Si el software está pre-aprobado (true/false)
- `detected_by`: Identificador del agente que detectó el software
- `sha256`: Hash SHA-256 del ejecutable principal
- `notes`: Notas adicionales

## Respuestas

### Éxito (200 OK)

Si el software no existía previamente:

```json
{
  "success": true,
  "message": "Software registered successfully",
  "isApproved": false,
  "softwareId": "cl12345678"
}
```

Si el software ya existía y fue actualizado:

```json
{
  "success": true,
  "message": "Software updated successfully",
  "isApproved": true,
  "softwareId": "cl12345678"
}
```

### Errores

**400 Bad Request** - Faltan campos requeridos:

```json
{
  "success": false,
  "message": "Missing required fields",
  "requiredFields": ["device_id", "software_name", "version"]
}
```

**401 Unauthorized** - API key faltante o no válida:

```json
{
  "success": false,
  "message": "Missing API key"
}
```

o

```json
{
  "success": false,
  "message": "Invalid API key"
}
```

**405 Method Not Allowed** - Método no permitido:

```json
{
  "success": false,
  "message": "Method not allowed"
}
```

**500 Internal Server Error** - Error interno del servidor:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Ejemplo de Uso con cURL

```bash
curl -X POST \
  https://tu-dominio.com/api/validate_software \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: tu_clave_api' \
  -d '{
    "device_id": "DEVICE-ABC123",
    "user_id": "nombre_usuario",
    "software_name": "Adobe Photoshop",
    "version": "24.0.0",
    "vendor": "Adobe",
    "install_date": "2023-06-15T10:30:00Z",
    "install_path": "/Applications/Adobe Photoshop 2023.app",
    "install_method": "manual",
    "is_running": true,
    "digital_signature": "true",
    "detected_by": "macos_agent",
    "sha256": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z"
  }'
```

## Notas para Desarrolladores

1. Asegúrate de que la clave API utilizada esté registrada en la base de datos.
2. El campo `user_id` puede ser un ID real o un nombre de usuario. Si es un nombre, el sistema intentará encontrar el ID correspondiente.
3. El sistema verificará si el software ya existe en la base de datos (mismo dispositivo, nombre, versión y usuario) y actualizará la entrada existente en lugar de crear una nueva.
4. El campo `isApproved` en la respuesta indica si el software está aprobado en el sistema. 