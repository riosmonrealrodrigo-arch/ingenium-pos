'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  X,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  PackageCheck,
  Maximize2,
  Plus,
  RefreshCw,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { RepairOrder, RepairEvidence, RepairStatus } from '@/types';
import { compressImage, extractDiagnosisAndEvidence, formatDateTime } from '@/lib/utils';

interface RepairEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  repair: RepairOrder | null;
  onSaveEvidence: (repairId: string, updatedEvidence: RepairEvidence[]) => Promise<void> | void;
}

const STAGE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  recibido: { label: 'Recibido', bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-800' },
  en_diagnostico: { label: 'En Diagnóstico', bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-800' },
  esperando_repuesto: { label: 'En Taller / Repuesto', bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'text-purple-800' },
  listo_entrega: { label: 'Listo para Entrega', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-800' },
  entregado: { label: 'Entregado al Cliente', bg: 'bg-gray-100 text-gray-800 border-gray-300', text: 'text-gray-800' },
  cancelado: { label: 'Cancelado', bg: 'bg-red-100 text-red-800 border-red-200', text: 'text-red-800' },
};

export default function RepairEvidenceModal({
  isOpen,
  onClose,
  repair,
  onSaveEvidence,
}: RepairEvidenceModalProps) {
  const [evidenceList, setEvidenceList] = useState<RepairEvidence[]>([]);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [newStage, setNewStage] = useState<string>('recibido');
  const [newComment, setNewComment] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedPhoto, setSelectedPhoto] = useState<RepairEvidence | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (repair) {
      const { evidence } = extractDiagnosisAndEvidence(repair.technician_diagnosis);
      const list = repair.evidence && repair.evidence.length > 0 ? repair.evidence : evidence;
      setEvidenceList(list || []);
      setNewStage(repair.status || 'recibido');
      setNewImagePreview(null);
      setNewComment('');
    }
  }, [repair, isOpen]);

  if (!isOpen || !repair) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    try {
      const compressed = await compressImage(file, 1024, 1024, 0.72);
      setNewImagePreview(compressed);
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      alert('No se pudo procesar la imagen seleccionada.');
    } finally {
      setIsProcessingImage(false);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  const handleAddEvidence = async () => {
    if (!newImagePreview) return;

    setIsSaving(true);
    const newEntry: RepairEvidence = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      image_url: newImagePreview,
      stage: newStage,
      comment: newComment.trim() || undefined,
      created_at: new Date().toISOString(),
    };

    const updatedList = [newEntry, ...evidenceList];
    setEvidenceList(updatedList);

    try {
      await onSaveEvidence(repair.id, updatedList);
      setNewImagePreview(null);
      setNewComment('');
    } catch (err) {
      console.error('Error al guardar evidencia:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvidence = async (evidenceId: string) => {
    if (!confirm('¿Deseas eliminar esta fotografía de la bitácora?')) return;

    const updatedList = evidenceList.filter(ev => ev.id !== evidenceId);
    setEvidenceList(updatedList);

    try {
      await onSaveEvidence(repair.id, updatedList);
    } catch (err) {
      console.error('Error al eliminar evidencia:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-4 sm:p-6 max-h-[90vh] flex flex-col border border-gray-100 animate-slideUp">
        
        {/* Cabecera del modal */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Camera size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <span>Fotos y Avance del Equipo</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-bold">
                  {repair.folio}
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                {repair.device_brand} {repair.device_model} · {repair.client_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            <X size={19} />
          </button>
        </div>

        {/* Inputs ocultos para Cámara directa y Galería */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Área scrolleable con contenido */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4">
          
          {/* BOTONES DE CAPTURA RÁPIDA: CÁMARA & ARCHIVO */}
          {!newImagePreview && (
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 p-4 rounded-2xl border border-blue-100/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-blue-950 flex items-center gap-1.5">
                    <Camera size={16} className="text-[#2563eb]" />
                    <span>Agregar Foto del Estado Actual</span>
                  </h4>
                  <p className="text-[11px] text-blue-700">
                    El cliente podrá ver estas fotos en su guía de rastreo para mayor confianza.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Botón 1: Cámara en Vivo (Ideal para Celulares) */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="py-2.5 px-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Camera size={16} />
                  <span>Tomar Foto con Cámara</span>
                </button>

                {/* Botón 2: Subir de Archivo / Galería / PC */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="py-2.5 px-3 bg-white hover:bg-gray-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Upload size={16} />
                  <span>Subir de Galería o PC</span>
                </button>
              </div>

              {isProcessingImage && (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-700 py-1">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Optimizando y comprimiendo imagen...</span>
                </div>
              )}
            </div>
          )}

          {/* FORMULARIO DE NUEVA FOTO CAPTURADA (CON PREVIEW Y COMENTARIO OPCIONAL) */}
          {newImagePreview && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Camera size={15} /> Confirmar Nueva Evidencia
                </span>
                <button
                  type="button"
                  onClick={() => setNewImagePreview(null)}
                  className="text-gray-400 hover:text-gray-700 text-xs font-bold flex items-center gap-1"
                >
                  <X size={14} /> Cancelar
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Previsualización de la foto */}
                <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden border border-amber-200 bg-black/5 relative shrink-0">
                  <img
                    src={newImagePreview}
                    alt="Nueva evidencia"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Campos: Etapa y Comentario */}
                <div className="flex-1 space-y-2.5 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Etapa / Estado de esta foto:
                    </label>
                    <select
                      value={newStage}
                      onChange={e => setNewStage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      <option value="recibido">1. Recibido / Ingreso</option>
                      <option value="en_diagnostico">2. En Diagnóstico (Placa/Falla)</option>
                      <option value="esperando_repuesto">3. En Taller / Cambio de Pieza</option>
                      <option value="listo_entrega">4. Listo para Entrega (Terminado)</option>
                      <option value="entregado">5. Entregado al Cliente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Comentario opcional sobre la foto:
                    </label>
                    <textarea
                      rows={2}
                      value={newComment}
                      onChange={e => setNewComment(e.target.value)}
                      placeholder="Ej. Se detectó sulfato en centro de carga, o pantalla nueva montada y probada..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEvidence}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Publicar Foto en la Guía del Cliente</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LISTA / GALERÍA DE FOTOS YA SUBIDAS */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">
                Historial de Fotos Registradas ({evidenceList.length})
              </h4>
              {evidenceList.length > 0 && (
                <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Visible en rastreo en vivo
                </span>
              )}
            </div>

            {evidenceList.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-1">
                <ImageIcon size={30} className="mx-auto text-gray-300" />
                <p className="text-xs font-bold text-gray-600">Aún no hay fotos registradas para esta orden</p>
                <p className="text-[11px] text-gray-400">
                  Usa los botones superiores para tomar o subir fotos del proceso técnico.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidenceList.map((ev, idx) => {
                  const stageConfig = STAGE_LABELS[ev.stage || ''] || STAGE_LABELS.recibido;

                  return (
                    <div
                      key={ev.id || idx}
                      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:border-blue-200 transition flex flex-col justify-between"
                    >
                      {/* Imagen con badge de etapa y botón de zoom */}
                      <div className="relative aspect-video bg-black/5 group cursor-pointer" onClick={() => setSelectedPhoto(ev)}>
                        <img
                          src={ev.image_url}
                          alt={ev.comment || 'Evidencia de reparación'}
                          className="w-full h-full object-cover group-hover:scale-102 transition duration-200"
                        />
                        <div className="absolute top-2 left-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${stageConfig.bg}`}>
                            {stageConfig.label}
                          </span>
                        </div>
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Maximize2 size={22} />
                        </div>
                      </div>

                      {/* Detalles: comentario, fecha y botón de eliminar */}
                      <div className="p-3 space-y-1.5 text-xs">
                        {ev.comment ? (
                          <p className="font-medium text-gray-800 leading-snug">
                            {ev.comment}
                          </p>
                        ) : (
                          <p className="text-gray-400 italic text-[11px]">
                            Sin comentario adicional
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-[10px] text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {formatDateTime(ev.created_at)}
                          </span>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteEvidence(ev.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar foto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>

      {/* LIGHTBOX: VISTA AMPLIADA DE FOTO */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-3xl w-full bg-transparent flex flex-col items-center space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full text-white px-2">
              <span className="text-xs font-bold text-gray-300">
                {formatDateTime(selectedPhoto.created_at)}
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[75vh] w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black/40">
              <img
                src={selectedPhoto.image_url}
                alt={selectedPhoto.comment || 'Evidencia ampliada'}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </div>

            {selectedPhoto.comment && (
              <div className="bg-black/60 text-white px-4 py-2 rounded-xl text-xs max-w-xl text-center backdrop-blur-md border border-white/10">
                <p className="font-medium">{selectedPhoto.comment}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}