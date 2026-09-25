# Caja Verde 2

Caja verde es una aplicación web progresiva generada por [iRoute](http://iroute.com.ec/) que pertenece y es parte de un proyecto de Banco Bolivariano que lleva su mismo nombre.

Caja verde fue generado usando [Angular CLI](https://github.com/angular/angular-cli) version 11.2.12.

## Despliegue de desarrollo

> Para desplegar un ambiente de desarrollo óptimo debe contar con Node ^12 y una instalación global de Angular CLI. ^11
Además, debe asegurarse de contar con las dependencias que caja verde necesita comprobando que exista la carpeta `node_modules` en la raíz del proyecto, en caso de que no exista debe ejecutar el comando `npm install` con una terminal en esta misma ruta. 

El comando `ng s -o` levanta un servidor local de node en el puerto 4200 que brindara un entorno de desarrollo.

En caso de requerir otro puerto ejecuté el comando `ng s -o --port 1111` indicando un puerto disponible luego de la bandera `--port`

## Distribución

Para generar una nueva distribución debe ejecutar el comando `ng build --prod` en caso de requerir más opciones puede darle un vistazo a la [documentación oficial](https://angular.io/cli/build).
