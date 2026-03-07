"use client";

import React, { useEffect, useState } from 'react';
import { getAccessRepository, getRoleRepository, type AccessRequest, type AccessUser } from '@/lib/container';
import { Role } from '@/lib/types/role';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, CheckCircle, XCircle, Shield, Clock, Trash2, Edit, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAlert } from '@/hooks/useAlert';

export default function UsersPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { showConfirm, showAlert } = useAlert();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [selectedUser, setSelectedUser] = useState<AccessUser | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedSignerId, setSelectedSignerId] = useState<string>('');

  const [campuses, setCampuses] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [signers, setSigners] = useState<any[]>([]);

  const accessRepo = getAccessRepository();
  const roleRepo = getRoleRepository();

  const loadData = async () => {
    try {
      setLoading(true);
      const [reqs, usrs, rls] = await Promise.all([
        accessRepo.listAccessRequests(),
        accessRepo.listAdmins(),
        roleRepo.findActive()
      ]);
      
      // Cargar catálogos para alcances
      const [campList, areaList, signList] = await Promise.all([
        fetch('/api/campuses').then(res => res.json()),
        fetch('/api/academic-areas').then(res => res.json()),
        fetch('/api/signers').then(res => res.json()),
      ]);

      setCampuses(campList.data || []);
      setAreas(areaList.data || []);
      setSigners(signList.data || []);
      
      setRequests(reqs);
      
      // Mapear los roles a cada usuario
      const usersWithRoles = await Promise.all(usrs.map(async (u) => {
         const userRoles = await roleRepo.getUserRoles(u.email); // Usamos email como ID temporal para compatibilidad
         const mainRole = userRoles.length > 0 ? rls.find(r => r.id === userRoles[0].roleId) : null;
         return { ...u, roleName: mainRole?.name || 'Administrador (Legacy)', roleId: mainRole?.id || 'admin' };
      }));

      setUsers(usersWithRoles);
      setRoles(rls);
      
      // Set default role in select
      if (rls.length > 0) setSelectedRoleId(rls[0].id);

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

  const openApprovalModal = (req: AccessRequest) => {
    setSelectedRequest(req);
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (usr: AccessUser) => {
    setSelectedUser(usr);
    setSelectedRequest(null);
    setSelectedRoleId((usr as any).roleId || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setSelectedUser(null);
  };

  const submitRoleAssignment = async () => {
    if (!user) return;
    setProcessingId('modal-action');
    
    try {
      const assignmentData = { 
          userId: selectedRequest?.email || selectedUser?.email || '', 
          roleId: selectedRoleId,
          campusId: selectedCampusId || undefined,
          academicAreaId: selectedAreaId || undefined,
          signerId: selectedSignerId || undefined
      };

      if (selectedRequest) {
          await accessRepo.approveRequest(selectedRequest.id, user.uid);
          await roleRepo.assignRole(assignmentData, user.uid);
          toast.success(`Acceso aprobado para ${selectedRequest.email}`);
      } else if (selectedUser) {
          await roleRepo.assignRole(assignmentData, user.uid);
          toast.success(`Rol actualizado para ${selectedUser.email}`);
      }
      
      closeModal();
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la asignación de rol");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: AccessRequest) => {
    const ok = await showConfirm(
      '¿Rechazar solicitud?',
      `¿Estás seguro de que deseas rechazar la solicitud de acceso para ${req.email}?`,
      { type: 'warning', confirmText: 'Sí, rechazar', cancelText: 'No, cancelar' }
    );
    if (!ok) return;
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

  const handleToggleStatus = async (usr: AccessUser) => {
    if (!user) return;
    if (usr.email === user.email) {
        toast.error("No puedes cambiar tu propio estado");
        return;
    }
    
    const actionDesc = usr.disabled ? 'HABILITAR' : 'DESHABILITAR';
    const ok = await showConfirm(
      `${actionDesc === 'HABILITAR' ? 'Habilitar' : 'Deshabilitar'} usuario`,
      `¿Estás seguro de que deseas ${actionDesc.toLowerCase()} a ${usr.email}?`,
      { type: 'warning', confirmText: `Sí, ${actionDesc.toLowerCase()}`, cancelText: 'Cancelar' }
    );
    if (!ok) return;
    
    setProcessingId(usr.email);
    try {
      if (usr.disabled) {
          await accessRepo.enableAdmin(usr.email);
          toast.success("Usuario habilitado");
      } else {
          await accessRepo.removeAdmin(usr.email);
          toast.success("Usuario deshabilitado");
      }
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(`Error al ${actionDesc.toLowerCase()}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 py-6 md:px-8 md:py-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
           <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Usuarios</h2>
           <p className="text-gray-500 mt-1">Administra los accesos y roles (RBAC) del sistema.</p>
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
                                <p className="text-gray-600 italic bg-gray-50 p-2 rounded border border-gray-100 mt-1 line-clamp-2">
                                    &ldquo;{req.reason}&rdquo;
                                </p>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    className="flex-1 bg-green-600 hover:bg-green-700" 
                                    size="sm"
                                    onClick={() => openApprovalModal(req)}
                                    disabled={!!processingId}
                                >
                                    {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                                    Evaluar
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100" 
                                    size="sm"
                                    onClick={() => handleReject(req)}
                                    disabled={!!processingId}
                                >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rechazar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}
      </section>

      {/* ACTIVE USERS */}
      <section className="space-y-4 pt-8 border-t border-gray-100">
        <h3 className="text-lg font-bold flex items-center gap-2 text-gray-700">
            <Shield className="w-5 h-5" /> Usuarios Activos
        </h3>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="bg-gray-50 text-gray-900 font-bold uppercase text-xs">
                    <tr>
                        <th className="px-6 py-4">Usuario (Email)</th>
                        <th className="px-6 py-4">Rol Asignado</th>
                        <th className="px-6 py-4">Estado</th>
                        <th className="px-6 py-4">Fecha Alta</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-gray-900">
                                {u.email}
                                {u.createdBy === user?.uid && <span className="ml-2 text-xs text-gray-400">(Tú)</span>}
                            </td>
                            <td className="px-6 py-4">
                                <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                                    (u as any).roleId === 'admin' ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
                                )}>
                                    <Shield className="w-3 h-3" /> {(u as any).roleName}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                {u.disabled ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                        <UserX className="w-3 h-3" /> Inactivo
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <UserCheck className="w-3 h-3" /> Activo
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-gray-500 hover:text-primary hover:bg-gray-100 mr-2"
                                    onClick={() => openEditModal(u)}
                                    disabled={!!processingId}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                {u.email !== user?.email && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className={u.disabled ? "text-green-500 hover:text-green-600 hover:bg-green-50" : "text-red-400 hover:text-red-600 hover:bg-red-50"}
                                        onClick={() => handleToggleStatus(u)}
                                        disabled={!!processingId}
                                        title={u.disabled ? "Habilitar usuario" : "Deshabilitar usuario"}
                                    >
                                        {u.disabled ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </section>

      {/* MODAL DE ASIGNACIÓN DE ROL */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
              <div className="bg-white p-8 rounded-3xl max-w-md w-full shadow-2xl">
                  <h3 className="text-2xl font-black text-gray-900 mb-2">
                      {selectedRequest ? 'Aprobar Solicitud' : 'Modificar Rol'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                      Selecciona el nivel de acceso para <strong className="text-gray-800">{selectedRequest?.email || selectedUser?.email}</strong>.
                  </p>
                  
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rol Principal</label>
                          <select 
                              value={selectedRoleId}
                              onChange={(e) => setSelectedRoleId(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 bg-gray-50/50 transition-all font-bold"
                          >
                              <option value="admin">Administrador (Total)</option>
                              {roles.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                          </select>
                      </div>

                      {/* SELECTORES DE ALCANCE DINÁMICOS */}
                      {selectedRoleId !== 'admin' && roles.find(r => r.id === selectedRoleId)?.scopeType === 'campus' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recinto Asignado</label>
                          <select 
                              value={selectedCampusId}
                              onChange={(e) => setSelectedCampusId(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 bg-blue-50/30 focus:border-blue-400 transition-all text-sm"
                          >
                              <option value="">Seleccionar Recinto...</option>
                              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      )}

                      {selectedRoleId !== 'admin' && roles.find(r => r.id === selectedRoleId)?.scopeType === 'area' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Área Académica</label>
                          <select 
                              value={selectedAreaId}
                              onChange={(e) => setSelectedAreaId(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 bg-purple-50/30 focus:border-purple-400 transition-all text-sm"
                          >
                              <option value="">Seleccionar Área...</option>
                              {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                        </div>
                      )}

                      {/* Siempre permitir asociar a un firmante si el rol tiene capacidad de firma */}
                      {roles.find(r => r.id === selectedRoleId)?.capabilities.includes('can_sign') && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Perfil de Firmante</label>
                          <select 
                              value={selectedSignerId}
                              onChange={(e) => setSelectedSignerId(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 bg-orange-50/30 focus:border-orange-400 transition-all text-sm"
                          >
                              <option value="">Seleccionar Firmante...</option>
                              {signers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.position})</option>)}
                          </select>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-3 mt-8">
                      <Button variant="outline" className="flex-1" onClick={closeModal} disabled={processingId === 'modal-action'}>
                          Cancelar
                      </Button>
                      <Button className="flex-1" onClick={submitRoleAssignment} disabled={processingId === 'modal-action'}>
                          {processingId === 'modal-action' ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
                          Confirmar
                      </Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
