'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface EventMapProps {
    address: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    showExactLocation: boolean; // true si l'utilisateur est inscrit
}

export default function EventMap({ address, latitude, longitude, radius, showExactLocation }: EventMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadGoogleMaps = async () => {
            try {
                // Vérifier si Google Maps est déjà chargé
                if (window.google && window.google.maps) {
                    initMap();
                    return;
                }

                // Charger Google Maps API
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
                script.async = true;
                script.defer = true;
                script.onload = () => initMap();
                script.onerror = () => {
                    setError('Erreur lors du chargement de Google Maps');
                    setIsLoading(false);
                };
                document.head.appendChild(script);
            } catch (err) {
                setError('Erreur lors de l\'initialisation de la carte');
                setIsLoading(false);
            }
        };

        const initMap = async () => {
            if (!mapRef.current) return;

            try {
                let lat = latitude;
                let lng = longitude;

                // Si pas de coordonnées, géocoder l'adresse
                if (!lat || !lng) {
                    const geocoder = new google.maps.Geocoder();
                    const result = await geocoder.geocode({ address });
                    if (result.results[0]) {
                        lat = result.results[0].geometry.location.lat();
                        lng = result.results[0].geometry.location.lng();
                    } else {
                        setError('Impossible de localiser l\'adresse');
                        setIsLoading(false);
                        return;
                    }
                }

                const center = { lat, lng };

                // Créer la carte
                const map = new google.maps.Map(mapRef.current, {
                    center,
                    zoom: showExactLocation ? 16 : 14,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                });

                if (showExactLocation) {
                    // Afficher le marqueur exact
                    new google.maps.Marker({
                        position: center,
                        map,
                        title: address,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: '#1E40AF',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }
                    });

                    // Ajouter une info window avec l'adresse
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<div style="padding: 8px; font-family: sans-serif;">
                            <div style="font-weight: bold; color: #1E40AF; margin-bottom: 4px;">📍 Adresse exacte</div>
                            <div style="color: #374151;">${address}</div>
                        </div>`
                    });

                    const marker = new google.maps.Marker({
                        position: center,
                        map,
                        title: address,
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                } else {
                    // Afficher un cercle de périmètre approximatif
                    const circleRadius = radius || 500; // 500m par défaut

                    new google.maps.Circle({
                        strokeColor: '#1E40AF',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#1E40AF',
                        fillOpacity: 0.2,
                        map,
                        center,
                        radius: circleRadius,
                    });

                    // Marqueur au centre du cercle
                    new google.maps.Marker({
                        position: center,
                        map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#1E40AF',
                            fillOpacity: 0.8,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                        }
                    });
                }

                setIsLoading(false);
            } catch (err) {
                console.error('Erreur lors de l\'initialisation de la carte:', err);
                setError('Erreur lors de l\'affichage de la carte');
                setIsLoading(false);
            }
        };

        loadGoogleMaps();
    }, [address, latitude, longitude, radius, showExactLocation]);

    if (error) {
        return (
            <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium mb-1">Carte non disponible</p>
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-50 rounded-2xl flex items-center justify-center z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            )}
            <div
                ref={mapRef}
                className="w-full h-[400px] rounded-2xl border border-gray-200 shadow-sm"
                style={{ minHeight: '400px' }}
            />
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
