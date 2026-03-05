import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Role, CreateRoleRequest, UpdateRoleRequest, UserRole, AssignRoleRequest } from '@/lib/types/role';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseRoleRepository {
  private readonly collectionName = 'roles';
  private readonly userRolesCollectionName = 'userRoles';

  async create(data: CreateRoleRequest): Promise<Role> {
    const now = new Date();
    const roleData = {
      ...data,
      permissions: data.permissions || this.getDefaultPermissions(data.code),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, this.collectionName), roleData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create role');
    }

    return this.mapToRole(docSnap);
  }

  async findById(id: string): Promise<Role | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToRole(docSnap);
  }

  async findAll(): Promise<Role[]> {
    const q = query(
      collection(db, this.collectionName),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToRole);
  }

  async findActive(): Promise<Role[]> {
    const q = query(
      collection(db, this.collectionName),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToRole);
  }

  async findByCode(code: string): Promise<Role | null> {
    const q = query(
      collection(db, this.collectionName),
      where('code', '==', code),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToRole(querySnapshot.docs[0]);
  }

  async update(id: string, data: UpdateRoleRequest): Promise<Role> {
    const docRef = doc(db, this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await updateDoc(docRef, updateData);
    
    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update role');
    }

    return this.mapToRole(updatedDoc);
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { isActive: false });
  }

  // User Roles methods
  async assignRole(data: AssignRoleRequest, assignedBy: string): Promise<UserRole> {
    const now = new Date();
    const userRoleData = {
      userId: data.userId,
      roleId: data.roleId,
      assignedAt: now,
      assignedBy,
      isActive: true,
    };

    const docRef = await addDoc(collection(db, this.userRolesCollectionName), userRoleData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to assign role');
    }

    return this.mapToUserRole(docSnap);
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const q = query(
      collection(db, this.userRolesCollectionName),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('assignedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToUserRole);
  }

  async removeUserRole(id: string): Promise<void> {
    const docRef = doc(db, this.userRolesCollectionName, id);
    await updateDoc(docRef, { isActive: false, updatedAt: new Date() });
  }

  private getDefaultPermissions(code: string) {
    const permissions: Record<string, any[]> = {
      'coordinator': [
        { resource: 'certificates', actions: ['create', 'read'] },
        { resource: 'programs', actions: ['create', 'read', 'update'] },
        { resource: 'graduates', actions: ['create', 'read', 'update'] },
      ],
      'verifier': [
        { resource: 'certificates', actions: ['read', 'update'] },
        { resource: 'programs', actions: ['read'] },
        { resource: 'graduates', actions: ['read'] },
      ],
      'signer': [
        { resource: 'certificates', actions: ['read', 'update'] },
        { resource: 'programs', actions: ['read'] },
        { resource: 'graduates', actions: ['read'] },
      ],
      'administrator': [
        { resource: '*', actions: ['*'] },
      ],
    };
    
    return permissions[code] || [];
  }

  private mapToRole = (doc: QueryDocumentSnapshot<DocumentData>): Role => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      code: data.code || 'coordinator',
      description: data.description,
      permissions: data.permissions || [],
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };

  private mapToUserRole = (doc: QueryDocumentSnapshot<DocumentData>): UserRole => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId || '',
      roleId: data.roleId || '',
      assignedAt: data.assignedAt?.toDate() || new Date(),
      assignedBy: data.assignedBy || '',
      isActive: data.isActive ?? true,
    };
  };
}
