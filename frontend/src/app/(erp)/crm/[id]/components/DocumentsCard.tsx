'use client';

import React, { useRef, useState } from 'react';
import { Paperclip, Upload, FileText, Download, Trash2, File, Image as ImageIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';

interface DocumentsCardProps {
  attachments: any[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function DocumentsCard({ attachments, onUpload, onDelete }: DocumentsCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: add validation here (size, type)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      showToast('Document uploaded successfully');
    } catch (err) {
      showToast('Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    const isConfirmed = await confirm({
      message: `Are you sure you want to delete ${fileName}?`,
      confirmText: 'Delete',
      variant: 'destructive',
    });
    
    if (isConfirmed) {
      try {
        await onDelete(id);
        showToast('Document deleted');
      } catch (err) {
        showToast('Failed to delete document', 'error');
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <File className="w-5 h-5 text-gray-400" />;
    if (fileType.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const handlePreview = (url: string) => {
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <Paperclip className="w-4 h-4 mr-2 text-[#f97316]" />
          Documents
        </h2>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 text-[#f97316] hover:text-[#ea580c] hover:bg-orange-50 px-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-1" /> 
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {attachments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6">
            <Paperclip className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No documents attached</p>
            <p className="text-xs text-gray-400 mt-1">Upload Quotations, ID proofs, or site images.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attachments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors group">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="bg-gray-100 p-2 rounded shrink-0">
                    {getFileIcon(doc.mime_type || doc.file_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate" title={doc.file_name}>
                      {doc.file_name}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-0.5">
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span className="mx-1.5">•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {doc.file_url && (
                    <button onClick={() => handlePreview(doc.file_url)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Preview">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {doc.file_url && (
                    <a href={doc.file_url} download className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded" title="Download">
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(doc.id, doc.file_name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
