"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Image as ImageIcon,
    FileArchive,
    File,
    Folder,
    UploadCloud,
    Loader2,
    DatabaseZap
} from 'lucide-react';
import ContextMenu from './ContextMenu';
import { triggerAnalysis } from '@/lib/services/analysis';

interface DataVaultProps {
    userId: string;
    onNavigate?: (app: 'loading' | 'genesis' | 'workspace' | 'identity' | 'vault' | 'hunter') => void;
}

interface StorageFile {
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: {
        size: number;
        mimetype: string;
    };
}

export default function DataVault({ userId, onNavigate }: DataVaultProps) {
    const [files, setFiles] = useState<StorageFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Menu de Contexto
    const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; fileName?: string }>({
        isOpen: false,
        x: 0,
        y: 0,
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const fetchFiles = async () => {
        if (!userId) return;
        setLoading(true);

        const { data, error } = await supabase.storage.from('user_files').list(userId, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'name', order: 'asc' }
        });

        if (error) {
            console.error('Erro ao buscar arquivos:', error);
        } else if (data) {
            // Fix para o bug do Supabase list() retornar array vazio '[.emptyFolderPlaceholder]'
            const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder');
            setFiles(validFiles as unknown as StorageFile[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFiles();
    }, [userId]);

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0 || !userId) return;

        setUploading(true);
        const file = fileList[0]; // Processando apenas um para simplificar
        const filePath = `${userId}/${file.name}`;

        const { error } = await supabase.storage.from('user_files').upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

        if (error) {
            console.error('Erro no upload:', error);
            // Mostrar um toast de erro se necessário
        } else {
            await fetchFiles();

            // [Phase 5] Auto-Tagging Trigger (Silent)
            try {
                const { data: uploadInfo } = await supabase.storage.from('user_files').createSignedUrl(filePath, 300);
                if (uploadInfo?.signedUrl) {
                    fetch('/api/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileUrl: uploadInfo.signedUrl,
                            fileName: file.name,
                            fileType: file.type,
                            userId: userId,
                            intent: 'vault_tagging'
                        })
                    }).catch(err => console.error("Auto-tagging falhou:", err));
                }
            } catch (err) {
                console.error("Falha ao iniciar auto-tagging:", err);
            }
        }
        setUploading(false);
    };

    // --- Handlers de Drag and Drop ---
    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUpload(e.dataTransfer.files);
        }
    };

    // --- Handlers de Menu de Contexto ---
    const handleContextMenu = (e: React.MouseEvent, fileName: string) => {
        e.preventDefault();
        setSelectedFile(fileName);
        setContextMenu({
            isOpen: true,
            x: e.pageX,
            y: e.pageY,
            fileName: fileName
        });
    };

    const closeContextMenu = () => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    const handleMenuAction = async (action: string) => {
        console.log(`Ação: ${action} no arquivo: ${contextMenu.fileName}`);
        closeContextMenu();

        if (!contextMenu.fileName || !userId) return;

        const path = `${userId}/${contextMenu.fileName}`;

        if (action === 'delete') {
            const { error } = await supabase.storage.from('user_files').remove([path]);
            if (!error) fetchFiles();
        } else if (action === 'download') {
            const { data, error } = await supabase.storage.from('user_files').download(path);
            if (data) {
                const url = window.URL.createObjectURL(data);
                const a = document.createElement('a');
                a.href = url;
                a.download = contextMenu.fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } else if (action === 'open') {
            // Como é um bucket privado, criar um signed url de curto tempo para visualização (300s para resiliência)
            const { data, error } = await supabase.storage.from('user_files').createSignedUrl(path, 300);
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } else if (action === 'analyze') {
            setIsAnalyzing(true);

            // Geração de Signed URL para que o Backend Next.js possa acessar o arquivo sem erro 403 (300s para resiliência)
            const { data: uploadInfo, error: uploadInfoError } = await supabase.storage.from('user_files').createSignedUrl(path, 300);

            if (uploadInfoError || !uploadInfo?.signedUrl) {
                console.error("Falha ao gerar link seguro para a análise", uploadInfoError);
                setIsAnalyzing(false);
                return;
            }

            // [Phase 2] Buscar Stacks do Usuário para o Clash Simulator
            const { data: masteryData } = await supabase
                .from('user_stack_mastery')
                .select('global_stacks(name)')
                .eq('user_id', userId)
                .eq('is_active', true);

            const userStacks = masteryData?.map((m: any) => m.global_stacks.name) || [];

            // Encontra o arquivo selecionado para obter o mimeType correto
            const fileData = files.find(f => f.name === contextMenu.fileName);

            await triggerAnalysis(
                uploadInfo.signedUrl,
                contextMenu.fileName || '',
                'hunterzim',
                userId,
                fileData?.metadata?.mimetype,
                userStacks,
                'vault_tagging' // [Phase 5]
            );

            setIsAnalyzing(false);

            if (onNavigate) {
                onNavigate('workspace');
            }
        }
    };

    // --- Helpers ---
    const getFileIcon = (mimetype: string | undefined) => {
        if (!mimetype) return <File className="w-8 h-8 text-slate-400" />;
        if (mimetype.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
        if (mimetype.includes('image')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
        if (mimetype.includes('zip') || mimetype.includes('tar')) return <FileArchive className="w-8 h-8 text-amber-400" />;
        if (mimetype.includes('text')) return <FileText className="w-8 h-8 text-slate-300" />;
        return <File className="w-8 h-8 text-slate-400" />;
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div
            className="w-full h-full bg-[#050505] flex text-slate-200 relative outline-none"
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {/* Overlay de Drag and Drop */}
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 bg-green-500/10 backdrop-blur-sm border-2 border-dashed border-green-500 flex flex-col items-center justify-center p-8 rounded-xl"
                    >
                        <UploadCloud className="w-24 h-24 text-green-400 mb-4 animate-bounce" />
                        <h2 className="text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_10px_rgba(34,197,94,0.8)] uppercase text-center">
                            Solte para Enviar para a Matriz
                        </h2>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay de Carregamento de Análise */}
            <AnimatePresence>
                {isAnalyzing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
                    >
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-green-500 rounded-full blur-[30px] opacity-20 animate-pulse"></div>
                            <Loader2 className="w-20 h-20 text-green-400 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-black tracking-widest text-green-400 text-center uppercase drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                            Link Seguro Estabelecido
                        </h2>
                        <p className="text-green-500/60 font-mono mt-3 text-center text-sm tracking-widest uppercase">
                            Transferindo dados para o agente HunterZim...
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar (Esquerda) */}
            <div className="w-64 border-r border-white/5 bg-[#0a0a0a] p-6 hidden md:flex flex-col gap-6">
                <div>
                    <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase flex items-center gap-2 mb-4">
                        <DatabaseZap className="w-4 h-4 text-green-400" />
                        Categorias do Cofre
                    </h2>
                    <ul className="space-y-2">
                        <li>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 font-mono text-sm border border-green-500/20">
                                <Folder className="w-4 h-4" />
                                Todos os Arquivos
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors font-mono text-sm">
                                <Folder className="w-4 h-4" />
                                Currículos
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors font-mono text-sm">
                                <Folder className="w-4 h-4" />
                                Documentos de Estudo
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Botão de Upload */}
                <div className="mt-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files)}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/50 rounded-lg font-bold tracking-widest uppercase text-xs transition-colors"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {uploading ? 'Enviando...' : 'Fazer Upload'}
                    </button>
                </div>
            </div>

            {/* Área Principal (Direita) */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar" onClick={closeContextMenu}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-white mb-1">Cofre de Dados Criptografado</h1>
                        <p className="text-sm font-mono text-slate-400">Armazenamento privado e seguro de ativos da matriz.</p>
                    </div>
                    {/* Visual de contagem */}
                    <div className="px-4 py-2 rounded-lg border border-white/5 bg-[#0a0a0a] font-mono text-xs text-green-400">
                        {files.length} ITENS DETECTADOS
                    </div>
                </div>

                {loading ? (
                    <div className="w-full h-64 flex flex-col items-center justify-center text-green-500/50">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <span className="font-mono text-sm tracking-widest uppercase">Descriptografando Arquivos...</span>
                    </div>
                ) : files.length === 0 ? (
                    <div className="w-full h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                        <UploadCloud className="w-12 h-12 text-slate-500 opacity-50 mb-4" />
                        <span className="font-mono text-slate-400 tracking-widest uppercase text-sm mb-2">Vault Vazio</span>
                        <p className="text-slate-500 text-xs">Arraste e solte arquivos aqui para alimentá-los aos Agentes.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {files.map((file) => {
                            const isSelected = selectedFile === file.name;

                            return (
                                <motion.div
                                    key={file.id}
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    onContextMenu={(e) => handleContextMenu(e, file.name)}
                                    onClick={() => setSelectedFile(file.name)}
                                    className={`relative flex flex-col items-center p-4 rounded-xl border backdrop-blur-sm cursor-pointer transition-colors ${isSelected
                                        ? 'border-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                                        : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'
                                        }`}
                                >
                                    <div className="mb-3">
                                        {getFileIcon(file.metadata?.mimetype)}
                                    </div>
                                    <span className="text-xs font-medium text-slate-300 text-center w-full truncate mb-1">
                                        {file.name}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500">
                                        {formatBytes(file.metadata?.size)}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Injeção do ContextMenu */}
            <ContextMenu
                isOpen={contextMenu.isOpen}
                x={contextMenu.x}
                y={contextMenu.y}
                fileName={contextMenu.fileName}
                onClose={closeContextMenu}
                onAction={handleMenuAction}
            />

        </div>
    );
}
