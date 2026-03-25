"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  PlusCircle, 
  QrCode, 
  BarChart3, 
  Users, 
  AlertCircle
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickAction } from '@/components/dashboard/QuickAction';
import { ActivityList } from '@/components/dashboard/ActivityList';
import { GetDashboardStats, DashboardStats } from '@/lib/application/use-cases/GetDashboardStats';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useDataScope } from '@/hooks/use-data-scope';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { scope } = useDataScope();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        console.log("DashboardPage: Fetching stats with scope:", scope);
        const useCase = new GetDashboardStats();
        
        const data = await useCase.execute({
            type: scope.type,
            campusIds: scope.campusIds,
            academicAreaIds: scope.academicAreaIds,
            signerIds: scope.signerIds,
            userId: user?.uid
        });
        if (isMounted) {
            console.log("DashboardPage: Stats received", data);
            setStats(data);
            setLoading(false);
        }
      } catch (error) {
        console.error("DashboardPage: Error fetching stats", error);
        if (isMounted) {
            setLoading(false); // Deja de cargar aunque falle
        }
      }
    };

    fetchStats();

    // Timeout de seguridad para datos
    const timeout = setTimeout(() => {
        if (isMounted && loading) {
            console.warn("DashboardPage: Timeout loading stats. Showing empty.");
            setLoading(false);
        }
    }, 5000);

    return () => { isMounted = false; clearTimeout(timeout); };
  }, [
    scope.type,
    scope.campusIds.join(','),
    scope.academicAreaIds.join(','),
    scope.signerIds.join(','),
    user?.uid,
  ]);

  if (loading) {
    return (
      <LoadingScreen
        title="Cargando dashboard"
        description="Estamos reuniendo tus indicadores, actividad reciente y accesos rápidos."
        fullScreen={false}
      />
    );
  }

  return (
    <div className="space-y-10 px-4 py-8 md:px-8 md:py-12">
      
      {/* Header Section */}
      <div>
        <div>
          <p className="text-gray-500 font-medium mb-1">Bienvenido de nuevo,</p>
          <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter">
            {user?.displayName || 'Usuario'}
          </h1>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatsCard 
            variant="primary"
            title="Certificados Emitidos"
            value={stats?.totalIssued.toLocaleString() || '0'}
            icon={CheckCircle}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatsCard 
            title="Pendientes (Firma/Rev.)"
            value={stats?.pendingValidation || '0'}
            icon={FileText}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatsCard 
            title="Programas Activos"
            value={stats?.activePrograms || '0'}
            icon={BarChart3}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatsCard 
            title="Bloqueados / Revocados"
            value={stats?.blockedCertificates || '0'}
            icon={AlertCircle}
          />
        </motion.div>
      </div>

      {/* Progress Bars for Macro Analysis */}
      {stats && (stats.totalIssued > 0 || stats.blockedCertificates > 0) && (
        <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">
            Distribución por Tipo de Programa
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                <span>Certificado de Aprobación (CAP)</span>
                <span>{stats.byType?.CAP || 0}</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${(stats.byType?.CAP || 0) / Math.max(1, (stats.byType?.CAP || 0) + (stats.byType?.PROFUNDO || 0)) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm font-bold text-gray-700 mb-1">
                <span>Diplomado Avanzado (PROFUNDO)</span>
                <span>{stats.byType?.PROFUNDO || 0}</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent" 
                  style={{ width: `${(stats.byType?.PROFUNDO || 0) / Math.max(1, (stats.byType?.CAP || 0) + (stats.byType?.PROFUNDO || 0)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="space-y-6">
        <h2 className="text-xl font-black text-primary uppercase tracking-wider italic">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <QuickAction 
            label="Nuevo Certificado" 
            icon={PlusCircle} 
            onClick={() => router.push('/dashboard/certificates/create')}
          />
          <QuickAction 
            label="Validar QR" 
            icon={QrCode} 
            onClick={() => router.push('/dashboard/validate')}
          />
          <QuickAction 
            label="Ver Reportes" 
            icon={BarChart3} 
            onClick={() => router.push('/dashboard/reports')}
          />
          <QuickAction 
            label="Gestión Usuarios" 
            icon={Users} 
            onClick={() => router.push('/dashboard/users')}
          />

        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-6 pb-12">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-xl font-black text-primary uppercase tracking-wider italic">
            Actividad Reciente
          </h2>
          <button
            onClick={() => router.push('/dashboard/certificates')}
            className="text-[var(--color-accent)] font-bold hover:underline"
          >
            Ver todo
          </button>
        </div>
        
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {/* Convert generic activity to ActivityItem if needed or ensure interface match */}
            <ActivityList
              viewAllHref="/dashboard/certificates"
              activities={stats.recentActivity.map(activity => ({
                ...activity,
                type: activity.type as 'success' | 'warning' | 'info' | 'error',
                icon: activity.type === 'success' ? CheckCircle : 
                      activity.type === 'warning' ? AlertCircle : 
                      FileText,
                href: activity.href,
            }))} />
          </motion.div>
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-gray-200">
             <p className="text-gray-400">No hay actividad reciente registrada.</p>
          </div>
        )}
      </section>

    </div>
  );
}
