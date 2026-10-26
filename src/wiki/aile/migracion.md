---
title: Aile v2 - Migración
description: Cambios necesarios para pasar de Aile v1 a v2.
wiki_project: Aile
---

La v2 mantiene la misma idea que la v1: una capa delgada sobre `net/http`. Los
cambios que rompen compatibilidad son pocos y se pueden aplicar en una tarde.

## 1. Ruta de importación

```go
import "codeberg.org/urutau-ltd/aile/v2"
```

Los paquetes de `x/` cambian igual:

```go
import requestid "codeberg.org/urutau-ltd/aile/v2/x/request_id"
import secureheaders "codeberg.org/urutau-ltd/aile/v2/x/secure_headers"
```

## 2. `Handle` y `HandleFunc` ya no existen

En la v1 podías registrar el método dentro del patrón:

```go
// v1
app.HandleFunc("GET /users/{id}", getUser)
app.HandleFunc("POST /users", createUser)
```

En la v2 se usan los helpers de método:

```go
// v2
app.GET("/users/{id}", getUser)
app.POST("/users", createUser)
```

El patrón que recibe el helper no lleva el método. `ServeMux` sigue viendo
`"GET /users/{id}"` por dentro.

## 3. Archivos estáticos

La v2 agrega dos helpers:

```go
if err := app.Static("/assets", assetsFS); err != nil {
    log.Fatal(err)
}
```

```go
h, err := aile.StaticHandler("/assets/", assetsFS)
if err != nil {
    log.Fatal(err)
}
```

Son wrappers de `http.FileServerFS` y `http.StripPrefix`. Si ya tenías tu propio
handler, no hace falta cambiarlo.

## 4. Constantes de versión

```go
fmt.Println(aile.Version)    // 2.2.0
fmt.Println(aile.ReleaseTag) // v2.2.0
```

Sirven para logs, diagnósticos y para versionar assets.

## 5. Correcciones de runtime

La v2 corrigió varios comportamientos de la v1:

- `Serve` y `Run` devuelven los errores de los hooks de cierre.
- `Serve` cierra el listener si falla un hook de inicio.
- `x/combine` compone de verdad el middleware.
- `x/compress` envuelve el response writer que crea.

No requieren cambios en tu código, pero sí conviene revisar los tests si
dependías del comportamiento anterior.

## Lista de verificación

1. Cambia todos los imports a `/v2`.
2. Reemplaza `Handle` y `HandleFunc` por `GET`, `POST`, etc.
3. Ejecuta `go test ./...`.
4. Si sirves archivos estáticos, considera mover esas rutas a `app.Static`.
5. Revisa los hooks de cierre si usabas `Serve` o `Run` en la v1.
