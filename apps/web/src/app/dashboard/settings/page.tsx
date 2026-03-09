'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, User, Bell, Shield, Globe, Mail, Phone, MapPin,
    Save, Camera, Linkedin, Briefcase, Building, Loader2, Check,
    ChevronRight, Lock, Trash2, AlertTriangle, Eye, EyeOff, Upload, FileCheck, Clock, X, CreditCard, Video
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [previewImage, setPreviewImage] = useState('');
    const [profileVideo, setProfileVideo] = useState('');
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [videoError, setVideoError] = useState('');

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        position: '',
        linkedin: '',
        location: '',
        bio: '',
        avatar: '',
        firstName: '',
        lastName: '',
        skills: [] as string[],
    });

    const [skillInput, setSkillInput] = useState('');

    // Security states
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Identity verification states
    const [identityStatus, setIdentityStatus] = useState<string>('none');
    const [identityRejectReason, setIdentityRejectReason] = useState<string>('');
    const [identityDoc, setIdentityDoc] = useState<string>('');
    const [identityPreview, setIdentityPreview] = useState<string>('');
    const [submittingIdentity, setSubmittingIdentity] = useState(false);
    const [identityMessage, setIdentityMessage] = useState('');
    const [identityError, setIdentityError] = useState('');

    // Stripe Connect states
    const [stripeStatus, setStripeStatus] = useState<{ connected: boolean; onboardingComplete: boolean; chargesEnabled: boolean; payoutsEnabled: boolean }>({ connected: false, onboardingComplete: false, chargesEnabled: false, payoutsEnabled: false });
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stripeError, setStripeError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const [profileRes, identityRes, stripeRes] = await Promise.all([
                    fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/user/identity', { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch('/api/stripe/connect', { headers: { 'Authorization': `Bearer ${token}` } }),
                ]);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile({
                        name: data.user.name || '',
                        email: data.user.email || '',
                        phone: data.user.phone || '',
                        company: data.user.company || '',
                        position: data.user.position || '',
                        linkedin: data.user.linkedin || '',
                        location: data.user.location || '',
                        bio: data.user.bio || '',
                        avatar: data.user.photo || '',
                        firstName: data.user.firstName || '',
                        lastName: data.user.lastName || '',
                        skills: data.user.skills || [],
                    });
                    if (data.user.photo) setPreviewImage(data.user.photo);
                    if (data.user.profileVideo) setProfileVideo(data.user.profileVideo);
                }
                if (identityRes.ok) {
                    const idData = await identityRes.json();
                    setIdentityStatus(idData.identityStatus || 'none');
                    setIdentityRejectReason(idData.identityRejectReason || '');
                }
                if (stripeRes.ok) {
                    const stripeData = await stripeRes.json();
                    setStripeStatus(stripeData);
                }
            } catch (error) {
                console.error('Erreur chargement profil:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const [preferences, setPreferences] = useState({
        language: 'fr',
        timezone: 'Europe/Paris',
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
    });

    const [notifications, setNotifications] = useState({
        emailNewEvent: true,
        emailRegistration: true,
        emailReminder: true,
        pushNewEvent: false,
        pushRegistration: true,
        pushReminder: true,
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreviewImage(result);
                setProfile(prev => ({ ...prev, avatar: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setVideoError('');

        if (!file.type.startsWith('video/')) {
            setVideoError('Le fichier doit être une vidéo');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setVideoError('La vidéo ne doit pas dépasser 20 Mo');
            return;
        }

        // Vérifier la durée
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(file);
        video.src = url;

        video.onloadedmetadata = async () => {
            URL.revokeObjectURL(url);
            if (video.duration > 35) {
                setVideoError('La vidéo ne doit pas dépasser 30 secondes');
                return;
            }

            setUploadingVideo(true);
            try {
                const token = localStorage.getItem('token');
                const formData = new FormData();
                formData.append('video', file);
                const res = await fetch('/api/user/profile-video', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData,
                });
                if (res.ok) {
                    const data = await res.json();
                    setProfileVideo(data.videoUrl);
                } else {
                    const err = await res.json();
                    setVideoError(err.error || 'Erreur upload');
                }
            } catch (err) {
                setVideoError('Erreur de connexion');
            } finally {
                setUploadingVideo(false);
            }
        };
    };

    const handleVideoDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/profile-video', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setProfileVideo('');
            }
        } catch (err) {
            console.error('Erreur suppression vidéo:', err);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
            setProfile(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phone: profile.phone,
                    position: profile.position,
                    company: profile.company,
                    bio: profile.bio,
                    location: profile.location,
                    linkedin: profile.linkedin,
                    photo: profile.avatar,
                    skills: profile.skills,
                })
            });
            if (response.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        } finally {
            setSaving(false);
        }
    };

    const sections = [
        { id: 'profile' as const, label: 'Profil', icon: User, color: 'sky' },
        { id: 'preferences' as const, label: 'Préférences', icon: Globe, color: 'violet' },
        { id: 'notifications' as const, label: 'Notifications', icon: Bell, color: 'amber' },
        { id: 'security' as const, label: 'Sécurité', icon: Shield, color: 'emerald' },
    ];

    const initials = (profile.firstName?.charAt(0) || profile.name?.charAt(0) || 'U').toUpperCase();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-sky-600 transition-colors mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Retour au tableau de bord
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Paramètres</h1>
                    <p className="text-gray-500 mt-1">Gérez vos informations et préférences</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        {/* Profile card mini */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
                            <div className="flex items-center gap-3">
                                {previewImage ? (
                                    <img src={previewImage} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                        {initials}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{profile.firstName || profile.name} {profile.lastName}</p>
                                    <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Nav - horizontal on mobile, vertical on desktop */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-1">
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`flex items-center justify-between px-3 py-3 rounded-xl transition-all text-sm lg:w-full ${isActive
                                            ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200/50'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 lg:gap-3">
                                            <Icon className="h-4 w-4" />
                                            <span className="font-semibold text-xs sm:text-sm">{section.label}</span>
                                        </div>
                                        {isActive && <ChevronRight className="h-4 w-4 hidden lg:block ml-2" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                            {/* ============ PROFIL ============ */}
                            {activeSection === 'profile' && (
                                <div>
                                    {/* Banner */}
                                    <div className="h-28 sm:h-36 bg-gradient-to-r from-sky-500 via-blue-500 to-blue-600 relative">
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)' }} />
                                    </div>

                                    <div className="px-6 sm:px-8 pb-8 -mt-14">
                                        {/* Avatar */}
                                        <div className="flex flex-col sm:flex-row items-start gap-5 mb-8">
                                            <div className="relative shrink-0">
                                                {previewImage ? (
                                                    <img src={previewImage} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-xl" />
                                                ) : (
                                                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-xl">
                                                        {initials}
                                                    </div>
                                                )}
                                                <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform">
                                                    <Camera className="h-4 w-4 text-white" />
                                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                                </label>
                                            </div>
                                            <div className="pt-0 sm:pt-14">
                                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.firstName || profile.name} {profile.lastName}</h2>
                                                <p className="text-gray-500 text-sm">{profile.position}{profile.company ? ` chez ${profile.company}` : ''}</p>
                                            </div>
                                        </div>

                                        {/* Form */}
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <User className="h-4 w-4 text-sky-500" />
                                                    Informations personnelles
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom</label>
                                                        <input
                                                            type="text"
                                                            value={profile.firstName}
                                                            onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="Jean"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom</label>
                                                        <input
                                                            type="text"
                                                            value={profile.lastName}
                                                            onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="Dupont"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                            <Mail className="inline h-3.5 w-3.5 mr-1 text-gray-400" />Email
                                                        </label>
                                                        <input
                                                            type="email"
                                                            value={profile.email}
                                                            disabled
                                                            className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                            <Phone className="inline h-3.5 w-3.5 mr-1 text-gray-400" />Téléphone
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            value={profile.phone}
                                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="06 12 34 56 78"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                            <MapPin className="inline h-3.5 w-3.5 mr-1 text-gray-400" />Localisation
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={profile.location}
                                                            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="Paris, France"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-sky-500" />
                                                    Informations professionnelles
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                            <Briefcase className="inline h-3.5 w-3.5 mr-1 text-gray-400" />Poste
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={profile.position}
                                                            onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="Développeur Senior"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                            <Building className="inline h-3.5 w-3.5 mr-1 text-gray-400" />Entreprise
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={profile.company}
                                                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="TechCorp"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                                            <Linkedin className="inline h-3.5 w-3.5 mr-1 text-gray-400" />LinkedIn
                                                        </label>
                                                        <input
                                                            type="url"
                                                            value={profile.linkedin}
                                                            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
                                                            placeholder="https://linkedin.com/in/jean-dupont"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Bio</h3>
                                                <textarea
                                                    value={profile.bio}
                                                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                    rows={4}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                                                    placeholder="Parlez-nous de vous, votre parcours, vos passions..."
                                                />
                                                <p className="text-xs text-gray-400 mt-1">{profile.bio.length}/500 caractères</p>
                                            </div>

                                            <div className="border-t border-gray-100 pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Vidéo de présentation</h3>
                                                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Optionnel</span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4">Enregistrez une courte vidéo de 30 secondes pour vous présenter aux autres participants. C&apos;est un excellent moyen de créer du lien !</p>

                                                {profileVideo ? (
                                                    <div className="space-y-3">
                                                        <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                                                            <video
                                                                src={profileVideo}
                                                                controls
                                                                className="w-full h-full object-contain"
                                                                preload="metadata"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sky-50 text-sky-600 rounded-xl text-sm font-semibold hover:bg-sky-100 transition-all border border-sky-100 cursor-pointer">
                                                                <Video className="h-4 w-4" />
                                                                Remplacer
                                                                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                                                            </label>
                                                            <button
                                                                onClick={handleVideoDelete}
                                                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all border border-red-100"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className={`flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadingVideo ? 'border-sky-300 bg-sky-50' : 'border-gray-200 hover:border-sky-300 hover:bg-sky-50/50'}`}>
                                                        {uploadingVideo ? (
                                                            <>
                                                                <Loader2 className="h-8 w-8 text-sky-500 animate-spin" />
                                                                <p className="text-sm text-sky-600 font-medium">Upload en cours...</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-14 h-14 bg-sky-100 rounded-xl flex items-center justify-center">
                                                                    <Video className="h-7 w-7 text-sky-500" />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="text-sm font-semibold text-gray-700">Cliquez pour ajouter une vidéo</p>
                                                                    <p className="text-xs text-gray-400 mt-1">30 secondes max · MP4, MOV · 20 Mo max</p>
                                                                </div>
                                                            </>
                                                        )}
                                                        <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploadingVideo} />
                                                    </label>
                                                )}
                                                {videoError && (
                                                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1.5">
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        {videoError}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="border-t border-gray-100 pt-6">
                                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Compétences</h3>
                                                <div className="flex gap-2 mb-3">
                                                    <input
                                                        type="text"
                                                        value={skillInput}
                                                        onChange={(e) => setSkillInput(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                                        placeholder="Ajouter une compétence..."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={addSkill}
                                                        disabled={!skillInput.trim()}
                                                        className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-sm font-semibold"
                                                    >
                                                        Ajouter
                                                    </button>
                                                </div>
                                                {profile.skills.length > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {profile.skills.map((skill, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium border border-sky-100">
                                                                {skill}
                                                                <button onClick={() => removeSkill(skill)} className="text-sky-400 hover:text-red-500 transition-colors">
                                                                    <span className="text-base leading-none">&times;</span>
                                                                </button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">Aucune compétence ajoutée</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ============ PRÉFÉRENCES ============ */}
                            {activeSection === 'preferences' && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                            <Globe className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Préférences</h2>
                                            <p className="text-sm text-gray-500">Personnalisez votre expérience</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Langue</label>
                                            <select
                                                value={preferences.language}
                                                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 transition-all"
                                            >
                                                <option value="fr">Français</option>
                                                <option value="en">English</option>
                                                <option value="es">Español</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fuseau horaire</label>
                                            <select
                                                value={preferences.timezone}
                                                onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 transition-all"
                                            >
                                                <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                                                <option value="Europe/London">Europe/London (GMT+0)</option>
                                                <option value="America/New_York">America/New York (GMT-5)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Devise</label>
                                            <select
                                                value={preferences.currency}
                                                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 transition-all"
                                            >
                                                <option value="EUR">EUR (€)</option>
                                                <option value="USD">USD ($)</option>
                                                <option value="GBP">GBP (£)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Format de date</label>
                                            <select
                                                value={preferences.dateFormat}
                                                onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-gray-900 transition-all"
                                            >
                                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ============ NOTIFICATIONS ============ */}
                            {activeSection === 'notifications' && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                            <Bell className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                                            <p className="text-sm text-gray-500">Choisissez comment être notifié</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                Par email
                                            </h3>
                                            <div className="space-y-3">
                                                {[
                                                    { key: 'emailNewEvent', label: 'Nouveaux événements', desc: 'Recevoir un email pour les nouveaux événements' },
                                                    { key: 'emailRegistration', label: 'Inscriptions', desc: 'Confirmation par email lors d\'une inscription' },
                                                    { key: 'emailReminder', label: 'Rappels', desc: 'Rappels avant le début des événements' },
                                                ].map(item => (
                                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-sky-200 transition-all cursor-pointer group"
                                                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}>
                                                        <div className="min-w-0 flex-1 mr-4">
                                                            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={notifications[item.key as keyof typeof notifications]}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-sky-500' : 'bg-gray-200'}`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <Bell className="h-4 w-4 text-gray-400" />
                                                Notifications push
                                            </h3>
                                            <div className="space-y-3">
                                                {[
                                                    { key: 'pushNewEvent', label: 'Nouveaux événements', desc: 'Notification push pour les nouveaux événements' },
                                                    { key: 'pushRegistration', label: 'Inscriptions', desc: 'Notification push lors d\'une inscription' },
                                                    { key: 'pushReminder', label: 'Rappels', desc: 'Notification push avant les événements' },
                                                ].map(item => (
                                                    <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-sky-200 transition-all cursor-pointer group"
                                                        onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}>
                                                        <div className="min-w-0 flex-1 mr-4">
                                                            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            role="switch"
                                                            aria-checked={notifications[item.key as keyof typeof notifications]}
                                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notifications[item.key as keyof typeof notifications] ? 'bg-sky-500' : 'bg-gray-200'}`}
                                                        >
                                                            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${notifications[item.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ============ SÉCURITÉ ============ */}
                            {activeSection === 'security' && (
                                <div className="p-6 sm:p-8">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <Shield className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">Sécurité</h2>
                                            <p className="text-sm text-gray-500">Protégez votre compte</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Mot de passe */}
                                        <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                    <Lock className="h-5 w-5 text-gray-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900">Mot de passe</h3>
                                                    <p className="text-sm text-gray-500 mt-0.5">Modifiez votre mot de passe régulièrement pour plus de sécurité</p>

                                                    {!showPasswordForm ? (
                                                        <button
                                                            onClick={() => { setShowPasswordForm(true); setPasswordError(''); setPasswordSuccess(''); }}
                                                            className="mt-3 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm"
                                                        >
                                                            Changer le mot de passe
                                                        </button>
                                                    ) : (
                                                        <div className="mt-4 space-y-3">
                                                            <div className="relative">
                                                                <input
                                                                    type={showCurrentPw ? 'text' : 'password'}
                                                                    value={passwordData.currentPassword}
                                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all text-gray-900 placeholder:text-gray-400 pr-10 text-sm"
                                                                    placeholder="Mot de passe actuel"
                                                                />
                                                                <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </button>
                                                            </div>
                                                            <div className="relative">
                                                                <input
                                                                    type={showNewPw ? 'text' : 'password'}
                                                                    value={passwordData.newPassword}
                                                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all text-gray-900 placeholder:text-gray-400 pr-10 text-sm"
                                                                    placeholder="Nouveau mot de passe (min. 8 caractères)"
                                                                />
                                                                <button type="button" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="password"
                                                                value={passwordData.confirmPassword}
                                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                                                placeholder="Confirmer le nouveau mot de passe"
                                                            />
                                                            {passwordError && <p className="text-sm text-red-600 font-medium">{passwordError}</p>}
                                                            {passwordSuccess && <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5"><Check className="h-4 w-4" />{passwordSuccess}</p>}
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <button
                                                                    onClick={async () => {
                                                                        setPasswordError('');
                                                                        setPasswordSuccess('');
                                                                        if (!passwordData.currentPassword || !passwordData.newPassword) {
                                                                            setPasswordError('Veuillez remplir tous les champs'); return;
                                                                        }
                                                                        if (passwordData.newPassword.length < 8) {
                                                                            setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères'); return;
                                                                        }
                                                                        if (passwordData.newPassword !== passwordData.confirmPassword) {
                                                                            setPasswordError('Les mots de passe ne correspondent pas'); return;
                                                                        }
                                                                        setChangingPassword(true);
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            const res = await fetch('/api/user/change-password', {
                                                                                method: 'PUT',
                                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                                body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
                                                                            });
                                                                            const data = await res.json();
                                                                            if (res.ok) {
                                                                                setPasswordSuccess('Mot de passe modifié avec succès');
                                                                                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                                                                setTimeout(() => { setShowPasswordForm(false); setPasswordSuccess(''); }, 2000);
                                                                            } else {
                                                                                setPasswordError(data.error || 'Erreur lors du changement');
                                                                            }
                                                                        } catch { setPasswordError('Erreur de connexion'); }
                                                                        finally { setChangingPassword(false); }
                                                                    }}
                                                                    disabled={changingPassword}
                                                                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-60"
                                                                >
                                                                    {changingPassword ? <><Loader2 className="h-4 w-4 animate-spin" />Modification...</> : 'Confirmer'}
                                                                </button>
                                                                <button
                                                                    onClick={() => { setShowPasswordForm(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); }}
                                                                    className="px-4 py-2 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all"
                                                                >
                                                                    Annuler
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Badge compte vérifié pour admin */}
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <FileCheck className="h-5 w-5 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-emerald-900">Votre compte est vérifié</h3>
                                                        <p className="text-sm text-emerald-700 mt-0.5">En tant qu&apos;administrateur, votre compte est automatiquement vérifié. Vous pouvez organiser des événements sans restriction.</p>
                                                        <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-100 rounded-xl w-fit">
                                                            <FileCheck className="h-4 w-4 text-emerald-600" />
                                                            <span className="text-sm font-semibold text-emerald-800">Compte vérifié</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Vérification d'identité (uniquement pour les utilisateurs classiques) */}
                                        {user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN' && (
                                            <div className={`p-5 border rounded-xl ${identityStatus === 'verified' ? 'bg-emerald-50 border-emerald-200' :
                                                identityStatus === 'pending' ? 'bg-amber-50 border-amber-200' :
                                                    identityStatus === 'rejected' ? 'bg-red-50 border-red-200' :
                                                        'bg-blue-50 border-blue-200'
                                                }`}>
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${identityStatus === 'verified' ? 'bg-emerald-100' :
                                                        identityStatus === 'pending' ? 'bg-amber-100' :
                                                            identityStatus === 'rejected' ? 'bg-red-100' :
                                                                'bg-blue-100'
                                                        }`}>
                                                        {identityStatus === 'verified' ? <FileCheck className="h-5 w-5 text-emerald-600" /> :
                                                            identityStatus === 'pending' ? <Clock className="h-5 w-5 text-amber-600" /> :
                                                                identityStatus === 'rejected' ? <X className="h-5 w-5 text-red-600" /> :
                                                                    <Shield className="h-5 w-5 text-blue-600" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-gray-900">Vérification d&apos;identité</h3>

                                                        {identityStatus === 'none' && (
                                                            <>
                                                                <p className="text-sm text-gray-600 mt-0.5">Pour organiser des événements, vous devez vérifier votre identité en soumettant une pièce d&apos;identité.</p>
                                                                <div className="mt-4">
                                                                    {identityPreview ? (
                                                                        <div className="mb-3">
                                                                            <img src={identityPreview} alt="Aperçu" className="max-w-xs rounded-xl border border-gray-200 shadow-sm" />
                                                                            <button onClick={() => { setIdentityPreview(''); setIdentityDoc(''); }} className="mt-2 text-sm text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                                                                        </div>
                                                                    ) : (
                                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer bg-white hover:bg-blue-50 transition-all">
                                                                            <Upload className="h-8 w-8 text-blue-400 mb-2" />
                                                                            <span className="text-sm text-blue-600 font-medium">Cliquez pour télécharger votre pièce d&apos;identité</span>
                                                                            <span className="text-xs text-gray-400 mt-1">JPG, PNG (max 5 Mo)</span>
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    if (file.size > 5 * 1024 * 1024) {
                                                                                        setIdentityError('Le fichier ne doit pas dépasser 5 Mo');
                                                                                        return;
                                                                                    }
                                                                                    const reader = new FileReader();
                                                                                    reader.onloadend = () => {
                                                                                        const result = reader.result as string;
                                                                                        setIdentityDoc(result);
                                                                                        setIdentityPreview(result);
                                                                                        setIdentityError('');
                                                                                    };
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }} />
                                                                        </label>
                                                                    )}
                                                                    {identityError && <p className="text-sm text-red-600 font-medium mt-2">{identityError}</p>}
                                                                    {identityDoc && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                setSubmittingIdentity(true);
                                                                                setIdentityError('');
                                                                                setIdentityMessage('');
                                                                                try {
                                                                                    const token = localStorage.getItem('token');
                                                                                    const res = await fetch('/api/user/identity', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                                        body: JSON.stringify({ document: identityDoc }),
                                                                                    });
                                                                                    const data = await res.json();
                                                                                    if (res.ok) {
                                                                                        setIdentityMessage(data.message);
                                                                                        setIdentityStatus('pending');
                                                                                    } else {
                                                                                        setIdentityError(data.error || 'Erreur lors de la soumission');
                                                                                    }
                                                                                } catch { setIdentityError('Erreur de connexion'); }
                                                                                finally { setSubmittingIdentity(false); }
                                                                            }}
                                                                            disabled={submittingIdentity}
                                                                            className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-60"
                                                                        >
                                                                            {submittingIdentity ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi en cours...</> : <><Upload className="h-4 w-4" />Soumettre ma pièce d&apos;identité</>}
                                                                        </button>
                                                                    )}
                                                                    {identityMessage && <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1.5"><Check className="h-4 w-4" />{identityMessage}</p>}
                                                                </div>
                                                            </>
                                                        )}

                                                        {identityStatus === 'pending' && (
                                                            <div className="mt-1">
                                                                <p className="text-sm text-amber-700">Votre demande de vérification est en cours d&apos;examen. Vous serez notifié une fois la vérification terminée (24-48h).</p>
                                                                <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-100 rounded-xl">
                                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                                    <span className="text-sm font-semibold text-amber-800">En attente de vérification</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {identityStatus === 'verified' && (
                                                            <div className="mt-1">
                                                                <p className="text-sm text-emerald-700">Votre identité a été vérifiée avec succès. Vous pouvez organiser des événements.</p>
                                                                <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-100 rounded-xl">
                                                                    <FileCheck className="h-4 w-4 text-emerald-600" />
                                                                    <span className="text-sm font-semibold text-emerald-800">Votre compte est vérifié</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {identityStatus === 'rejected' && (
                                                            <>
                                                                <p className="text-sm text-red-600 mt-0.5">Votre demande a été refusée. Vous pouvez soumettre un nouveau document.</p>
                                                                {identityRejectReason && (
                                                                    <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-xl">
                                                                        <p className="text-sm text-red-800"><strong>Motif :</strong> {identityRejectReason}</p>
                                                                    </div>
                                                                )}
                                                                <div className="mt-4">
                                                                    {identityPreview ? (
                                                                        <div className="mb-3">
                                                                            <img src={identityPreview} alt="Aperçu" className="max-w-xs rounded-xl border border-gray-200 shadow-sm" />
                                                                            <button onClick={() => { setIdentityPreview(''); setIdentityDoc(''); }} className="mt-2 text-sm text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                                                                        </div>
                                                                    ) : (
                                                                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-red-300 rounded-xl cursor-pointer bg-white hover:bg-red-50 transition-all">
                                                                            <Upload className="h-8 w-8 text-red-400 mb-2" />
                                                                            <span className="text-sm text-red-600 font-medium">Télécharger un nouveau document</span>
                                                                            <span className="text-xs text-gray-400 mt-1">JPG, PNG (max 5 Mo)</span>
                                                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    if (file.size > 5 * 1024 * 1024) {
                                                                                        setIdentityError('Le fichier ne doit pas dépasser 5 Mo');
                                                                                        return;
                                                                                    }
                                                                                    const reader = new FileReader();
                                                                                    reader.onloadend = () => {
                                                                                        const result = reader.result as string;
                                                                                        setIdentityDoc(result);
                                                                                        setIdentityPreview(result);
                                                                                        setIdentityError('');
                                                                                    };
                                                                                    reader.readAsDataURL(file);
                                                                                }
                                                                            }} />
                                                                        </label>
                                                                    )}
                                                                    {identityError && <p className="text-sm text-red-600 font-medium mt-2">{identityError}</p>}
                                                                    {identityDoc && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                setSubmittingIdentity(true);
                                                                                setIdentityError('');
                                                                                setIdentityMessage('');
                                                                                try {
                                                                                    const token = localStorage.getItem('token');
                                                                                    await fetch('/api/user/identity', {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                                        body: JSON.stringify({ document: identityDoc }),
                                                                                    }).then(async (res) => {
                                                                                        const data = await res.json();
                                                                                        if (res.ok) {
                                                                                            setIdentityMessage(data.message);
                                                                                            setIdentityStatus('pending');
                                                                                        } else {
                                                                                            setIdentityError(data.error || 'Erreur');
                                                                                        }
                                                                                    });
                                                                                } catch { setIdentityError('Erreur de connexion'); }
                                                                                finally { setSubmittingIdentity(false); }
                                                                            }}
                                                                            disabled={submittingIdentity}
                                                                            className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-sky-600 hover:to-blue-700 transition-all shadow-sm disabled:opacity-60"
                                                                        >
                                                                            {submittingIdentity ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi...</> : <><Upload className="h-4 w-4" />Resoumettre</>}
                                                                        </button>
                                                                    )}
                                                                    {identityMessage && <p className="text-sm text-emerald-600 font-medium mt-2 flex items-center gap-1.5"><Check className="h-4 w-4" />{identityMessage}</p>}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Configuration Stripe - Paiements */}
                                        <div className={`p-5 border rounded-xl ${stripeStatus.onboardingComplete ? 'bg-emerald-50 border-emerald-200' : 'bg-violet-50 border-violet-200'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stripeStatus.onboardingComplete ? 'bg-emerald-100' : 'bg-violet-100'}`}>
                                                    <CreditCard className={`h-5 w-5 ${stripeStatus.onboardingComplete ? 'text-emerald-600' : 'text-violet-600'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-900">Configuration des paiements</h3>

                                                    {stripeStatus.onboardingComplete ? (
                                                        <div className="mt-1">
                                                            <p className="text-sm text-emerald-700">Votre compte de paiement est configuré. Vous pouvez recevoir les recettes de vos événements payants.</p>
                                                            <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-emerald-100 rounded-xl w-fit">
                                                                <Check className="h-4 w-4 text-emerald-600" />
                                                                <span className="text-sm font-semibold text-emerald-800">Paiements activés</span>
                                                            </div>
                                                        </div>
                                                    ) : stripeStatus.connected ? (
                                                        <div className="mt-1">
                                                            <p className="text-sm text-amber-700">Votre compte Stripe est créé mais la configuration n&apos;est pas terminée. Complétez-la pour recevoir vos paiements.</p>
                                                            {stripeError && <p className="text-sm text-red-600 mt-2">{stripeError}</p>}
                                                            <button
                                                                onClick={async () => {
                                                                    setStripeLoading(true);
                                                                    setStripeError('');
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        const res = await fetch('/api/stripe/connect', {
                                                                            method: 'POST',
                                                                            headers: { 'Authorization': `Bearer ${token}` },
                                                                        });
                                                                        const data = await res.json();
                                                                        if (res.ok && data.url) {
                                                                            window.location.href = data.url;
                                                                        } else {
                                                                            setStripeError(data.error || 'Erreur lors de la configuration Stripe');
                                                                            setStripeLoading(false);
                                                                        }
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        setStripeError('Erreur réseau, réessayez.');
                                                                        setStripeLoading(false);
                                                                    }
                                                                }}
                                                                disabled={stripeLoading}
                                                                className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm disabled:opacity-60"
                                                            >
                                                                {stripeLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Chargement...</> : <><CreditCard className="h-4 w-4" />Terminer la configuration</>}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="mt-1">
                                                            <p className="text-sm text-gray-600">Pour recevoir les paiements de vos événements payants, configurez votre compte de paiement Stripe. Cela prend 2-3 minutes.</p>
                                                            {stripeError && <p className="text-sm text-red-600 mt-2">{stripeError}</p>}
                                                            <button
                                                                onClick={async () => {
                                                                    setStripeLoading(true);
                                                                    setStripeError('');
                                                                    try {
                                                                        const token = localStorage.getItem('token');
                                                                        const res = await fetch('/api/stripe/connect', {
                                                                            method: 'POST',
                                                                            headers: { 'Authorization': `Bearer ${token}` },
                                                                        });
                                                                        const data = await res.json();
                                                                        if (res.ok && data.url) {
                                                                            window.location.href = data.url;
                                                                        } else {
                                                                            setStripeError(data.error || 'Erreur lors de la configuration Stripe');
                                                                            setStripeLoading(false);
                                                                        }
                                                                    } catch (e) {
                                                                        console.error(e);
                                                                        setStripeError('Erreur réseau, réessayez.');
                                                                        setStripeLoading(false);
                                                                    }
                                                                }}
                                                                disabled={stripeLoading}
                                                                className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm disabled:opacity-60"
                                                            >
                                                                {stripeLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Chargement...</> : <><CreditCard className="h-4 w-4" />Configurer mes paiements</>}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Supprimer le compte */}
                                        <div className="p-5 bg-red-50 border border-red-100 rounded-xl mt-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-red-900">Zone dangereuse</h3>
                                                    <p className="text-sm text-red-600 mt-0.5">La suppression de votre compte est définitive et irréversible</p>

                                                    {!showDeleteConfirm ? (
                                                        <button
                                                            onClick={() => { setShowDeleteConfirm(true); setDeleteError(''); }}
                                                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
                                                        >
                                                            <Trash2 className="inline h-4 w-4 mr-1.5" />
                                                            Supprimer mon compte
                                                        </button>
                                                    ) : (
                                                        <div className="mt-4 space-y-3">
                                                            <div className="p-3 bg-red-100 border border-red-200 rounded-xl">
                                                                <p className="text-sm text-red-800 font-medium">Toutes vos données seront supprimées : profil, inscriptions, notifications. Cette action ne peut pas être annulée.</p>
                                                            </div>
                                                            <input
                                                                type="password"
                                                                value={deletePassword}
                                                                onChange={(e) => setDeletePassword(e.target.value)}
                                                                className="w-full px-4 py-2.5 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-gray-900 placeholder:text-gray-400 text-sm"
                                                                placeholder="Entrez votre mot de passe pour confirmer"
                                                            />
                                                            {deleteError && <p className="text-sm text-red-600 font-medium">{deleteError}</p>}
                                                            <div className="flex items-center gap-2 pt-1">
                                                                <button
                                                                    onClick={async () => {
                                                                        setDeleteError('');
                                                                        if (!deletePassword) { setDeleteError('Veuillez entrer votre mot de passe'); return; }
                                                                        setDeleting(true);
                                                                        try {
                                                                            const token = localStorage.getItem('token');
                                                                            const res = await fetch('/api/user/delete-account', {
                                                                                method: 'DELETE',
                                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                                body: JSON.stringify({ password: deletePassword })
                                                                            });
                                                                            const data = await res.json();
                                                                            if (res.ok) {
                                                                                localStorage.removeItem('token');
                                                                                sessionStorage.clear();
                                                                                document.cookie = 'token=; path=/; max-age=0';
                                                                                window.location.href = '/';
                                                                            } else {
                                                                                setDeleteError(data.error || 'Erreur lors de la suppression');
                                                                            }
                                                                        } catch { setDeleteError('Erreur de connexion'); }
                                                                        finally { setDeleting(false); }
                                                                    }}
                                                                    disabled={deleting}
                                                                    className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-60"
                                                                >
                                                                    {deleting ? <><Loader2 className="h-4 w-4 animate-spin" />Suppression...</> : <><Trash2 className="h-4 w-4" />Confirmer la suppression</>}
                                                                </button>
                                                                <button
                                                                    onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setDeleteError(''); }}
                                                                    className="px-4 py-2 text-gray-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all"
                                                                >
                                                                    Annuler
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Save bar */}
                            <div className="px-4 sm:px-6 md:px-8 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div>
                                    {saved && (
                                        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                                            <Check className="h-4 w-4" />
                                            Modifications enregistrées
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button
                                        onClick={() => window.history.back()}
                                        className="flex-1 sm:flex-none px-5 py-2.5 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all text-sm"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-200/50 disabled:opacity-60 text-sm"
                                    >
                                        {saving ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" />Sauvegarde...</>
                                        ) : (
                                            <><Save className="h-4 w-4" />Sauvegarder</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
