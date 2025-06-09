# Fix para el Cálculo de Horas Ahorradas en el Dashboard

## Problemas Identificados

El dashboard tenía dos problemas principales:

### 1. Horas Ahorradas
- Contaba software **añadido** este mes (por `installDate`)
- Debería contar **TODO** el software registrado este mes (independiente del estado) × 1.5 horas

### 2. Software Approved This Month
- Contaba software aprobado usando `installDate`
- Debería contar software aprobado usando `approvedDate` (fecha real de aprobación)

### 3. Company Risk
- Calculaba la media de **todo** el software (incluyendo pendiente/denegado)
- Debería calcular la media solo del software **aprobado**

### 4. Malware Blocked
- Contaba todo software con RiskLevel >= 80
- Debería contar solo software **denegado** con RiskLevel >= 80

## Cambios Realizados

### 1. Schema de Base de Datos
- ✅ Añadido campo `approvedDate` a `SoftwareDatabase` en `schema.prisma`

### 2. Endpoints de API
- ✅ Actualizado `/api/software/approve.ts` para establecer `approvedDate` cuando se aprueba/deniega
- ✅ Actualizado `/api/software/index.ts` para establecer `approvedDate` en edición manual
- ✅ Actualizado `/api/dashboard/stats.ts` con nueva lógica de cálculo para horas ahorradas
- ✅ Corregido `/api/dashboard/stats.ts` para que "Software Approved This Month" use `approvedDate`
- ✅ Corregido Company Risk para calcular media solo de software aprobado
- ✅ Corregido Malware Blocked para contar solo software denegado con alto riesgo

### 3. Tipos TypeScript
- ✅ Actualizado `types/softcheck.ts` con campo `approvedDate`

### 4. Script de Migración
- ✅ Creado `scripts/migrate-approved-date.ts` para migrar datos existentes

## Instrucciones para Aplicar los Cambios

### Paso 1: Migrar Base de Datos
```bash
# Desde el directorio SoftCheck_v3
npm run prisma:migrate-dev
# O alternativamente:
npx prisma migrate dev --name add-approved-date
```

### Paso 2: Generar Cliente Prisma
```bash
npm run prisma:generate
# O alternativamente:
npx prisma generate
```

### Paso 3: Migrar Datos Existentes
```bash
# Ejecutar el script de migración para datos existentes
npm run ts-node scripts/migrate-approved-date.ts
# O alternativamente:
npx ts-node scripts/migrate-approved-date.ts
```

### Paso 4: Verificar
- Reiniciar el servidor de desarrollo
- Ir al dashboard y verificar que las horas ahorradas se calculan correctamente

## Nueva Lógica de Cálculo

### Horas Ahorradas

**Antes:**
```typescript
// Contaba software añadido este mes
const softwareAddedThisMonth = count(installDate >= startOfMonth)
const hours = softwareAddedThisMonth * 1.5
```

**Después:**
```typescript
// Cuenta TODO el software registrado este mes (independiente del estado)
const softwareAnalyzedThisMonth = count(
  teamId = currentTeamId AND
  installDate >= startOfMonth AND installDate <= endOfMonth
)
const hours = softwareAnalyzedThisMonth * 1.5
```

### Software Approved This Month

**Antes:**
```sql
-- Contaba software aprobado por fecha de instalación
SELECT COUNT(*) FROM SoftwareDatabase 
WHERE isApproved = true AND installDate >= startOfMonth
```

**Después:**
```sql
-- Cuenta software aprobado por fecha real de aprobación
SELECT COUNT(*) FROM SoftwareDatabase 
WHERE isApproved = true AND approvedDate >= startOfMonth
```

### Company Risk

**Antes:**
```sql
-- Calculaba media de TODO el software
SELECT RiskLevel FROM SoftwareDatabase 
WHERE teamId = ? AND RiskLevel IS NOT NULL
```

**Después:**
```sql
-- Calcula media solo de software APROBADO
SELECT RiskLevel FROM SoftwareDatabase 
WHERE teamId = ? AND isApproved = true AND RiskLevel IS NOT NULL
```

### Malware Blocked

**Antes:**
```sql
-- Contaba todo software con alto riesgo
SELECT COUNT(*) FROM SoftwareDatabase 
WHERE teamId = ? AND RiskLevel >= 80
```

**Después:**
```sql
-- Cuenta solo software DENEGADO con alto riesgo
SELECT COUNT(*) FROM SoftwareDatabase 
WHERE teamId = ? AND isApproved = false AND RiskLevel >= 80
```

## Funcionamiento

1. **Cuando se registra software**: Se establece `installDate = now()`
2. **Dashboard cuenta**: TODO el software registrado en el mes actual del teamId
3. **Cálculo**: Número total de software × 1.5 horas × 15€/hora
4. **Sin filtros**: No importa si está aprobado, denegado o pendiente

## Verificación

Después de aplicar los cambios, el dashboard debería mostrar:
- Horas ahorradas = Número TOTAL de software registrados este mes × 1.5
- Ahorro en euros = Horas × 15€

## Notas

- El cálculo usa `installDate` para determinar cuándo se registró el software
- Se cuenta TODO el software del equipo, sin importar el estado de aprobación
- El cálculo refleja el tiempo invertido en gestionar/analizar software del equipo 