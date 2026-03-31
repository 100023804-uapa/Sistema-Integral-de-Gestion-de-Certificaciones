import { FirebaseSystemSettingsRepository } from './infrastructure/repositories/FirebaseSystemSettingsRepository';
import { FirebaseAccessRepository } from './infrastructure/repositories/FirebaseAccessRepository';
import { NodemailerEmailService } from './infrastructure/services/NodemailerEmailService';

// Contenedor exclusivo para servicios backend (Node.js)
// NUNCA IMPORTAR ESTO EN ARCHIVOS "use client"

let settingsRepository: FirebaseSystemSettingsRepository | null = null;
let accessRepository: FirebaseAccessRepository | null = null;
let emailService: NodemailerEmailService | null = null;

export function getServerSystemSettingsRepository() {
    if (!settingsRepository) {
        settingsRepository = new FirebaseSystemSettingsRepository();
    }
    return settingsRepository;
}

export function getServerAccessRepository() {
    if (!accessRepository) {
        accessRepository = new FirebaseAccessRepository();
    }
    return accessRepository;
}

export function getServerEmailService() {
    if (!emailService) {
        emailService = new NodemailerEmailService(getServerSystemSettingsRepository());
    }
    return emailService;
}
