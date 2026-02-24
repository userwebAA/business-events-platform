'use client';

import { LogOut, X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
}

export default function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        await onConfirm();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Overlay */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={isLoading ? undefined : onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 z-[10000]">
                    {/* Close button */}
                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    )}

                    {/* Icon */}
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                        {isLoading ? (
                            <Loader2 className="h-6 w-6 text-red-600 animate-spin" />
                        ) : (
                            <LogOut className="h-6 w-6 text-red-600" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {isLoading ? 'Déconnexion en cours...' : 'Déconnexion'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {isLoading
                                ? 'Veuillez patienter...'
                                : 'Êtes-vous sûr de vouloir vous déconnecter ?'
                            }
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
