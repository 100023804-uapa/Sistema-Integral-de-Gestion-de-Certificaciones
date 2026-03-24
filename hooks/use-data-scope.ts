"use client";

import { useAuth } from '@/lib/contexts/AuthContext';
import { ScopeType } from '@/lib/types/role';

export function useDataScope() {
    const { scope, userRoles, user } = useAuth();

    const isLegacyAdmin = userRoles.includes('admin') || userRoles.includes('administrator');

    /**
     * Verifica si un objeto de datos es accesible según el alcance del usuario.
     * Útil para filtrado en el lado del cliente o validaciones rápidas.
     */
    const canAccess = (entity: any) => {
        // Los administradores globales siempre tienen acceso
        if (isLegacyAdmin || scope.type === 'global') return true;

        // Filtrar por recinto
        if (scope.type === 'campus') {
            return scope.campusIds.includes(entity.campusId);
        }

        // Filtrar por área académica
        if (scope.type === 'area') {
            return scope.academicAreaIds.includes(entity.academicAreaId) ||
                scope.campusIds.includes(entity.campusId); // Un área está dentro de un recinto
        }

        // Filtrar por personal (creado por el usuario o asignado como firmante)
        if (scope.type === 'personal') {
            return entity.createdBy === user?.uid ||
                (entity.signerId && scope.signerIds.includes(entity.signerId));
        }

        return false;
    };

    /**
     * Genera una configuración de filtros para ser usada en repositorios o servicios.
     */
    const getQueryFilters = () => {
        if (isLegacyAdmin || scope.type === 'global') return {};

        return {
            scopeType: scope.type,
            campusIds: scope.campusIds,
            academicAreaIds: scope.academicAreaIds,
            signerIds: scope.signerIds,
            userId: user?.uid
        };
    };

    return {
        scope,
        isGlobal: isLegacyAdmin || scope.type === 'global',
        canAccess,
        getQueryFilters
    };
}
