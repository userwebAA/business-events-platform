'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Database, Clock, UserCheck, Trash2, Mail } from 'lucide-react';
import Navbar from '@/components/Navbar';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-sky-600 mb-6 font-medium transition-colors text-sm">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à l&apos;accueil
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-6 sm:px-8 py-8">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-8 w-8 text-white/90" />
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">Politique de confidentialité</h1>
                        </div>
                        <p className="text-sky-100 text-sm">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="px-6 sm:px-8 py-8 space-y-8">

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Database className="h-5 w-5 text-sky-500" />
                                1. Données collectées
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                Dans le cadre de l&apos;utilisation de notre plateforme, nous collectons les données suivantes :
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données d&apos;identification :</strong> nom, prénom, adresse email, mot de passe (hashé), numéro de téléphone (optionnel)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données professionnelles :</strong> entreprise, poste, compétences, bio, lien LinkedIn (optionnels)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données média :</strong> photo de profil, vidéo de présentation (optionnels)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données d&apos;inscription :</strong> événements auxquels vous vous inscrivez, formulaires d&apos;inscription remplis</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données de paiement :</strong> les paiements sont traités par Stripe. Nous ne stockons pas vos informations bancaires.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-sky-500" />
                                2. Finalités du traitement
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                Vos données sont utilisées pour :
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span>Créer et gérer votre compte utilisateur</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span>Permettre votre inscription aux événements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span>Afficher votre profil public aux autres participants pour faciliter le networking</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span>Vous envoyer des emails de confirmation, rappels et notifications liées à vos événements</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span>Traiter les paiements et générer les factures</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-sky-500" />
                                3. Durée de conservation
                            </h2>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données de compte :</strong> conservées tant que votre compte est actif. Supprimées à la demande.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données d&apos;inscription :</strong> conservées pour la durée de l&apos;événement + 2 mois (factures).</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Données de paiement :</strong> conservées par Stripe selon leur propre politique.</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-sky-500" />
                                4. Vos droits
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                Conformément au RGPD, vous disposez des droits suivants :
                            </p>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Droit d&apos;accès :</strong> consulter vos données depuis votre profil et vos paramètres</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Droit de rectification :</strong> modifier vos informations à tout moment dans les paramètres</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Droit de suppression :</strong> supprimer votre compte et toutes vos données depuis les paramètres de sécurité</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Droit de portabilité :</strong> demander l&apos;export de vos données par email</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-1.5 shrink-0"></span>
                                    <span><strong>Droit de visibilité :</strong> masquer vos événements de votre profil public</span>
                                </li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-sky-500" />
                                5. Cookies
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Ce site utilise uniquement un cookie technique d&apos;authentification (JWT) strictement nécessaire au fonctionnement du service. 
                                <strong> Aucun cookie publicitaire, de tracking ou d&apos;analyse</strong> n&apos;est déposé sur votre navigateur.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-sky-500" />
                                6. Contact
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                Pour toute question relative à la protection de vos données personnelles, vous pouvez nous contacter à :
                            </p>
                            <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
                                <p className="text-sm font-bold text-sky-700">contact@businessevents.com</p>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
