'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    Camera, Briefcase, Building, MapPin, User, Phone, Link2,
    ChevronRight, ChevronLeft, Check, Sparkles, Plus, X, Loader2, FileText
} from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Identité', icon: User },
    { id: 2, title: 'Professionnel', icon: Briefcase },
    { id: 3, title: 'À propos', icon: FileText },
];

export default function ProfileSetupPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [previewImage, setPreviewImage] = useState<string>('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        position: '',
        company: '',
        bio: '',
        location: '',
        skills: [] as string[],
        linkedin: '',
        photo: ''
    });

    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        if (user?.profileCompleted) {
            router.push('/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await fetch('/api/user/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data) {
                        setFormData(prev => ({
                            ...prev,
                            firstName: data.firstName || '',
                            lastName: data.lastName || '',
                            phone: data.phone || '',
                            position: data.position || '',
                            company: data.company || '',
                            bio: data.bio || '',
                            location: data.location || '',
                            skills: data.skills || [],
                            linkedin: data.linkedin || '',
                            photo: data.photo || '',
                        }));
                        if (data.photo) setPreviewImage(data.photo);
                    }
                }
            } catch (e) { /* silently fail */ }
        };
        loadProfile();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreviewImage(result);
                setFormData(prev => ({ ...prev, photo: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });
            if (response.ok) {
                await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const canGoNext = () => {
        if (currentStep === 1) return formData.firstName && formData.lastName && formData.phone;
        if (currentStep === 2) return formData.position;
        return true;
    };

    const nextStep = () => {
        if (currentStep < 3 && canGoNext()) setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(prev => prev - 1);
    };

    const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100;

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-sky-200 rounded-full opacity-20 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl" />
            </div>

            <div className="relative z-10 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">

                    {/* Logo + Header */}
                    <div className="text-center mb-8 sm:mb-10">
                        <div className="inline-flex items-center gap-2.5 mb-6">
                            <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2.5 rounded-xl shadow-lg">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">
                                TAFF <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600">Events</span>
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3">
                            Complétez votre profil
                        </h1>
                        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                            Quelques informations pour personnaliser votre expérience et rejoindre le réseau
                        </p>
                    </div>

                    {/* Progress Steps */}
                    <div className="mb-8 sm:mb-10">
                        <div className="flex items-center justify-between max-w-sm mx-auto mb-3">
                            {STEPS.map((step) => {
                                const StepIcon = step.icon;
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div key={step.id} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isCompleted
                                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-200'
                                                : isActive
                                                    ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-200'
                                                    : 'bg-gray-100 text-gray-400'
                                        }`}>
                                            {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                                        </div>
                                        <span className={`text-xs font-semibold transition-colors ${
                                            isActive ? 'text-sky-600' : isCompleted ? 'text-emerald-600' : 'text-gray-400'
                                        }`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="max-w-sm mx-auto h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">

                        {/* Step 1: Identité */}
                        {currentStep === 1 && (
                            <div className="p-6 sm:p-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                                        <User className="h-5 w-5 text-sky-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Informations personnelles</h2>
                                        <p className="text-sm text-gray-500">Comment souhaitez-vous être identifié ?</p>
                                    </div>
                                </div>

                                {/* Photo de profil */}
                                <div className="flex flex-col items-center mb-8">
                                    <div className="relative group mb-4">
                                        {previewImage ? (
                                            <img
                                                className="h-28 w-28 object-cover rounded-full ring-4 ring-sky-100 shadow-lg"
                                                src={previewImage}
                                                alt="Photo de profil"
                                            />
                                        ) : (
                                            <div className="h-28 w-28 bg-gradient-to-br from-sky-100 to-blue-100 rounded-full flex items-center justify-center ring-4 ring-sky-50">
                                                <User className="h-12 w-12 text-sky-400" />
                                            </div>
                                        )}
                                        <label className="absolute bottom-0 right-0 w-9 h-9 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                            <Camera className="h-4 w-4 text-white" />
                                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-400">Cliquez sur l&apos;icône pour ajouter une photo</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Prénom <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="Jean"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Nom <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="Dupont"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Phone className="inline h-4 w-4 mr-1.5 text-gray-400" />
                                                Téléphone <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="06 12 34 56 78"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <MapPin className="inline h-4 w-4 mr-1.5 text-gray-400" />
                                                Localisation
                                            </label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="Paris, France"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Professionnel */}
                        {currentStep === 2 && (
                            <div className="p-6 sm:p-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <Briefcase className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Parcours professionnel</h2>
                                        <p className="text-sm text-gray-500">Votre activité et vos compétences</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Briefcase className="inline h-4 w-4 mr-1.5 text-gray-400" />
                                                Poste <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="position"
                                                value={formData.position}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="Développeur Senior"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                <Building className="inline h-4 w-4 mr-1.5 text-gray-400" />
                                                Entreprise
                                            </label>
                                            <input
                                                type="text"
                                                name="company"
                                                value={formData.company}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="TechCorp"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            <Link2 className="inline h-4 w-4 mr-1.5 text-gray-400" />
                                            LinkedIn
                                        </label>
                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={formData.linkedin}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                            placeholder="https://linkedin.com/in/jean-dupont"
                                        />
                                    </div>

                                    {/* Compétences */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Compétences</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400"
                                                placeholder="Ex: React, Marketing, Finance..."
                                            />
                                            <button
                                                type="button"
                                                onClick={addSkill}
                                                disabled={!skillInput.trim()}
                                                className="px-4 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                <Plus className="h-5 w-5" />
                                            </button>
                                        </div>
                                        {formData.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {formData.skills.map((skill, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium border border-sky-100"
                                                    >
                                                        {skill}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSkill(skill)}
                                                            className="text-sky-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {formData.skills.length === 0 && (
                                            <p className="text-xs text-gray-400">Ajoutez vos compétences pour être visible dans le networking</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: À propos */}
                        {currentStep === 3 && (
                            <div className="p-6 sm:p-10">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-gray-900">Dernière étape !</h2>
                                        <p className="text-sm text-gray-500">Parlez un peu de vous</p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Bio professionnelle</label>
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            rows={5}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all placeholder:text-gray-400 resize-none"
                                            placeholder="Décrivez votre parcours, vos passions professionnelles, ce que vous recherchez dans le networking..."
                                        />
                                        <p className="text-xs text-gray-400 mt-1.5">{formData.bio.length}/500 caractères</p>
                                    </div>

                                    {/* Aperçu du profil */}
                                    <div className="bg-gradient-to-br from-gray-50 to-sky-50 rounded-xl p-5 border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-700 mb-4">Aperçu de votre profil</h3>
                                        <div className="flex items-start gap-4">
                                            {previewImage ? (
                                                <img
                                                    src={previewImage}
                                                    alt=""
                                                    className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-sm shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0">
                                                    {formData.firstName ? formData.firstName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-gray-900 truncate">
                                                    {formData.firstName || 'Prénom'} {formData.lastName || 'Nom'}
                                                </h4>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {formData.position || 'Poste'}{formData.company ? ` chez ${formData.company}` : ''}
                                                </p>
                                                {formData.location && (
                                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3" />{formData.location}
                                                    </p>
                                                )}
                                                {formData.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {formData.skills.slice(0, 3).map((s, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-sky-100 text-sky-600 rounded text-xs font-medium">{s}</span>
                                                        ))}
                                                        {formData.skills.length > 3 && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                                                                +{formData.skills.length - 3}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="px-6 sm:px-10 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="flex items-center gap-2 px-5 py-2.5 text-gray-600 font-semibold rounded-xl hover:bg-gray-100 transition-all"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Retour
                                </button>
                            ) : (
                                <div />
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    disabled={!canGoNext()}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all shadow-lg shadow-sky-200/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                                >
                                    Continuer
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-200/50 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Enregistrement...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Terminer
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Footer hint */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        Les champs marqués <span className="text-red-400">*</span> sont obligatoires. Vous pourrez modifier votre profil plus tard.
                    </p>
                </div>
            </div>
        </div>
    );
}
