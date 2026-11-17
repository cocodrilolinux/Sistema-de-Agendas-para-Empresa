import type { Department } from './note';

/** Gerente: acceso global. Empleado: acceso limitado a su area_id. */
export type Role = 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Área asignada. Los gerentes no tienen área porque ven todas. */
  area_id: Department | null;
  /** Solo lo devuelve el listado administrativo para gerencia. */
  password?: string;
}

/** Datos mínimos de un usuario para los selectores de compartición. */
export type ShareableUser = Pick<User, 'id' | 'name' | 'area_id' | 'role'>;

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  area_id: Department | null;
}
