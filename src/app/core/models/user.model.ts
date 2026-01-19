/**
 * 使用者相關資料模型
 */

/**
 * 使用者
 */
export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  roles: Role[];
  store_id?: number;
  store?: Store;
  created_at: string;
  updated_at: string;
}

/**
 * 建立使用者請求
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role_ids?: number[];
  store_id?: number;
}

/**
 * 更新使用者請求
 */
export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role_ids?: number[];
  store_id?: number;
}

/**
 * 角色
 */
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立角色請求
 */
export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
  is_active?: boolean;
}

/**
 * 更新角色請求
 */
export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
}

/**
 * 門市
 */
export interface Store {
  id: number;
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立門市請求
 */
export interface CreateStoreRequest {
  code: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

/**
 * 更新門市請求
 */
export interface UpdateStoreRequest {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
}

/**
 * 倉庫
 */
export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: string;
  store_id?: number;
  store?: Store;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 建立倉庫請求
 */
export interface CreateWarehouseRequest {
  code: string;
  name: string;
  address?: string;
  store_id?: number;
  is_active?: boolean;
}

/**
 * 更新倉庫請求
 */
export interface UpdateWarehouseRequest {
  code?: string;
  name?: string;
  address?: string;
  store_id?: number;
  is_active?: boolean;
}
