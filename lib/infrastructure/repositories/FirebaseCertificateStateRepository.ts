import {
  addDoc,
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CertificateState,
  CertificateStateValue,
  StateHistory,
} from '@/lib/types/certificateState';
import { FirebaseCertificateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateRepository';

export class FirebaseCertificateStateRepository {
  private readonly collectionName = 'certificateStates';
  private readonly historyCollectionName = 'stateHistories';
  private readonly certificatesCollectionName = 'certificates';
  private readonly certificateRepository = new FirebaseCertificateRepository();

  async create(state: Omit<CertificateState, 'id'>): Promise<CertificateState> {
    const stateData = {
      ...state,
      changedAt: Timestamp.fromDate(state.changedAt || new Date()),
      metadata: state.metadata || {},
    };

    const docRef = await addDoc(collection(db, this.collectionName), stateData);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Failed to create certificate state');
    }

    const newState = this.mapToCertificateState(docSnap);

    await this.updateHistory(state.certificateId, newState);
    await this.syncCertificateSnapshot(newState);

    return newState;
  }

  async getCurrentState(certificateId: string): Promise<CertificateState | null> {
    const certificateDoc = await getDoc(
      doc(db, this.certificatesCollectionName, certificateId)
    );

    if (certificateDoc.exists()) {
      const currentState = this.mapCertificateToCurrentState(
        certificateDoc.id,
        certificateDoc.data()
      );

      if (currentState) {
        return currentState;
      }
    }

    const q = query(
      collection(db, this.collectionName),
      where('certificateId', '==', certificateId),
      orderBy('changedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.empty ? null : this.mapToCertificateState(querySnapshot.docs[0]);
  }

  async getStateHistory(certificateId: string): Promise<StateHistory | null> {
    const docRef = doc(db, this.historyCollectionName, certificateId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToStateHistory(docSnap);
  }

  async getStatesByUser(
    userId: string,
    state?: CertificateStateValue
  ): Promise<CertificateState[]> {
    const currentStates = await this.listCurrentStates();

    return currentStates.filter((item) => {
      if (item.changedBy !== userId) return false;
      if (state && item.currentState !== state) return false;
      return true;
    });
  }

  async getVisibleCurrentStates(
    userRole: string,
    state?: CertificateStateValue
  ): Promise<CertificateState[]> {
    const currentStates = await this.listCurrentStates();
    const allowedStates = new Set(this.getVisibleStatesForRole(userRole));

    return currentStates.filter((item) => {
      if (!allowedStates.has(item.currentState)) return false;
      if (state && item.currentState !== state) return false;
      return true;
    });
  }

  async getPendingActions(userRole: string): Promise<CertificateState[]> {
    const pendingStates = new Set(this.getPendingStatesForRole(userRole));
    const currentStates = await this.listCurrentStates();

    return currentStates.filter((item) => pendingStates.has(item.currentState));
  }

  async transitionState(
    certificateId: string,
    newState: CertificateStateValue,
    changedBy: string,
    comments?: string,
    metadata?: Record<string, unknown>
  ): Promise<CertificateState> {
    const currentState = await this.getCurrentState(certificateId);

    const stateData: Omit<CertificateState, 'id'> = {
      certificateId,
      currentState: newState,
      previousState: currentState?.currentState,
      changedBy,
      changedAt: new Date(),
      comments,
      metadata,
    };

    return this.create(stateData);
  }

  private async listCurrentStates(): Promise<CertificateState[]> {
    const q = query(
      collection(db, this.certificatesCollectionName),
      orderBy('updatedAt', 'desc'),
      limit(500)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((item) => this.mapCertificateToCurrentState(item.id, item.data()))
      .filter((item): item is CertificateState => item !== null)
      .sort((left, right) => right.changedAt.getTime() - left.changedAt.getTime());
  }

  private async syncCertificateSnapshot(newState: CertificateState): Promise<void> {
    await this.certificateRepository.updateWorkflowState(newState.certificateId, {
      status: newState.currentState,
      changedBy: newState.changedBy,
      changedAt: newState.changedAt,
      comments: newState.comments,
      previousStatus: newState.previousState,
    });
  }

  private async updateHistory(
    certificateId: string,
    newState: CertificateState
  ): Promise<void> {
    const docRef = doc(db, this.historyCollectionName, certificateId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const history = this.mapToStateHistory(docSnap);
      history.transitions.push(newState);
      history.updatedAt = new Date();

      await updateDoc(docRef, {
        transitions: history.transitions.map((transition) => ({
          id: transition.id,
          certificateId: transition.certificateId,
          currentState: transition.currentState,
          previousState: transition.previousState,
          changedAt: Timestamp.fromDate(transition.changedAt),
          changedBy: transition.changedBy,
          comments: transition.comments,
          metadata: transition.metadata || {},
        })),
        updatedAt: Timestamp.fromDate(history.updatedAt),
      });
      return;
    }

    await setDoc(docRef, {
      certificateId,
      transitions: [
        {
          id: newState.id,
          certificateId: newState.certificateId,
          currentState: newState.currentState,
          previousState: newState.previousState,
          changedAt: Timestamp.fromDate(newState.changedAt),
          changedBy: newState.changedBy,
          comments: newState.comments,
          metadata: newState.metadata || {},
        },
      ],
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });
  }

  private getPendingStatesForRole(userRole: string): CertificateStateValue[] {
    const roleStates: Record<string, CertificateStateValue[]> = {
      coordinator: ['draft', 'verified', 'signed'],
      verifier: ['pending_review'],
      signer: ['pending_signature'],
      administrator: [
        'draft',
        'pending_review',
        'verified',
        'pending_signature',
        'signed',
        'cancelled',
      ],
    };

    return roleStates[userRole] || [];
  }

  private getVisibleStatesForRole(userRole: string): CertificateStateValue[] {
    const roleStates: Record<string, CertificateStateValue[]> = {
      coordinator: ['draft', 'verified', 'signed', 'issued', 'cancelled'],
      verifier: ['pending_review'],
      signer: ['pending_signature', 'signed'],
      administrator: [
        'draft',
        'pending_review',
        'verified',
        'pending_signature',
        'signed',
        'issued',
        'cancelled',
      ],
    };

    return roleStates[userRole] || [];
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'string' || typeof value === 'number') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private toStateValue(value: unknown): CertificateStateValue | null {
    if (
      value === 'draft' ||
      value === 'pending_review' ||
      value === 'verified' ||
      value === 'pending_signature' ||
      value === 'signed' ||
      value === 'issued' ||
      value === 'cancelled'
    ) {
      return value;
    }

    if (value === 'active') {
      return 'issued';
    }

    return null;
  }

  private mapCertificateToCurrentState(
    certificateId: string,
    data: Record<string, unknown>
  ): CertificateState | null {
    const currentState = this.toStateValue(data.status);
    if (!currentState) {
      return null;
    }

    const hasWorkflowSnapshot =
      Boolean(data.stateChangedAt) ||
      Boolean(data.stateChangedBy) ||
      Boolean(data.previousStatus) ||
      Boolean(data.lastStateComment);

    if (!hasWorkflowSnapshot && currentState === 'draft') {
      return null;
    }

    const changedAt =
      this.toDate(data.stateChangedAt) ||
      this.toDate(data.updatedAt) ||
      this.toDate(data.createdAt) ||
      new Date();

    const previousState = this.toStateValue(data.previousStatus);

    return {
      id: `current-${certificateId}`,
      certificateId,
      currentState,
      previousState: previousState || undefined,
      changedAt,
      changedBy:
        typeof data.stateChangedBy === 'string'
          ? data.stateChangedBy
          : typeof data.createdBy === 'string'
            ? data.createdBy
            : '',
      comments:
        typeof data.lastStateComment === 'string' ? data.lastStateComment : undefined,
      metadata: {
        folio: data.folio,
        studentName: data.studentName,
        academicProgram: data.academicProgram,
        pdfUrl: data.pdfUrl,
      },
    };
  }

  private mapToCertificateState = (item: { id: string; data: () => DocumentData | undefined }): CertificateState => {
    const data = item.data() || {};
    return {
      id: item.id,
      certificateId: data.certificateId || '',
      currentState: this.toStateValue(data.currentState) || 'draft',
      previousState: this.toStateValue(data.previousState) || undefined,
      changedAt: this.toDate(data.changedAt) || new Date(),
      changedBy: data.changedBy || '',
      comments: data.comments,
      metadata: data.metadata || {},
    };
  };

  private mapToStateHistory = (item: { data: () => DocumentData | undefined }): StateHistory => {
    const data = item.data() || {};
    return {
      certificateId: data.certificateId || '',
      transitions: (data.transitions || []).map((transition: Record<string, unknown>) => ({
        id: typeof transition.id === 'string' ? transition.id : '',
        certificateId:
          typeof transition.certificateId === 'string' ? transition.certificateId : '',
        currentState: this.toStateValue(transition.currentState) || 'draft',
        previousState: this.toStateValue(transition.previousState) || undefined,
        changedAt: this.toDate(transition.changedAt) || new Date(),
        changedBy: typeof transition.changedBy === 'string' ? transition.changedBy : '',
        comments:
          typeof transition.comments === 'string' ? transition.comments : undefined,
        metadata:
          transition.metadata && typeof transition.metadata === 'object'
            ? transition.metadata
            : undefined,
      })),
      createdAt: this.toDate(data.createdAt) || new Date(),
      updatedAt: this.toDate(data.updatedAt) || new Date(),
    };
  };
}
