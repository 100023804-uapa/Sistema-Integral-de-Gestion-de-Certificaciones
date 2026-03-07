"use client";

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  code: string;
}

interface ProgramComboboxProps {
  programs: Program[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function ProgramCombobox({ programs, value, onChange, className = '', placeholder = "Ej. Diplomado en Gestión de Proyectos" }: ProgramComboboxProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) || 
    p.code.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (program: Program) => {
    onChange(program.name);
    setQuery(program.name);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          required={!placeholder.includes("opcional")} // Si dice opcional, no es required
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
        />
      </div>

      {isOpen && programs.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredPrograms.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No se encontraron programas
            </div>
          ) : (
            <ul className="py-1">
              {filteredPrograms.map((program) => (
                <li
                  key={program.id}
                  onClick={() => handleSelect(program)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <p className="font-medium text-gray-900">{program.name}</p>
                  <p className="text-xs text-gray-500">Código: {program.code}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
