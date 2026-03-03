'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, GraduationCap, Award, Search, BookOpen, AlertCircle } from 'lucide-react';
import { getCertificateRepository, type ProgramStat } from '@/lib/container';

interface ProgramCardData {
    name: string;
    count: number;
    lastIssued: Date | null;
    type: string;
}

export default function ProgramsPage() {
    const certRepo = getCertificateRepository();
    const [loading, setLoading] = useState(true);
    const [programs, setPrograms] = useState<ProgramCardData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        void loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            setLoading(true);

            const stats = await certRepo.getProgramStats(100);
            if (stats.length > 0) {
                setPrograms(stats.map(toCardData));
                return;
            }

            // Backward-compatible fallback: aggregate from recent certificates only.
            const recent = await certRepo.list(500);
            const map = new Map<string, ProgramCardData>();

            recent.forEach((cert) => {
                const key = cert.academicProgram?.trim();
                if (!key) return;

                if (!map.has(key)) {
                    map.set(key, {
                        name: key,
                        count: 0,
                        lastIssued: cert.issueDate,
                        type: cert.type,
                    });
                }

                const current = map.get(key)!;
                current.count += 1;
                if (!current.lastIssued || cert.issueDate > current.lastIssued) {
                    current.lastIssued = cert.issueDate;
                }
            });

            const fallback = Array.from(map.values()).sort((a, b) => b.count - a.count);
            setPrograms(fallback);
        } catch (error) {
            console.error('Error loading programs:', error);
            setPrograms([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredPrograms = programs.filter((program) =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="px-4 py-8 md:px-8 md:py-12 space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-primary tracking-tighter flex items-center gap-3">
                    <BookOpen className="w-8 h-8" />
                    Programas Academicos
                </h1>
                <p className="text-gray-500 mt-2">
                    Vista general de los programas con emision registrada.
                </p>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 max-w-md">
                <Search className="text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar programa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
                />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center h-64">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="text-gray-500">Analizando programas...</p>
                </div>
            ) : filteredPrograms.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="bg-gray-50 p-6 rounded-full inline-block mb-4">
                        <AlertCircle className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">No se encontraron programas</h3>
                    <p className="text-gray-500 mt-1">Intenta emitir un certificado para registrar un nuevo programa.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPrograms.map((program) => (
                        <div key={program.name} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/20 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <GraduationCap size={100} />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl ${
                                        program.type === 'PROFUNDO' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        <Award size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                        {program.type}
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-800 text-lg mb-2 leading-tight">
                                    {program.name}
                                </h3>

                                <div className="mt-6 text-sm">
                                    <span className="text-gray-400 text-xs font-medium uppercase">Certificados</span>
                                    <div className="font-black text-2xl text-primary">{program.count}</div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-400">
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                    Ultima emision: {program.lastIssued ? program.lastIssued.toLocaleDateString() : 'N/A'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function toCardData(stat: ProgramStat): ProgramCardData {
    return {
        name: stat.name,
        count: stat.certificateCount,
        lastIssued: stat.lastIssued,
        type: stat.type || 'CAP',
    };
}
