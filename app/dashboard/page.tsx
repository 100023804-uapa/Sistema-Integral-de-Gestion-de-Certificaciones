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
  Bell,
  AlertCircle,
  Printer
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { QuickAction } from '@/components/dashboard/QuickAction';
import { ActivityList, ActivityItem } from '@/components/dashboard/ActivityList';
import { Avatar } from '@/components/ui/Avatar';
import { GetDashboardStats, DashboardStats } from '@/lib/application/use-cases/GetDashboardStats';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useDataScope } from '@/hooks/use-data-scope';
import { AnimatePresence } from 'framer-motion';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { scope, getQueryFilters } = useDataScope();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock notifications for now
  const notifications = [
    { id: 1, text: "Bienvenido al nuevo sistema SIGCE", time: "Hace 1 hora", unread: true },
    { id: 2, text: "Recuerda validar los certificados pendientes", time: "Hace 2 horas", unread: true },
    { id: 3, text: "Se ha registrado un nuevo programa académico", time: "Ayer", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      try {
        console.log("DashboardPage: Fetching stats with scope:", scope);
        const useCase = new GetDashboardStats();
        
        // Obtenemos los filtros formateados para el use case
        const filters = getQueryFilters();
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
  }, []);

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
    <div className="px-4 py-8 md:px-8 md:py-12 space-y-10" onClick={() => setShowNotifications(false)}>
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 md:gap-0">
        <div>
          <p className="text-gray-500 font-medium mb-1">Bienvenido de nuevo,</p>
          <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tighter">
            {user?.displayName || 'Usuario'}
          </h1>
        </div>
        <div className="flex items-center gap-4 relative" onClick={(e) => e.stopPropagation()}>
          <div className="relative">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-full shadow-sm border transition-colors ${showNotifications ? 'bg-accent text-white border-accent' : 'bg-white border-gray-100 text-gray-400 hover:text-accent'}`}
            >
                <Bell size={28} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                )}
            </button>

            <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-[-2.5rem] sm:right-0 top-full mt-2 w-[calc(100vw-3rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 text-lg">Notificaciones</h3>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{unreadCount} nuevas</span>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${notif.unread ? 'bg-blue-50/30' : ''}`}>
                                        <p className="text-base text-gray-600 font-medium leading-snug">{notif.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-400 text-sm">No tienes notificaciones</div>
                            )}
                        </div>
                        <div className="p-3 text-center border-t border-gray-50 bg-gray-50/50">
                            <button className="text-sm font-bold text-primary hover:underline">Marcar todas como leídas</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>

          <Avatar 
            src={user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100"} 
            fallback={user?.displayName?.charAt(0) || "U"} 
            status="online"
            className="h-16 w-16 border-2 border-accent/20 cursor-pointer"
            onClick={() => router.push('/dashboard/settings')}
          />
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
