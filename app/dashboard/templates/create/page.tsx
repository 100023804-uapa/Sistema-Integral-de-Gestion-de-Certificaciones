"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Type, QrCode, Save, Move, X, Monitor, Smartphone, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { getTemplateRepository } from '@/lib/container';
import { CreateTemplateDTO, TemplateElement, TemplateElementType } from '@/lib/domain/entities/Template';
import { useUploadThing } from '@/lib/uploadthing';

const VARIABLES = [
    { label: 'Nombre Estudiante', value: 'studentName' },
    { label: 'Programa Académico', value: 'academicProgram' },
    { label: 'ID Estudiante', value: 'studentId' },
    { label: 'Folio', value: 'folio' },
    { label: 'Fecha Emisión', value: 'issueDate' },
    { label: 'Fecha Expiración', value: 'expirationDate' },
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const repository = getTemplateRepository();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [elements, setElements] = useState<TemplateElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [dragOver, setDragOver] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res: any) => {
        setLoading(false);
        setUploadingSignature(false);
        // We will handle logic inside the upload function by awaiting result if possible, 
        // but startUpload returns a promise that resolves to the result.
    },
    onUploadError: () => {
        setLoading(false);
        setUploadingSignature(false);
        alert("Error al subir imagen");
    },
  });

  // Handle Image Upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const img = new Image();
                img.onload = () => {
                     const maxWidth = 1000;
                     const aspectRatio = img.width / img.height;
                     const newWidth = Math.min(img.width, maxWidth);
                     const newHeight = newWidth / aspectRatio;
                     setCanvasSize({ width: newWidth, height: newHeight });
                     setBackgroundImage(ev.target!.result as string); // Set preview
                };
                img.src = ev.target.result as string;
            }
        };
        reader.readAsDataURL(file);

        // Upload in background or wait? 
        // Better to wait for save? No, let's keep it in state for Save but we can also just upload it now if we want.
        // The original logic kept it in `imageFile` state to upload on Save.
        // Let's keep that pattern for background image to avoid orphan uploads if user cancels.
        setImageFile(file);
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setUploadingSignature(true);
          try {
              const res = await startUpload([file]);
              
              if (!res || res.length === 0) throw new Error("Upload failed");
              
              const downloadUrl = res[0].url;
              
              const img = new Image();
              img.crossOrigin = "anonymous"; // UploadThing URLs are CORS friendly
              img.src = downloadUrl;
              img.onload = () => {
                  const aspectRatio = img.width / img.height;
                  const defaultWidth = 200;
                  const defaultHeight = defaultWidth / aspectRatio;
                  addElement('image', downloadUrl, 50, 50, { width: defaultWidth, height: defaultHeight });
              };
          } catch (error) {
              console.error("Error uploading signature:", error);
              alert("Error al subir la firma.");
          } finally {
              setUploadingSignature(false);
          }
      }
  };

  const addElement = (type: TemplateElementType, content: string = 'Texto', x: number = 50, y: number = 50, styleOverride: any = {}) => {
    const newElement: TemplateElement = {
        id: crypto.randomUUID(),
        type,
        content,
        position: { x, y },
        style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            align: 'left',
            width: type === 'qr' ? 120 : undefined,
            height: type === 'qr' ? 120 : undefined,
            opacity: 1,
            ...styleOverride,
        }
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElementId(newElement.id);
  };

  const updateElementPosition = (id: string, x: number, y: number) => {
    setElements(prev => prev.map(el => 
        el.id === id ? { ...el, position: { x, y } } : el
    ));
  };

  const updateElementStyle = (id: string, styleUpdate: any) => {
    setElements(prev => prev.map(el => 
        el.id === id ? { ...el, style: { ...el.style, ...styleUpdate } } : el
    ));
  };

  // Drag Source: Sidebar Items
  const handleSidebarDragStart = (e: React.DragEvent, type: TemplateElementType, content?: string) => {
    e.dataTransfer.setData('application/sigce-type', type);
    if (content) e.dataTransfer.setData('application/sigce-content', content);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Drag Source: Canvas Elements
  const handleElementDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('application/sigce-id', id);
    e.dataTransfer.effectAllowed = 'move';

    // Calculate offset from top-left of the element
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    e.dataTransfer.setData('application/sigce-offset-x', offsetX.toString());
    e.dataTransfer.setData('application/sigce-offset-y', offsetY.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        // Mouse position relative to canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const type = e.dataTransfer.getData('application/sigce-type') as TemplateElementType;
        const existingId = e.dataTransfer.getData('application/sigce-id');
        const offsetX = parseFloat(e.dataTransfer.getData('application/sigce-offset-x'));
        const offsetY = parseFloat(e.dataTransfer.getData('application/sigce-offset-y'));

        if (type) {
            const content = e.dataTransfer.getData('application/sigce-content') || (type === 'qr' ? 'QR Code' : 'Texto');
            addElement(type, content, mouseX - 50, mouseY - 20); // Center on pointer for new items
        } else if (existingId) {
            // Apply offset to keep element exactly under cursor
            const newX = mouseX - (isNaN(offsetX) ? 0 : offsetX);
            const newY = mouseY - (isNaN(offsetY) ? 0 : offsetY);
            updateElementPosition(existingId, newX, newY);
            setSelectedElementId(existingId);
        }
    }
  };

    const handleSave = async () => {
        if (!name.trim()) return alert('Nombre requerido');
        if (!backgroundImage) return alert('Imagen de fondo requerida'); // Validate backgroundImage presence

        setLoading(true);
        try {
            let imageUrl = backgroundImage;

            // Only upload if it's a new file (blob)
            // Only upload if it's a new file (blob)
            if (imageFile) {
                // Upload background image via UploadThing
                const res = await startUpload([imageFile]);
                if (!res || res.length === 0) throw new Error("Error al subir la imagen de fondo");
                imageUrl = res[0].url;
            } else if (backgroundImage && !backgroundImage.startsWith('http')) {
                 // Check if it is base64 but no file object? 
            }

            const templateData: CreateTemplateDTO = {
                name,
                backgroundImageUrl: imageUrl,
                width: canvasSize.width,
                height: canvasSize.height,
                elements: elements.map(el => ({
                    ...el,
                    // Ensure content uses proxy or is accessible if it was a blob URL, but elements usually have public URLs if uploaded via signature
                    // Signatures are already uploaded to storage and have public URLs.
                }))
            };
            await repository.save(templateData);
            
            router.push('/dashboard/templates');
        } catch (err) {
            console.error("Error saving template:", err);
            alert("Error al guardar la plantilla: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-gray-100 overflow-hidden font-sans">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la Plantilla"
                className="text-lg font-bold bg-transparent border-none focus:ring-0 placeholder-gray-300"
            />
        </div>
        <div className="flex items-center gap-3">
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
            >
                <Upload size={16} /> Cambiar Fondo
                <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />
            </button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 font-bold text-sm"
            >
                {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div> : <Save size={18} />}
                Guardar Diseño
            </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Palette */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-4 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Elementos Básicos</h3>
                    <div className="space-y-3">
                        <div 
                            draggable 
                            onDragStart={(e) => handleSidebarDragStart(e, 'text')}
                            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-white hover:border-solid hover:border-blue-200 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                        >
                            <div className="bg-white p-2 rounded-lg border border-gray-200 text-gray-600 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors"><Type size={20} /></div>
                            <div>
                                <span className="text-sm font-bold text-gray-700 block group-hover:text-blue-700">Texto</span>
                                <span className="text-[10px] text-gray-400">Arrastra al lienzo</span>
                            </div>
                        </div>
                        <div 
                            draggable
                            onDragStart={(e) => handleSidebarDragStart(e, 'qr')}
                            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-white hover:border-solid hover:border-blue-200 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
                        >
                            <div className="bg-white p-2 rounded-lg border border-gray-200 text-gray-600 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors"><QrCode size={20} /></div>
                             <div>
                                <span className="text-sm font-bold text-gray-700 block group-hover:text-blue-700">Código QR</span>
                                <span className="text-[10px] text-gray-400">Generado automáticamente</span>
                            </div>
                        </div>
                         <div 
                            onClick={() => signatureInputRef.current?.click()}
                            className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 hover:bg-white hover:border-solid hover:border-blue-200 hover:shadow-md cursor-pointer transition-all group relative"
                        >
                            <div className="bg-white p-2 rounded-lg border border-gray-200 text-gray-600 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                                {uploadingSignature ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div> : <ImageIcon size={20} />}
                            </div>
                             <div>
                                <span className="text-sm font-bold text-gray-700 block group-hover:text-blue-700">Imagen / Firma</span>
                                <span className="text-[10px] text-gray-400">Sube una firma o logo</span>
                                <input ref={signatureInputRef} type="file" accept="image/*" hidden onChange={handleSignatureUpload} />
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Variables Dinámicas</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {VARIABLES.map(variable => (
                            <div 
                                key={variable.value}
                                draggable
                                onDragStart={(e) => handleSidebarDragStart(e, 'variable', variable.value)}
                                className="flex items-center justify-between p-2.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 hover:bg-blue-100 hover:border-blue-200 cursor-grab active:cursor-grabbing transition-all shadow-sm hover:shadow"
                            >
                                <span className="text-xs font-mono font-medium">{`{{${variable.value}}}`}</span>
                                <GripVertical size={14} className="text-blue-300" />
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 leading-relaxed">
                        Estas variables se reemplazarán automáticamente con los datos reales al generar el certificado.
                    </p>
                </div>
            </div>

            {/* Properties Panel (Bottom) */}
            {selectedElementId && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 animate-in slide-in-from-bottom duration-200 max-h-[40vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-gray-900 uppercase">Propiedades</h3>
                        <button onClick={() => setSelectedElementId(null)}><X size={14} className="text-gray-400 hover:text-gray-600" /></button>
                    </div>
                    
                    <div className="space-y-4">
                        {elements.find(el => el.id === selectedElementId)?.type === 'text' && (
                             <div>
                                <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Contenido</label>
                                <input 
                                    type="text" 
                                    value={elements.find(el => el.id === selectedElementId)?.content}
                                    onChange={(e) => {
                                        setElements(prev => prev.map(el => el.id === selectedElementId ? { ...el, content: e.target.value } : el));
                                    }}
                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                />
                            </div>
                        )}
                       
                        {elements.find(el => el.id === selectedElementId)?.type !== 'image' && elements.find(el => el.id === selectedElementId)?.type !== 'qr' && (
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Tamaño (px)</label>
                                    <input 
                                        type="number" 
                                        value={elements.find(el => el.id === selectedElementId)?.style.fontSize}
                                        onChange={(e) => updateElementStyle(selectedElementId, { fontSize: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Color</label>
                                    <div className="flex items-center gap-2">
                                        <input 
                                            type="color" 
                                            value={elements.find(el => el.id === selectedElementId)?.style.color}
                                            onChange={(e) => updateElementStyle(selectedElementId, { color: e.target.value })}
                                            className="h-9 w-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                                        />
                                        <span className="text-xs font-mono text-gray-500 uppercase">{elements.find(el => el.id === selectedElementId)?.style.color}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(elements.find(el => el.id === selectedElementId)?.type === 'image' || elements.find(el => el.id === selectedElementId)?.type === 'qr') && (
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Ancho (px)</label>
                                    <input 
                                        type="number" 
                                        value={elements.find(el => el.id === selectedElementId)?.style.width}
                                        onChange={(e) => updateElementStyle(selectedElementId, { width: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Alto (px)</label>
                                    <input 
                                        type="number" 
                                        value={elements.find(el => el.id === selectedElementId)?.style.height}
                                        onChange={(e) => updateElementStyle(selectedElementId, { height: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={() => {
                                setElements(prev => prev.filter(el => el.id !== selectedElementId));
                                setSelectedElementId(null);
                            }}
                            className="w-full mt-2 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:text-red-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={14} /> ELIMINAR ELEMENTO
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto bg-gray-200/50 flex flex-col items-center p-8 relative">
            
            {/* Canvas Container */}
            <div className="relative shadow-2xl rounded-sm overflow-hidden ring-1 ring-black/5 transition-transform duration-200">
                 <div 
                    ref={canvasRef}
                    className={`bg-white transition-all cursor-crosshair ${dragOver ? 'ring-4 ring-blue-400/50' : ''}`}
                    style={{ 
                        width: canvasSize.width, 
                        height: canvasSize.height,
                        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {!backgroundImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 m-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                            <Upload size={64} className="mb-4 text-gray-300" />
                            <p className="text-xl font-bold text-gray-500">Sube una imagen de fondo</p>
                            <p className="text-sm mt-2">Arrastra un archivo o usa el botón superior</p>
                        </div>
                    )}

                    {elements.map(element => (
                        <div
                            key={element.id}
                            draggable
                            onDragStart={(e) => handleElementDragStart(e, element.id)}
                            onClick={(e) => { e.stopPropagation(); setSelectedElementId(element.id); }}
                            style={{
                                position: 'absolute',
                                left: element.position.x,
                                top: element.position.y,
                                fontSize: `${element.style.fontSize}px`,
                                fontFamily: element.style.fontFamily,
                                color: element.style.color,
                                cursor: 'move',
                                zIndex: 10, // Ensure on top of background
                                transform: 'translate(0, 0)', // Force GPU layer
                                width: element.style.width ? `${element.style.width}px` : 'auto',
                                height: element.style.height ? `${element.style.height}px` : 'auto',
                            }}
                            className={`group select-none ${selectedElementId === element.id ? 'z-50' : 'z-10'}`}
                        >
                            <div className={`
                                relative px-2 py-1 rounded
                                ${selectedElementId === element.id 
                                    ? 'border-2 border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/10' 
                                    : 'border-2 border-transparent hover:border-blue-300/50'
                                }
                            `}>
                                {element.type === 'qr' ? (
                                    <div className="bg-black text-white flex items-center justify-center text-[10px] font-bold tracking-widest w-full h-full">
                                        QR
                                    </div>
                                ) : element.type === 'image' ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img 
                                        src={element.content} 
                                        alt="Firma/Imagen" 
                                        className="w-full h-full object-contain pointer-events-none" 
                                    />
                                ) : element.type === 'variable' ? (
                                    <span className="font-mono bg-blue-100/80 text-blue-900 px-1.5 py-0.5 rounded text-[0.8em] font-bold border border-blue-200">
                                        {`{{${element.content}}}`}
                                    </span>
                                ) : (
                                    <span className="whitespace-nowrap">{element.content}</span>
                                )}
                                
                                {selectedElementId === element.id && (
                                   <div className="absolute -top-3 -right-3 w-5 h-5 bg-blue-500 rounded-full text-white flex items-center justify-center shadow-sm">
                                        <GripVertical size={10} />
                                   </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-400 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                {canvasSize.width} x {canvasSize.height.toFixed(0)} px
            </div>
        </div>
      </div>
    </div>
  );
}
