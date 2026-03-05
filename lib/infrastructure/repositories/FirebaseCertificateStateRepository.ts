import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  setDoc,
  query, 
  orderBy, 
  where,
  limit,
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CertificateState, CertificateStateValue, StateHistory, StateTransition } from '@/lib/types/certificateState';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export class FirebaseCertificateStateRepository {
  private readonly collectionName = 'certificateStates';
  private readonly historyCollectionName = 'stateHistories';

  async create(state: Omit<CertificateState, 'id'>): Promise<CertificateState> {
    const stateData = {
      ...state,
      changedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, this.collectionName), stateData);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Failed to create certificate state');
    }

    const newState = this.mapToCertificateState(docSnap);
    
    // Actualizar historial
    await this.updateHistory(state.certificateId, newState);
    
    return newState;
  }

  async getCurrentState(certificateId: string): Promise<CertificateState | null> {
    const q = query(
      collection(db, this.collectionName),
      where('certificateId', '==', certificateId),
      orderBy('changedAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToCertificateState(querySnapshot.docs[0]);
  }

  async getStateHistory(certificateId: string): Promise<StateHistory | null> {
    const docRef = doc(db, this.historyCollectionName, certificateId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToStateHistory(docSnap);
  }

  async getStatesByUser(userId: string, state?: CertificateStateValue): Promise<CertificateState[]> {
    let q = query(
      collection(db, this.collectionName),
      where('changedBy', '==', userId),
      orderBy('changedAt', 'desc')
    );

    if (state) {
      q = query(
        collection(db, this.collectionName),
        where('changedBy', '==', userId),
        where('currentState', '==', state),
        orderBy('changedAt', 'desc')
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateState);
  }

  async getPendingActions(userRole: string): Promise<CertificateState[]> {
    // Obtener estados que requieren acción del rol del usuario
    const pendingStates: CertificateStateValue[] = this.getPendingStatesForRole(userRole);
    
    if (pendingStates.length === 0) {
      return [];
    }

    const q = query(
      collection(db, this.collectionName),
      where('currentState', 'in', pendingStates),
      orderBy('changedAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateState);
  }

  async transitionState(
    certificateId: string, 
    newState: CertificateStateValue, 
    changedBy: string, 
    comments?: string
  ): Promise<CertificateState> {
    // Obtener estado actual
    const currentState = await this.getCurrentState(certificateId);
    
    const stateData: Omit<CertificateState, 'id'> = {
      certificateId,
      currentState: newState,
      previousState: currentState?.currentState,
      changedBy,
      changedAt: new Date(),
      comments,
    };

    const newStateRecord = await this.create(stateData);
    
    // Actualizar historial
    await this.updateHistory(certificateId, newStateRecord);
    
    return newStateRecord;
  }

  private async updateHistory(certificateId: string, newState: CertificateState): Promise<void> {
    const docRef = doc(db, this.historyCollectionName, certificateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Actualizar historial existente
      const history = this.mapToStateHistory(docSnap);
      history.transitions.push(newState);
      history.updatedAt = new Date();
      
      await updateDoc(docRef, {
        transitions: history.transitions.map(t => ({
          id: t.id,
          certificateId: t.certificateId,
          currentState: t.currentState,
          previousState: t.previousState,
          changedAt: Timestamp.fromDate(t.changedAt),
          changedBy: t.changedBy,
          comments: t.comments,
          metadata: t.metadata
        })),
        updatedAt: Timestamp.fromDate(history.updatedAt)
      });
    } else {
      // Crear nuevo historial
      const historyData = {
        certificateId,
        transitions: [{
          id: newState.id,
          certificateId: newState.certificateId,
          currentState: newState.currentState,
          previousState: newState.previousState,
          changedAt: Timestamp.fromDate(newState.changedAt),
          changedBy: newState.changedBy,
          comments: newState.comments,
          metadata: newState.metadata
        }],
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date())
      };
      
      await setDoc(docRef, historyData);
    }
  }

  private getPendingStatesForRole(userRole: string): CertificateStateValue[] {
    const roleStates: Record<string, CertificateStateValue[]> = {
      'coordinator': ['draft', 'verified', 'signed'],
      'verifier': ['pending_review'],
      'signer': ['pending_signature'],
      'administrator': ['draft', 'pending_review', 'verified', 'pending_signature', 'signed']
    };
    
    return roleStates[userRole] || [];
  }

  private mapToCertificateState = (doc: QueryDocumentSnapshot<DocumentData>): CertificateState => {
    const data = doc.data();
    return {
      id: doc.id,
      certificateId: data.certificateId || '',
      currentState: data.currentState || 'draft',
      previousState: data.previousState,
      changedAt: data.changedAt?.toDate() || new Date(),
      changedBy: data.changedBy || '',
      comments: data.comments,
      metadata: data.metadata,
    };
  };

  private mapToStateHistory = (doc: QueryDocumentSnapshot<DocumentData>): StateHistory => {
    const data = doc.data();
    return {
      certificateId: data.certificateId || '',
      transitions: (data.transitions || []).map((t: any) => ({
        id: t.id,
        certificateId: t.certificateId,
        currentState: t.currentState,
        previousState: t.previousState,
        changedAt: t.changedAt?.toDate() || new Date(),
        changedBy: t.changedBy,
        comments: t.comments,
        metadata: t.metadata
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  };
}
