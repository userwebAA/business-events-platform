'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Award, Info } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Badge from '@/components/Badge';
import { BADGE_CONFIGS, BadgeType } from 'shared';

export default function BadgesManagementPage() {
    const [selectedBadges, setSelectedBadges] = useState<BadgeType[]>(['regular']);

    const toggleBadge = (badgeType: BadgeType) => {
        if (selectedBadges.includes(badgeType)) {
            setSelectedBadges(selectedBadges.filter(b => b !== badgeType));
        } else {
            setSelectedBadges([...selectedBadges, badgeType]);
        }
    };

    const handleSave = () => {
        // TODO: Sauvegarder les badges dans la base de données
        console.log('Badges sauvegardés:', selectedBadges);
        alert('Badges sauvegardés avec succès !');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <Link href="/dashboard/settings" className="inline-flex items-center text-sky-600 hover:text-sky-700 mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour aux paramètres
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="h-8 w-8 text-sky-500" />
                        <h1 className="text-3xl font-bold text-gray-900">Gestion des badges</h1>
                    </div>
                    <p className="text-gray-600">Personnalisez vos badges pour vous démarquer lors des événements</p>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-8">
                    <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-sky-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-sky-900 mb-1">À propos des badges</h3>
                            <p className="text-sm text-sky-800">
                                Les badges sont affichés sur votre profil et visibles par les autres participants 30 minutes avant les événements.
                                Ils permettent de vous identifier rapidement lors des événements.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Mes badges actuels</h2>
                    {selectedBadges.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedBadges.map((badgeType) => (
                                <Badge key={badgeType} type={badgeType} size="md" />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">Aucun badge sélectionné</p>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Badges disponibles</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(BADGE_CONFIGS).map(([type, config]) => {
                            const isSelected = selectedBadges.includes(type as BadgeType);

                            return (
                                <div
                                    key={type}
                                    onClick={() => toggleBadge(type as BadgeType)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                            ? 'border-sky-500 bg-sky-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <Badge type={type as BadgeType} size="md" />
                                        {isSelected && (
                                            <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{config.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="bg-sky-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-sky-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                        <Award className="h-5 w-5" />
                        Sauvegarder mes badges
                    </button>
                </div>
            </div>
        </div>
    );
}
