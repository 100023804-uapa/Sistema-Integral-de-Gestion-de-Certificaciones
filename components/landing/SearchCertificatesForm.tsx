'use client';

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export function SearchCertificatesForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    // Redirect to verification page with query
    router.push(`/verify?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 h-5 w-5 pointer-events-none group-focus-within:text-[var(--color-accent)] transition-colors" />
          <Input 
            type="text" 
            placeholder="Folio o código de verificación" 
            className="pl-12 pr-64 h-14 rounded-2xl border-2 border-transparent bg-white/10 backdrop-blur-md text-white placeholder:text-blue-100/60 focus:bg-white focus:text-gray-900 focus:border-[var(--color-accent)] focus:ring-0 transition-all shadow-xl shadow-blue-900/10 text-lg w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="absolute right-2 top-2 bottom-2">
            <Button 
                type="submit" 
                disabled={loading}
                className="h-full rounded-xl px-6 font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed hidden sm:flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                  <>
                    <Search className="w-4 h-4" />
                    VALIDAR CERTIFICADO
                  </>
                )}
            </Button>
            {/* Mobile Icon Only Button */}
            <Button 
                type="submit" 
                disabled={loading}
                className="h-full rounded-xl font-bold px-4 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed sm:hidden flex items-center justify-center"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : <Search className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
