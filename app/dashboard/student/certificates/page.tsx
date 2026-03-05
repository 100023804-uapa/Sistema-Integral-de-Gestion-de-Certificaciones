"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Filter, 
  Calendar, 
  Download, 
  Eye, 
  Search,
  ChevronDown,
  User,
  MapPin,
  BookOpen,
  Clock
} from 'lucide-react';

// Importar desde el container original que sí funciona
import { getListCampusesUseCase, getListAcademicAreasUseCase, getListCertificateTypesUseCase } from '@/lib/container';
const mockCertificates = [
  {
    id: '1',
    folio: 'SIGCE-2024-001',
    programName: 'Diplomado en Desarrollo Web',
    academicAreaName: 'Tecnología',
    campusName: 'Santo Domingo',
    certificateTypeName: 'CAP',
    issueDate: new Date('2024-01-15'),
    expirationDate: new Date('2025-01-15'),
    status: 'disponible',
    qrCodeUrl: '/qr/certificate-1.png',
    pdfUrl: '/certificates/certificate-1.pdf',
    verificationUrl: '/verify/SIGCE-2024-001'
  },
  {
    id: '2',
    folio: 'SIGCE-2024-002',
    programName: 'Certificación en Marketing Digital',
    academicAreaName: 'Negocios',
    campusName: 'Santiago',
    certificateTypeName: 'DIP',
    issueDate: new Date('2024-02-20'),
    expirationDate: new Date('2025-02-20'),
    status: 'disponible',
    qrCodeUrl: '/qr/certificate-2.png',
    pdfUrl: '/certificates/certificate-2.pdf',
    verificationUrl: '/verify/SIGCE-2024-002'
  },
  {
    id: '3',
    folio: 'SIGCE-2024-003',
    programName: 'Técnico en Base de Datos',
    academicAreaName: 'Tecnología',
    campusName: 'Santo Domingo',
    certificateTypeName: 'TEC',
    issueDate: new Date('2024-03-10'),
    expirationDate: new Date('2025-03-10'),
    status: 'borrador',
    qrCodeUrl: '/qr/certificate-3.png',
    pdfUrl: '/certificates/certificate-3.pdf',
    verificationUrl: '/verify/SIGCE-2024-003'
  }
];

const statusColors = {
  disponible: 'bg-green-100 text-green-800 border-green-200',
  borrador: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  espera_verificacion: 'bg-blue-100 text-blue-800 border-blue-200',
  espera_firma: 'bg-purple-100 text-purple-800 border-purple-200',
  firmado: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  emitido: 'bg-gray-100 text-gray-800 border-gray-200',
  rechazado: 'bg-red-100 text-red-800 border-red-200',
  bloqueado_pago: 'bg-orange-100 text-orange-800 border-orange-200',
  bloqueado_documentacion: 'bg-orange-100 text-orange-800 border-orange-200',
  bloqueado_administrativo: 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  disponible: 'Disponible',
  borrador: 'Borrador',
  espera_verificacion: 'Espera Verificación',
  espera_firma: 'Espera Firma',
  firmado: 'Firmado',
  emitido: 'Emitido',
  rechazado: 'Rechazado',
  bloqueado_pago: 'Bloqueado por Pago',
  bloqueado_documentacion: 'Bloqueado por Documentación',
  bloqueado_administrativo: 'Bloqueado Administrativo'
};

export default function StudentCertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState(mockCertificates);
  const [filteredCertificates, setFilteredCertificates] = useState(mockCertificates);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock de áreas y recintos - esto vendrá de APIs
  const areas = ['Tecnología', 'Negocios', 'Salud', 'Educación'];
  const campuses = ['Santo Domingo', 'Santiago', 'Puerto Plata', 'La Romana'];
  const statuses = Object.keys(statusLabels);

  useEffect(() => {
    // Filtrar certificados
    let filtered = certificates.filter(cert => {
      const matchesSearch = cert.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.programName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !selectedStatus || cert.status === selectedStatus;
      const matchesArea = !selectedArea || cert.academicAreaName === selectedArea;
      const matchesCampus = !selectedCampus || cert.campusName === selectedCampus;
      
      return matchesSearch && matchesStatus && matchesArea && matchesCampus;
    });
    
    setFilteredCertificates(filtered);
  }, [certificates, searchTerm, selectedStatus, selectedArea, selectedCampus]);

  const handleViewCertificate = (certificate: any) => {
    // Aquí iríamos a la página de detalles
    console.log('Ver certificado:', certificate);
  };

  const handleDownloadCertificate = (certificate: any) => {
    // Aquí iríamos a la descarga
    console.log('Descargar certificado:', certificate);
  };

  const handleVerifyCertificate = (certificate: any) => {
    // Abrir URL de verificación en nueva pestaña
    window.open(certificate.verificationUrl, '_blank');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setSelectedArea('');
    setSelectedCampus('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Mis Certificados</h1>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {filteredCertificates.length} certificados
              </span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros de Búsqueda
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Búsqueda por Folio o Programa
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ej: SIGCE-2024-001 o Desarrollo Web"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Filtro por Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los estados</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {statusLabels[status as keyof typeof statusLabels]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Área */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-2" />
                    Área Académica
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las áreas</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro por Recinto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Recinto
                  </label>
                  <select
                    value={selectedCampus}
                    onChange={(e) => setSelectedCampus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los recintos</option>
                    {campuses.map(campus => (
                      <option key={campus} value={campus}>{campus}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botón de limpiar filtros */}
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Lista de Certificados */}
        {filteredCertificates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron certificados</h3>
            <p className="text-gray-500">
              No hay certificados que coincidan con los filtros seleccionados.
              Intenta ajustar los filtros o verifica tu historial.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <motion.div
                key={certificate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header del certificado */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {certificate.programName}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {certificate.academicAreaName}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {certificate.campusName}
                        </span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[certificate.status as keyof typeof statusColors]}`}>
                      {statusLabels[certificate.status as keyof typeof statusLabels]}
                    </div>
                  </div>
                </div>

                {/* Contenido del certificado */}
                <div className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <FileText className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Folio:</span>
                      <span className="font-medium text-gray-900 ml-1">{certificate.folio}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Emisión:</span>
                      <span className="font-medium text-gray-900 ml-1">
                        {certificate.issueDate.toLocaleDateString()}
                      </span>
                    </div>

                    {certificate.expirationDate && (
                      <div className="flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-600">Vencimiento:</span>
                        <span className="font-medium text-gray-900 ml-1">
                          {certificate.expirationDate.toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="px-6 pb-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewCertificate(certificate)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </button>
                    
                    {certificate.status === 'disponible' && (
                      <button
                        onClick={() => handleDownloadCertificate(certificate)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleVerifyCertificate(certificate)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Verificar
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
