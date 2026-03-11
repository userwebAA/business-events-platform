'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Users, Camera, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';

interface ValidationResult {
    valid: boolean;
    message: string;
    ticket?: any;
    usedAt?: string;
}

export default function ScanTicketPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.id as string;

    const [result, setResult] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, valid: 0, used: 0, cancelled: 0 });
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const scannerRef = useRef<any>(null);
    const isProcessingRef = useRef(false);
    const mountedRef = useRef(true);

    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tickets/event/${eventId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                if (mountedRef.current) setStats(data.stats);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    }, [eventId]);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                // State 2 = SCANNING
                if (state === 2) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (error) {
                // Ignorer les erreurs d'arrêt
            }
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(async () => {
        setCameraError(null);
        setCameraReady(false);

        // Vérifier que le navigateur supporte getUserMedia (requis pour la caméra)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez Chrome ou Safari.');
            return;
        }

        // Demander la permission caméra explicitement
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            // Relâcher le stream immédiatement, html5-qrcode va en créer un nouveau
            stream.getTracks().forEach(track => track.stop());
        } catch (permErr: any) {
            if (permErr.name === 'NotAllowedError') {
                setCameraError('Accès à la caméra refusé. Autorisez l\'accès dans les paramètres de votre navigateur.');
            } else if (permErr.name === 'NotFoundError') {
                setCameraError('Aucune caméra détectée sur cet appareil.');
            } else {
                setCameraError(`Erreur caméra : ${permErr.message}`);
            }
            return;
        }

        // Attendre que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 300));

        const readerEl = document.getElementById('qr-reader');
        if (!readerEl) {
            setCameraError('Erreur d\'initialisation du scanner.');
            return;
        }

        try {
            // Import dynamique pour éviter les problèmes SSR
            const { Html5Qrcode } = await import('html5-qrcode');

            await stopScanner();

            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1,
                },
                (decodedText: string) => {
                    if (!isProcessingRef.current) {
                        handleScan(decodedText);
                    }
                },
                () => {
                    // Ignorer les erreurs de scan normales (pas de QR code détecté)
                }
            );

            if (mountedRef.current) setCameraReady(true);
        } catch (error: any) {
            console.error('Erreur démarrage scanner:', error);
            if (mountedRef.current) {
                setCameraError('Impossible de démarrer la caméra. Vérifiez les permissions.');
            }
        }
    }, [stopScanner]);

    const handleScan = async (qrCodeText: string) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        setLoading(true);

        // Vibration feedback sur mobile
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tickets/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    qrCode: qrCodeText,
                    markAsUsed: true,
                }),
            });

            const data = await response.json();
            if (mountedRef.current) {
                setResult(data);
                setLoading(false);

                if (data.valid) {
                    // Vibration longue pour succès
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                    await fetchStats();
                } else {
                    // Vibration erreur
                    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
                }
            }

            // Reprendre le scan après 3 secondes
            setTimeout(() => {
                if (mountedRef.current) {
                    setResult(null);
                    isProcessingRef.current = false;
                }
            }, 3000);
        } catch (error) {
            console.error('Erreur validation:', error);
            if (mountedRef.current) {
                setResult({ valid: false, message: 'Erreur de connexion' });
                setLoading(false);
            }
            setTimeout(() => {
                if (mountedRef.current) {
                    setResult(null);
                    isProcessingRef.current = false;
                }
            }, 3000);
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        fetchStats();
        startScanner();

        return () => {
            mountedRef.current = false;
            stopScanner();
        };
    }, [fetchStats, startScanner, stopScanner]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-lg mx-auto px-4 py-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Retour
                </button>

                <div className="bg-white rounded-xl shadow-lg p-5 mb-4">
                    <h1 className="text-xl font-bold text-gray-900 mb-1">Scanner les billets</h1>
                    <p className="text-gray-500 text-sm">Scannez les QR codes des participants à l'entrée</p>
                </div>

                {/* Stats responsive 2x2 sur mobile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="bg-white rounded-lg shadow p-3">
                        <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-medium">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg shadow p-3">
                        <div className="flex items-center gap-1.5 text-green-600 mb-1">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Valides</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg shadow p-3">
                        <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Utilisés</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{stats.used}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg shadow p-3">
                        <div className="flex items-center gap-1.5 text-red-600 mb-1">
                            <XCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Annulés</span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                    </div>
                </div>

                {/* Zone scanner — le div #qr-reader est TOUJOURS dans le DOM */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                    {/* Résultat par-dessus la caméra */}
                    {result && (
                        <div className="text-center py-8">
                            {result.valid ? (
                                <>
                                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-3" />
                                    <h2 className="text-2xl font-bold text-green-600 mb-1">
                                        Billet Valide
                                    </h2>
                                    <p className="text-gray-600">{result.message}</p>
                                    {result.ticket && (
                                        <div className="mt-4 bg-green-50 rounded-lg p-4 text-left">
                                            <p className="text-sm text-gray-700">
                                                <strong>Participant :</strong>{' '}
                                                {result.ticket.registration?.formData?.name
                                                    || result.ticket.registration?.formData?.firstName
                                                    || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-700 mt-1">
                                                <strong>Événement :</strong>{' '}
                                                {result.ticket.registration?.event?.title}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-20 w-20 text-red-500 mx-auto mb-3" />
                                    <h2 className="text-2xl font-bold text-red-600 mb-1">
                                        Billet Invalide
                                    </h2>
                                    <p className="text-gray-600">{result.message}</p>
                                    {result.usedAt && (
                                        <p className="text-sm text-gray-400 mt-2">
                                            Utilisé le {new Date(result.usedAt).toLocaleString('fr-FR')}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && !result && (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-sky-500 mx-auto mb-3"></div>
                            <p className="text-gray-600 text-sm">Validation en cours...</p>
                        </div>
                    )}

                    {/* Erreur caméra */}
                    {cameraError && !result && !loading && (
                        <div className="text-center py-10">
                            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-red-600 font-semibold mb-2">Caméra indisponible</p>
                            <p className="text-gray-500 text-sm mb-4 px-4">{cameraError}</p>
                            <button
                                onClick={startScanner}
                                className="inline-flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-sky-600 transition text-sm"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Réessayer
                            </button>
                        </div>
                    )}

                    {/* Zone caméra — TOUJOURS rendu, caché quand un résultat est affiché */}
                    <div
                        id="qr-reader"
                        className={`mx-auto ${(result || loading || cameraError) ? 'hidden' : ''}`}
                        style={{ maxWidth: '100%' }}
                    ></div>

                    {!result && !loading && !cameraError && cameraReady && (
                        <p className="text-center text-gray-500 text-sm mt-3">
                            Positionnez le QR code devant la caméra
                        </p>
                    )}

                    {!result && !loading && !cameraError && !cameraReady && (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto mb-3"></div>
                            <p className="text-gray-500 text-sm">Démarrage de la caméra...</p>
                        </div>
                    )}
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">Conseils :</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800 text-xs">
                                <li>Bonne luminosité requise</li>
                                <li>Maintenez le QR code stable</li>
                                <li>Le billet est automatiquement marqué comme utilisé</li>
                                <li>Un billet ne peut être scanné qu'une seule fois</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
