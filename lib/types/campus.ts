export interface Campus {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampusRequest {
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface UpdateCampusRequest {
  name?: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}
