"use client";

import { useEffect, useRef, useState } from 'react';

interface SignatureCanvasProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 220;

export function SignatureCanvas({
  value,
  onChange,
  disabled = false,
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.lineWidth = 2.4;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#0f172a';

    if (!value) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = value;
  }, [value]);

  const getCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const { x, y } = getCoordinates(event);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const { x, y } = getCoordinates(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const endDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (event) {
      canvas.releasePointerCapture(event.pointerId);
    }

    if (isDrawing) {
      onChange(canvas.toDataURL('image/png'));
    }

    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
          className={`w-full h-[220px] touch-none bg-white ${
            disabled ? 'cursor-not-allowed opacity-70' : 'cursor-crosshair'
          }`}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Traza la firma con mouse, touch o stylus.</span>
        <button
          type="button"
          onClick={clearCanvas}
          disabled={disabled}
          className="font-semibold text-primary disabled:opacity-50"
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
}
