'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Loader2, X } from 'lucide-react';
import { UploadDropzone } from '@/lib/uploadthing';
import { updateStudentProfilePicture } from '@/app/actions/student-profile';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  fullName: string;
  profilePictureUrl?: string;
  className?: string;
  readonly?: boolean;
}

export function ProfileAvatar({ fullName, profilePictureUrl, className, readonly = false }: ProfileAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleUploadComplete = async (res: any) => {
    if (res && res.length > 0) {
      const url = res[0].url;
      setIsUpdating(true);
      try {
        const result = await updateStudentProfilePicture(url);
        if (result.success) {
          setIsOpen(false);
        } else {
          alert('Hubo un error al actualizar la imagen.');
        }
      } catch (e) {
        console.error(e);
        alert('Hubo un error de red al procesar tu solicitud.');
      } finally {
        setIsUpdating(false);
      }
    }
  };

  return (
    <>
      <button
        onClick={() => !readonly && setIsOpen(true)}
        disabled={isUpdating || readonly}
        className={cn(
          "group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-blue-100 text-blue-700 shadow-sm focus:outline-none",
          !readonly && "transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2",
          className
        )}
      >
        {profilePictureUrl ? (
          <Image
            src={profilePictureUrl}
            alt={fullName}
            fill
            className="object-cover"
          />
        ) : (
          <span className="font-bold tracking-tight" style={{ fontSize: 'max(1.25rem, 33%)' }}>
            {getInitials(fullName)}
          </span>
        )}
        
        {!readonly && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            {isUpdating ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 relative pointer-events-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold">Actualizar foto de perfil</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <UploadDropzone
                endpoint="imageUploader"
                appearance={{
                  container: "border-2 border-dashed border-gray-200 bg-gray-50/50 w-full hover:border-primary hover:bg-gray-50 transition-all rounded-xl",
                  label: "text-primary hover:text-primary/80 font-semibold",
                  button: "bg-primary text-white hover:bg-primary/90 px-6 py-2 h-auto text-sm font-medium w-max shadow-sm rounded-lg transition-all focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 ut-uploading:opacity-70",
                  allowedContent: "hidden",
                }}
                content={{
                  uploadIcon: <Camera className="mb-2 h-10 w-10 text-gray-400" />,
                  label: 'Haz clic o arrastra tu foto',
                }}
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
              <p className="mt-4 text-center text-xs text-gray-500">
                Formatos: JPG, PNG o WebP. Máx. 4MB.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
