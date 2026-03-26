'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface EventMapProps {
    address: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    showExactLocation: boolean;
}

// Fix pour les icônes Leaflet par défaut
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Composant pour centrer la carte
function MapCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function EventMap({ address, latitude, longitude, radius, showExactLocation }: EventMapProps) {
    const [coords, setCoords] = useState<[number, number] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getCoordinates = async () => {
            try {
                // Si on a déjà les coordonnées
                if (latitude && longitude) {
                    setCoords([latitude, longitude]);
                    setIsLoading(false);
                    return;
                }

                // Sinon, géocoder l'adresse avec Nominatim (OpenStreetMap)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
                );

                if (!response.ok) {
                    throw new Error('Erreur lors du géocodage');
                }

                const data = await response.json();

                if (data && data.length > 0) {
                    setCoords([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError('Impossible de localiser l\'adresse');
                }
            } catch (err) {
                console.error('Erreur géocodage:', err);
                setError('Erreur lors de la localisation');
            } finally {
                setIsLoading(false);
            }
        };

        getCoordinates();
    }, [address, latitude, longitude]);

    if (error) {
        return (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">Carte non disponible</p>
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        );
    }

    if (isLoading || !coords) {
        return (
            <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border border-gray-200" style={{ height: '400px' }}>
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    const zoom = showExactLocation ? 16 : 14;
    const circleRadius = radius || 500;

    return (
        <div className="relative">
            <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <MapContainer
                    center={coords}
                    zoom={zoom}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                >
                    <MapCenter center={coords} zoom={zoom} />
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {showExactLocation ? (
                        <Marker position={coords}>
                            <Popup>
                                <div className="text-sm">
                                    <div className="font-bold text-blue-900 mb-1">📍 Adresse exacte</div>
                                    <div className="text-gray-700">{address}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ) : (
                        <Circle
                            center={coords}
                            radius={circleRadius}
                            pathOptions={{
                                color: '#1E40AF',
                                fillColor: '#1E40AF',
                                fillOpacity: 0.2,
                                weight: 2,
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            {!showExactLocation && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                        <p className="font-semibold text-blue-900 mb-1">Zone approximative</p>
                        <p className="text-blue-700">
                            L'adresse exacte sera révélée après votre inscription à l'événement.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
