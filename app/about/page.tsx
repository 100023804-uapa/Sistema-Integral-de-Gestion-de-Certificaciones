import Link from 'next/link';
import { Metadata } from 'next';
import { ArrowLeft, Linkedin, Mail, Twitter } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sobre Nosotros - SIGCE',
  description: 'Conoce al equipo de participantes de la pasantía febrero-abril 2026 detrás de SIGCE.',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 md:py-24">

        {/* Intro Section */}
        <div className="max-w-3xl mx-auto text-center mb-20 space-y-6">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Conoce a nuestro equipo
          </h2>
          <p className="text-xl text-gray-500 leading-relaxed">
            Este es un trabajo realizado por los siguientes participantes para la pasantía febrero-abril 2026.
          </p>
        </div>

        {/* Maestro / Facilitador Section */}
        <div className="max-w-md mx-auto mb-16 text-center">
          <div className="relative mb-6">
            <div className="w-56 h-56 mx-auto rounded-full overflow-hidden border-4 border-accent shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=400&h=400&fit=crop"
                alt="Facilitador"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Facilitador
            </div>
          </div>

          <h3 className="text-2xl font-black text-gray-900 mb-2">
            Ing. Juan Pérez
          </h3>

          <p className="text-gray-500 font-medium">
            Maestro Guía & Mentor del Proyecto
          </p>

          <p className="text-sm text-gray-400 mt-2 italic">
            “Guiando a la próxima generación de innovadores tecnológicos.”
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Array.from({ length: 13 }).map((_, index) => {

            const baseMembers = [
              {
                name: "Ana García",
                role: "Fundadora & CEO",
                description: "Líder visionaria con experiencia en educación tecnológica.",
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=400&h=400&fit=crop",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  email: "ana@sigce.edu.do"
                }
              },
              {
                name: "Carlos Rodríguez",
                role: "Director de Tecnología",
                description: "Arquitecto de software experto en sistemas escalables.",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&h=400&fit=crop",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  email: "carlos@sigce.edu.do"
                }
              },
              {
                name: "Elena Martínez",
                role: "Directora de Operaciones",
                description: "Experta en optimización de procesos y gestión.",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&h=400&fit=crop",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  email: "elena@sigce.edu.do"
                }
              },
              {
                name: "David López",
                role: "Lead Developer",
                description: "Desarrollador Full Stack apasionado.",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=400&h=400&fit=crop",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  email: "david@sigce.edu.do"
                }
              },
              {
                name: "Laura Sánchez",
                role: "UX Researcher",
                description: "Especialista en experiencia de usuario.",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&h=400&fit=crop",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  email: "laura@sigce.edu.do"
                }
              },
              {
                name: "Miguel Ángel",
                role: "Backend Dev",
                description: "Experto en bases de datos y APIs.",
                image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&h=400&fit=crop",
                social: {
                  linkedin: "#",
                  twitter: "#",
                  email: "miguel@sigce.edu.do"
                }
              }
            ];

            const member = baseMembers[index % baseMembers.length]; //Repeat items

            return (
              <div key={index} className="group flex flex-col items-center text-center">

                <div className="relative mb-6">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-gray-100 group-hover:border-primary/20 transition-all duration-300 shadow-sm group-hover:shadow-xl">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {member.name}
                </h3>

                <span className="text-xs font-bold uppercase tracking-wider text-accent mb-4">
                  {member.role}
                </span>

                <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                  {member.description}
                </p>

              </div>
            );
          })}
        </div>

        {/* Values / Mission (Optional filler) */}
        <div className="mt-32 grid md:grid-cols-3 gap-12 text-center border-t border-gray-100 pt-20">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Innovación Constante</h3>
            <p className="text-sm text-gray-500">Nunca dejamos de buscar formas de mejorar y simplificar.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Transparencia Total</h3>
            <p className="text-sm text-gray-500">Creemos en la honestidad y claridad en todo lo que hacemos.</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Usuario al Centro</h3>
            <p className="text-sm text-gray-500">Cada decisión se toma pensando en la experiencia de nuestros usuarios.</p>
          </div>
        </div>

      </main>

      <Footer />

    </div>
  );
}