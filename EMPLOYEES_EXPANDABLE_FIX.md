# Employees Expandable Software List

## Funcionalidad Implementada

Se ha añadido una funcionalidad de desplegable a la página de empleados para mostrar el software instalado de cada empleado de manera expandible.

## Características

### ✅ **Vista Desplegable**
- Cada empleado tiene un botón de expansión (chevron)
- Click para expandir/contraer la lista de software
- Transiciones suaves para mejor UX

### ✅ **Información de Software**
- Nombre del software
- Versión instalada  
- Estado de aprobación
- Fecha de instalación

### ✅ **Diseño Responsivo**
- Tabla principal con información básica del empleado
- Fila expandida con fondo diferenciado
- Grid de 2 columnas para software/versión
- Compatible con modo oscuro

## Vista Previa

```
👤 Ana García                    3 softwares installed     [v] 
    ↳ Installed software:
      Software                   Version
      Adobe Creative Cloud       2023.4.0
      Microsoft Office 365       16.0.15330
      Maltego Community          5.13.5
```

## Cambios Técnicos

### 1. **Estado de Expansión**
```typescript
const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
```

### 2. **Función Toggle**
```typescript
const toggleEmployeeExpansion = (employeeId: string) => {
  setExpandedEmployees(prev => {
    const newSet = new Set(prev);
    if (newSet.has(employeeId)) {
      newSet.delete(employeeId);
    } else {
      newSet.add(employeeId);
    }
    return newSet;
  });
};
```

### 3. **Estructura Expandible**
- Uso de `Fragment` para múltiples filas por empleado
- Fila principal con información básica
- Fila expandida condicional con lista de software

### 4. **API Integration**
- El endpoint `/api/employees` ya incluye software relacionado
- Datos cargados automáticamente con relaciones

## Uso

1. **Ver empleados**: Lista todos los empleados con resumen de software
2. **Expandir detalles**: Click en chevron para ver software completo
3. **Contraer**: Click nuevamente para ocultar detalles

## Tecnologías

- **React Hooks**: useState para manejo de estado
- **Tailwind CSS**: Estilos responsivos y modo oscuro
- **Heroicons**: Iconos de chevron para indicadores visuales
- **Prisma**: Relaciones empleado-software en base de datos

## Próximas Mejoras

- [ ] Filtro de software por estado (aprobado/pendiente/denegado)
- [ ] Ordenamiento de software por fecha/nombre
- [ ] Paginación para empleados con mucho software
- [ ] Export de lista de software por empleado
- [ ] Indicadores visuales de riesgo por software 