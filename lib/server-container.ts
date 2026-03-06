import { FirebaseSystemSettingsRepository } from './infrastructure/repositories/FirebaseSystemSettingsRepository';
import { NodemailerEmailService } from './infrastructure/services/NodemailerEmailService';

// Contenedor exclusivo para servicios backend (Node.js)
// NUNCA IMPORTAR ESTO EN ARCHIVOS "use client"

let settingsRepository: FirebaseSystemSettingsRepository | null = null;
let emailService: NodemailerEmailService | null = null;

export function getServerSystemSettingsRepository() {
    if (!settingsRepository) {
        settingsRepository = new FirebaseSystemSettingsRepository();
    }
    return settingsRepository;
}

export function getServerEmailService() {
    if (!emailService) {
        emailService = new NodemailerEmailService(getServerSystemSettingsRepository());
    }
    return emailService;
}
