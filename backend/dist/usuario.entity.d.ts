export declare enum RolUsuario {
    ADMIN_VENTAS = "admin_ventas",
    CLIENTE = "cliente",
    SOPORTE = "soporte"
}
export declare class Usuario {
    id: string;
    nombre: string;
    correo_electronico: string;
    contrasena_hash: string;
    rol: RolUsuario;
    fechaCreacion: Date;
    fechaActualizacion: Date;
}
