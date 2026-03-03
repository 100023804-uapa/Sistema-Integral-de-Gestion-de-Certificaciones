"use client";

import React, { useEffect, useState } from 'react';
import { getAccessRepository, type AccessRequest, type AccessUser } from '@/lib/container';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, XCircle, UserCheck, Shield, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UsersPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [admins, setAdmins] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const accessRepo = getAccessRepository();

  const loadData = async () => {
    try {
      const [reqs, usrs] = await Promise.all([
        accessRepo.listAccessRequests(),
        accessRepo.listAdmins()
      ]);
      setRequests(reqs);
      setAdmins(usrs);
    } catch (error) {
      console.error("Error loading users data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (req: AccessRequest) => {
    if (!user) return;
    setProcessingId(req.id);
    try {
      await accessRepo.approveRequest(req.id, user.uid);
      toast.success(`Acceso aprobado para ${req.email}`);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al aprobar");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: AccessRequest) => {
    if(!confirm('¿Estás seguro de rechazar esta solicitud?')) return;
    setProcessingId(req.id);
    try {
      await accessRepo.rejectRequest(req.id);
      toast.info(`Solicitud rechazada`);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al rechazar");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteAdmin = async (admin: AccessUser) => {
    if(!confirm(`¿Eliminar acceso administrativo a ${admin.email}?`)) return;
    setProcessingId(admin.email); // using email as ID for local processing state
    try {
      await accessRepo.removeAdmin(admin.email);
      toast.success("Administrador eliminado");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending' && r.status !== undefined); // Simple filter

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h2>
           <p className="text-gray-500 mt-1">Administra los accesos y roles del sistema.</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
            Actualizar
        </Button>
      </div>

      {/* PENDING REQUESTS */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 text-primary">
            <Clock className="w-5 h-5" /> Solicitudes Pendientes
            {pendingRequests.length > 0 && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
            )}
        </h3>
        
        {pendingRequests.length === 0 ? (
            <Card className="bg-gray-50 border-dashed border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <CheckCircle className="w-8 h-8 mb-2 opacity-50" />
                    <p>No hay solicitudes pendientes</p>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map(req => (
                    <Card key={req.id} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-gray-800 flex justify-between items-start">
                                {req.name}
                                <span className="text-[10px] font-normal px-2 py-1 bg-orange-100 text-orange-700 rounded-full uppercase">Pendiente</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Email</p>
                                <p className="font-medium text-gray-900">{req.email}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold uppercase">Motivo</p>
                                <p className="text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                                    "{req.reason}"
                                </p>
                            </div>
                            <div className="text-xs text-gray-400 text-right">
                                {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Fecha desconocida'}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    className="flex-1 bg-green-600 hover:bg-green-700" 
                                    size="sm"
                                    onClick={() => handleApprove(req)}
                                    disabled={!!processingId}
                                >
                                    {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                    Aprobar
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100" 
                                    size="sm"
                                    onClick={() => handleReject(req)}
                                    disabled={!!processingId}
                                >
                                    {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                                    Rechazar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </section>

      {/* ACTIVE ADMINS */}
      <section className="space-y-4 pt-8 border-t border-gray-100">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700">
            <Shield className="w-5 h-5" /> Administradores Activos
        </h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Usuario</th>
                        <th className="px-6 py-4">Rol</th>
                        <th className="px-6 py-4">Fecha Alta</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {admins.map((admin) => (
                        <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {admin.email}
                                {admin.createdBy === user?.uid && <span className="ml-2 text-xs text-gray-400">(Tú)</span>}
                            </td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Shield className="w-3 h-3" /> Admin
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                {admin.email !== user?.email && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteAdmin(admin)}
                                        disabled={!!processingId}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                    {admins.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 bg-gray-50/30">
                                No se encontraron administradores (Esto es inusual)
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </section>

      {/* REQUEST HISTORY (OPTIONAL/COLLAPSED) */}
      {historyRequests.length > 0 && (
         <div className="pt-8">
            <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-gray-500 hover:text-gray-700 select-none">
                    <Clock className="w-4 h-4" /> Ver Historial de Solicitudes ({historyRequests.length})
                </summary>
                <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-500 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="pb-2">Email</th>
                                <th className="pb-2">Nombre</th>
                                <th className="pb-2">Estado</th>
                                <th className="pb-2">Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historyRequests.map(req => (
                                <tr key={req.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-100">
                                    <td className="py-2">{req.email}</td>
                                    <td className="py-2">{req.name}</td>
                                    <td className="py-2">
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded-full uppercase font-medium",
                                            req.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                        )}>
                                            {req.status === 'approved' ? 'Aprobado' : 'Rechazado'}
                                        </span>
                                    </td>
                                    <td className="py-2">{req.updatedAt ? new Date(req.updatedAt).toLocaleDateString() : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
         </div>
      )}
    </div>
  );
}
