'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Users } from 'lucide-react';
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
    
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ValidationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, valid: 0, used: 0, cancelled: 0 });
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [cameraStarted, setCameraStarted] = useState(false);

    useEffect(() => {
        fetchStats();
        startScanner();
        
        return () => {
            stopScanner();
        };
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/tickets/event/${eventId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    const startScanner = async () => {
        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;
            
            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 }
                },
                onScanSuccess,
                onScanError
            );
            
            setCameraStarted(true);
            setScanning(true);
        } catch (error) {
            console.error('Erreur démarrage scanner:', error);
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && cameraStarted) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (error) {
                console.error('Erreur arrêt scanner:', error);
            }
        }
    };

    const onScanSuccess = (decodedText: string) => {
        if (!loading) {
            handleScan(decodedText);
        }
    };

    const onScanError = (error: any) => {
        // Ignorer les erreurs de scan normales
    };

    const handleScan = async (qrCodeText: string) => {
        setLoading(true);
        setScanning(false);

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
            setResult(data);
            
            if (data.valid) {
                await fetchStats();
            }

            setTimeout(() => {
                setResult(null);
                setScanning(true);
                setLoading(false);
            }, 3000);
        } catch (error) {
            console.error('Erreur validation:', error);
            setResult({
                valid: false,
                message: 'Erreur de connexion',
            });
            setTimeout(() => {
                setResult(null);
                setScanning(true);
                setLoading(false);
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="h-5 w-5" />
                    Retour
                </button>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Scanner les billets</h1>
                    <p className="text-gray-600">Scannez les QR codes des participants à l'entrée</p>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Users className="h-5 w-5" />
                            <span className="text-sm">Total</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm">Valides</span>
                        </div>
                        <p className="text-3xl font-bold text-green-600">{stats.valid}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm">Utilisés</span>
                        </div>
                        <p className="text-3xl font-bold text-blue-600">{stats.used}</p>
                    </div>
                    <div className="bg-red-50 rounded-lg shadow p-4">
                        <div className="flex items-center gap-2 text-red-600 mb-2">
                            <XCircle className="h-5 w-5" />
                            <span className="text-sm">Annulés</span>
                        </div>
                        <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    {scanning && !result && (
                        <div className="space-y-4">
                            <div id="qr-reader" className="max-w-md mx-auto"></div>
                            <p className="text-center text-gray-600">
                                Positionnez le QR code devant la caméra
                            </p>
                        </div>
                    )}

                    {result && (
                        <div className="text-center py-12">
                            {result.valid ? (
                                <>
                                    <CheckCircle className="h-24 w-24 text-green-500 mx-auto mb-4" />
                                    <h2 className="text-3xl font-bold text-green-600 mb-2">
                                        ✅ Billet Valide
                                    </h2>
                                    <p className="text-gray-600 text-lg">{result.message}</p>
                                    {result.ticket && (
                                        <div className="mt-6 bg-green-50 rounded-lg p-4 max-w-md mx-auto">
                                            <p className="text-sm text-gray-700">
                                                <strong>Participant:</strong>{' '}
                                                {(result.ticket.registration.formData as any).name || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-700 mt-2">
                                                <strong>Événement:</strong>{' '}
                                                {result.ticket.registration.event.title}
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-24 w-24 text-red-500 mx-auto mb-4" />
                                    <h2 className="text-3xl font-bold text-red-600 mb-2">
                                        ❌ Billet Invalide
                                    </h2>
                                    <p className="text-gray-600 text-lg">{result.message}</p>
                                    {result.usedAt && (
                                        <p className="text-sm text-gray-500 mt-2">
                                            Utilisé le {new Date(result.usedAt).toLocaleString('fr-FR')}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {loading && !result && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-sky-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Validation en cours...</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                            <p className="font-semibold mb-1">Conseils d'utilisation :</p>
                            <ul className="list-disc list-inside space-y-1 text-blue-800">
                                <li>Assurez-vous d'avoir une bonne luminosité</li>
                                <li>Maintenez le QR code stable devant la caméra</li>
                                <li>Le billet sera automatiquement marqué comme utilisé</li>
                                <li>Un billet ne peut être scanné qu'une seule fois</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
