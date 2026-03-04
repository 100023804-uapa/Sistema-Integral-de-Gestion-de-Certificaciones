'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getTemplateRepository } from '@/lib/container';
import { CreateTemplateDTO } from '@/lib/domain/entities/Template';
import { Navbar } from '@/components/layout/Navbar';

export default function SeedTemplatePage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSeed = async () => {
        setLoading(true);
        setMessage('');
        try {
            const repo = getTemplateRepository();
            const width = 297; // A4 Landscape mm
            const height = 210;
            const centerX = width / 2;

            const defaultTemplate: CreateTemplateDTO = {
                name: 'Plantilla Institucional (Predeterminada)',
                backgroundImageUrl: '', // No background for now, or use a white one
                width,
                height,
                elements: [
                    // Logo Image
                    {
                        id: 'logo-1',
                        type: 'image',
                        content: '/logo de la uapa.jpeg', // Needs to be accessible
                        position: { x: centerX - 20, y: 20 },
                        style: { width: 40, height: 40 }
                    },
                    // Title
                    {
                        id: 'title-1',
                        type: 'text',
                        content: 'CERTIFICADO DE RECONOCIMIENTO',
                        position: { x: centerX, y: 70 },
                        style: { fontSize: 30, fontFamily: 'helvetica', align: 'center', color: '#000000' } // Bold handled by jspdf font style usually, but here font family string
                    },
                    // Intro
                    {
                        id: 'text-1',
                        type: 'text',
                        content: 'Se otorga el presente a:',
                        position: { x: centerX, y: 90 },
                        style: { fontSize: 16, fontFamily: 'helvetica', align: 'center', color: '#000000' }
                    },
                    // Student Name
                    {
                        id: 'var-student',
                        type: 'variable',
                        content: '{{studentName}}',
                        position: { x: centerX, y: 110 },
                        style: { fontSize: 40, fontFamily: 'times', align: 'center', color: '#000000' }
                    },
                    // Body
                    {
                        id: 'text-2',
                        type: 'text',
                        content: 'Por haber concluido satisfactoriamente el programa:',
                        position: { x: centerX, y: 130 },
                        style: { fontSize: 16, fontFamily: 'helvetica', align: 'center', color: '#000000' }
                    },
                    // Program
                    {
                        id: 'var-program',
                        type: 'variable',
                        content: '{{academicProgram}}',
                        position: { x: centerX, y: 145 },
                        style: { fontSize: 22, fontFamily: 'helvetica', align: 'center', color: '#000000' } // Bold?
                    },
                    // Date
                    {
                        id: 'var-date',
                        type: 'variable',
                        content: 'Fecha de emisión: {{issueDate}}',
                        position: { x: centerX, y: 160 },
                        style: { fontSize: 12, fontFamily: 'helvetica', align: 'center', color: '#000000' }
                    },
                    // Folio
                    {
                        id: 'var-folio',
                        type: 'variable',
                        content: 'Folio: {{folio}}',
                        position: { x: centerX, y: 166 },
                        style: { fontSize: 12, fontFamily: 'helvetica', align: 'center', color: '#000000' }
                    },
                    // QR
                    {
                        id: 'qr-1',
                        type: 'qr',
                        content: '', // Auto
                        position: { x: width - 40, y: height - 40 },
                        style: { width: 30, height: 30 }
                    }
                ]
            };

            await repo.save(defaultTemplate);
            setMessage('Plantilla creada exitosamente. Verifica la lista de plantillas.');
        } catch (e: any) {
            console.error(e);
            setMessage('Error al crear plantilla: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
                    <h1 className="text-2xl font-bold mb-4">Inicializar Plantillas</h1>
                    <p className="text-gray-600 mb-6">Crea la plantilla base &quot;Predeterminada&quot; en la base de datos para que sea editable.</p>
                    
                    {message && (
                        <div className={`p-4 rounded-lg mb-4 text-sm font-medium ${message.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {message}
                        </div>
                    )}

                    <Button onClick={handleSeed} disabled={loading} className="w-full">
                        {loading ? 'Procesando...' : 'Generar Plantilla Base'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
