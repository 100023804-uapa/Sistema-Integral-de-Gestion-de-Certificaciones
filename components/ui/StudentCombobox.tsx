"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Student } from '@/lib/domain/entities/Student';

interface StudentComboboxProps {
  onSelect: (student: Student) => void;
  className?: string;
}

export function StudentCombobox({ onSelect, className = '' }: StudentComboboxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Student[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/admin/students/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data);
        }
      } catch (error) {
        console.error('Error searching students:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(debounceFn);
  }, [query]);

  const handleSelect = (student: Student) => {
    onSelect(student);
    setQuery('');
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
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
          placeholder="Buscar participante por nombre, matrícula o cédula..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-white"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={18} />
        )}
      </div>

      {isOpen && (query.length >= 2) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No se encontraron resultados
            </div>
          ) : (
            <ul className="py-1">
              {results.map((student) => (
                <li
                  key={student.id}
                  onClick={() => handleSelect(student)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-50 last:border-0"
                >
                  <p className="font-medium text-gray-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-xs text-gray-500 flex gap-2 mt-0.5">
                    <span>Matrícula: {student.id}</span>
                    {student.cedula && <span>• Cédula: {student.cedula}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
