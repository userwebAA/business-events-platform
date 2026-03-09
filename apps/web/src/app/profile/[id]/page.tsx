'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
    User, MapPin, Briefcase, Building, Calendar, Users, ExternalLink,
    ArrowLeft, Loader2, LinkIcon, Award, Clock, ChevronRight, Lock,
    BadgeCheck, Eye, EyeOff, UserPlus, UserMinus, Bell, X
} from 'lucide-react';

interface PublicProfile {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    position: string | null;
    company: string | null;
    bio: string | null;
    photo: string | null;
    location: string | null;
    skills: string[];
    linkedin: string | null;
    profileVideo: string | null;
    profileCompleted: boolean;
    identityStatus: string;
    role: string;
    createdAt: string;
}

interface EventBadge {
    id: string;
    eventId: string;
    eventTitle: string;
    eventImage: string | null;
    eventDate: string;
    role: string;
    visible: boolean;
}

interface OrganizedEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    imageUrl: string | null;
    type: string;
    price: number | null;
    currentAttendees: number;
    maxAttendees: number | null;
}

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [events, setEvents] = useState<OrganizedEvent[]>([]);
    const [stats, setStats] = useState({ totalEventsOrganized: 0, totalAttendees: 0 });
    const [badges, setBadges] = useState<EventBadge[]>([]);
    const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [followers, setFollowers] = useState<any[]>([]);
    const [following, setFollowing] = useState<any[]>([]);
    const [loadingFollowers, setLoadingFollowers] = useState(false);
    const [loadingFollowing, setLoadingFollowing] = useState(false);

    const userId = params.id as string;
    const isOwnProfile = currentUser?.id === userId;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`/api/user/${userId}/public-profile`, { headers });
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('Utilisateur non trouvé');
                    } else {
                        setError('Erreur lors du chargement du profil');
                    }
                    return;
                }
                const data = await res.json();
                setProfile(data.user);
                setEvents(data.organizedEvents);
                setStats(data.stats);
                setBadges(data.eventBadges || []);
                setHiddenEventIds(data.hiddenProfileEvents || []);
            } catch (err) {
                setError('Erreur de connexion');
            } finally {
                setLoading(false);
            }
        };
        if (userId) fetchProfile();
    }, [userId]);

    // Fetch follow status
    useEffect(() => {
        const fetchFollowStatus = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(`/api/user/${userId}/follow`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setIsFollowing(data.isFollowing);
                    setFollowersCount(data.followersCount);
                    setFollowingCount(data.followingCount);
                }
            } catch (e) {
                console.error('Erreur fetch follow:', e);
            }
        };
        if (userId) fetchFollowStatus();
    }, [userId, currentUser]);

    const handleFollow = async () => {
        if (!currentUser) return;
        setFollowLoading(true);
        try {
            const token = localStorage.getItem('token');
            const method = isFollowing ? 'DELETE' : 'POST';
            const res = await fetch(`/api/user/${userId}/follow`, {
                method,
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setIsFollowing(!isFollowing);
                setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
            }
        } catch (e) {
            console.error('Erreur follow:', e);
        } finally {
            setFollowLoading(false);
        }
    };

    const fetchFollowers = async () => {
        setLoadingFollowers(true);
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`/api/user/${userId}/followers`, { headers });
            if (res.ok) {
                const data = await res.json();
                setFollowers(data.followers || []);
            }
        } catch (e) {
            console.error('Erreur fetch followers:', e);
        } finally {
            setLoadingFollowers(false);
        }
    };

    const fetchFollowing = async () => {
        setLoadingFollowing(true);
        try {
            const token = localStorage.getItem('token');
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const res = await fetch(`/api/user/${userId}/following`, { headers });
            if (res.ok) {
                const data = await res.json();
                setFollowing(data.following || []);
            }
        } catch (e) {
            console.error('Erreur fetch following:', e);
        } finally {
            setLoadingFollowing(false);
        }
    };

    const handleUnfollow = async (targetUserId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/user/${targetUserId}/follow`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setFollowing(prev => prev.filter(u => u.id !== targetUserId));
                setFollowingCount(prev => prev - 1);
            }
        } catch (e) {
            console.error('Erreur unfollow:', e);
        }
    };

    const handleRemoveFollower = async (followerUserId: string) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/user/${followerUserId}/remove-follower`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                setFollowers(prev => prev.filter(u => u.id !== followerUserId));
                setFollowersCount(prev => prev - 1);
            }
        } catch (e) {
            console.error('Erreur remove follower:', e);
        }
    };

    const openFollowersModal = () => {
        setShowFollowersModal(true);
        fetchFollowers();
    };

    const openFollowingModal = () => {
        setShowFollowingModal(true);
        fetchFollowing();
    };

    const displayName = profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : profile?.name || 'Utilisateur';

    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
        : '';

    const isVerified = profile?.identityStatus === 'verified' || profile?.role === 'ADMIN' || profile?.role === 'SUPER_ADMIN';

    const toggleEventVisibility = async (eventId: string) => {
        const isCurrentlyHidden = hiddenEventIds.includes(eventId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/profile-events', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ eventId, hidden: !isCurrentlyHidden }),
            });
            if (res.ok) {
                setHiddenEventIds(prev =>
                    isCurrentlyHidden
                        ? prev.filter(id => id !== eventId)
                        : [...prev, eventId]
                );
            }
        } catch (e) {
            console.error('Erreur toggle event:', e);
        }
    };

    const toggleBadgeVisibility = async (badgeId: string, currentVisible: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/badges', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ badgeId, visible: !currentVisible }),
            });
            if (res.ok) {
                setBadges(prev => prev.map(b => b.id === badgeId ? { ...b, visible: !currentVisible } : b));
            }
        } catch (e) {
            console.error('Erreur toggle badge:', e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 text-sky-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Chargement du profil...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="text-center">
                        <div className="bg-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <User className="h-10 w-10 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{error || 'Profil introuvable'}</h2>
                        <p className="text-gray-500 mb-6">Ce profil n&apos;existe pas ou n&apos;est plus disponible.</p>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-all"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-sky-50">
            <Navbar />

            {/* Hero banner */}
            <div className="relative bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-700 overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-10 left-10 w-60 h-60 bg-white opacity-5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-300 opacity-10 rounded-full blur-3xl"></div>
                </div>
                <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 sm:pb-28">
                    <button
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm font-medium mb-6 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </button>
                </div>
            </div>

            {/* Profile content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10 pb-12">

                {/* Profile card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-6">
                    <div className="p-5 sm:p-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
                            {/* Avatar */}
                            {profile.photo ? (
                                <img
                                    src={profile.photo}
                                    alt={displayName}
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-lg shrink-0"
                                />
                            ) : (
                                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center ring-4 ring-white shadow-lg shrink-0">
                                    <span className="text-white text-3xl sm:text-4xl font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 flex items-center justify-center sm:justify-start gap-2">
                                    {displayName}
                                    {isVerified && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold border border-emerald-200" title="Compte vérifié">
                                            <BadgeCheck className="h-3.5 w-3.5" />
                                            Vérifié
                                        </span>
                                    )}
                                </h1>

                                {profile.position && (
                                    <p className="text-lg text-gray-600 flex items-center justify-center sm:justify-start gap-2 mb-2">
                                        <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
                                        {profile.position}
                                        {profile.company && (
                                            <span className="text-gray-400">
                                                chez <span className="text-gray-600 font-medium">{profile.company}</span>
                                            </span>
                                        )}
                                    </p>
                                )}

                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-500">
                                    {profile.location && (
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                            {profile.location}
                                        </span>
                                    )}
                                    {memberSince && (
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                            Membre depuis {memberSince}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                        <button
                                            onClick={openFollowersModal}
                                            className="hover:underline cursor-pointer"
                                        >
                                            <strong className="text-gray-700">{followersCount}</strong> abonné{followersCount > 1 ? 's' : ''}
                                        </button>
                                        <span className="text-gray-300">·</span>
                                        <button
                                            onClick={openFollowingModal}
                                            className="hover:underline cursor-pointer"
                                        >
                                            <strong className="text-gray-700">{followingCount}</strong> abonnement{followingCount > 1 ? 's' : ''}
                                        </button>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                                    {!isOwnProfile && currentUser && (
                                        <button
                                            onClick={handleFollow}
                                            disabled={followLoading}
                                            className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 ${isFollowing
                                                ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                                                : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700'
                                                }`}
                                        >
                                            {followLoading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isFollowing ? (
                                                <UserMinus className="h-4 w-4" />
                                            ) : (
                                                <UserPlus className="h-4 w-4" />
                                            )}
                                            {isFollowing ? 'Abonné' : 'Suivre'}
                                        </button>
                                    )}
                                    {profile.linkedin && (
                                        <a
                                            href={profile.linkedin}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077B5] text-white text-sm font-semibold rounded-xl hover:bg-[#006097] transition-all shadow-sm"
                                        >
                                            <LinkIcon className="h-4 w-4" />
                                            LinkedIn
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                    {isOwnProfile && (
                                        <Link
                                            href="/dashboard/settings"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-all"
                                        >
                                            Modifier mon profil
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Stats */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Statistiques</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-sky-600">{stats.totalEventsOrganized}</p>
                                    <p className="text-xs text-gray-500 mt-1">Événements organisés</p>
                                </div>
                                <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{stats.totalAttendees}</p>
                                    <p className="text-xs text-gray-500 mt-1">Participants total</p>
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        {profile.skills.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Compétences
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-lg text-sm font-medium border border-sky-100"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Badges milestone de participation */}
                        {(() => {
                            const attendeeCount = badges.filter(b => b.role === 'attendee').length;
                            const isAdmin = isOwnProfile && (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN');
                            const milestones = [
                                { threshold: 10, label: '10 soirées', emoji: '🏆', bg: 'from-yellow-400 to-amber-500', ring: 'ring-yellow-400', text: 'text-yellow-900', bgCard: 'bg-gradient-to-r from-yellow-50 to-amber-50', border: 'border-yellow-200' },
                                { threshold: 50, label: '50 soirées', emoji: '💎', bg: 'from-slate-300 to-slate-500', ring: 'ring-slate-400', text: 'text-slate-800', bgCard: 'bg-gradient-to-r from-slate-50 to-gray-100', border: 'border-slate-300' },
                                { threshold: 100, label: '100 soirées', emoji: '🌈', bg: 'from-pink-500 via-purple-500 to-cyan-500', ring: 'ring-purple-400', text: 'text-purple-900', bgCard: 'bg-gradient-to-r from-pink-50 via-purple-50 to-cyan-50', border: 'border-purple-200' },
                            ];
                            const earned = isAdmin ? milestones : milestones.filter(m => attendeeCount >= m.threshold);
                            if (earned.length === 0) return null;
                            return (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Award className="h-4 w-4" />
                                        Badges de certifications
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {earned.map((m) => (
                                            <div
                                                key={m.threshold}
                                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${m.bgCard} ${m.border} shadow-sm`}
                                            >
                                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${m.bg} flex items-center justify-center ring-2 ${m.ring} shadow-md`}>
                                                    <span className="text-base">{m.emoji}</span>
                                                </div>
                                                <span className={`text-sm font-bold ${m.text}`}>{m.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3">{attendeeCount} soirée{attendeeCount > 1 ? 's' : ''} participée{attendeeCount > 1 ? 's' : ''}</p>
                                </div>
                            );
                        })()}

                        {/* Badges de soirées */}
                        {badges.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Award className="h-4 w-4" />
                                    Badges de soirées
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {badges.filter(b => isOwnProfile || b.visible).map((badge) => (
                                        <div key={badge.id} className="relative group">
                                            <Link
                                                href={`/events/${badge.eventId}`}
                                                className={`block ${!badge.visible && isOwnProfile ? 'opacity-40' : ''}`}
                                                title={`${badge.eventTitle}${badge.role === 'organizer' ? ' (Organisateur)' : ''}`}
                                            >
                                                {badge.eventImage ? (
                                                    <img
                                                        src={badge.eventImage}
                                                        alt={badge.eventTitle}
                                                        className={`w-12 h-12 rounded-full object-cover ring-2 shadow-sm transition-transform group-hover:scale-110 ${badge.role === 'organizer'
                                                            ? 'ring-purple-400'
                                                            : 'ring-sky-300'
                                                            }`}
                                                    />
                                                ) : (
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ring-2 shadow-sm transition-transform group-hover:scale-110 ${badge.role === 'organizer'
                                                        ? 'bg-gradient-to-br from-purple-400 to-indigo-500 ring-purple-400'
                                                        : 'bg-gradient-to-br from-sky-400 to-blue-500 ring-sky-300'
                                                        }`}>
                                                        <Calendar className="h-5 w-5 text-white" />
                                                    </div>
                                                )}
                                                {badge.role === 'organizer' && (
                                                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center ring-2 ring-white">
                                                        <span className="text-white text-[8px] font-bold">★</span>
                                                    </span>
                                                )}
                                            </Link>
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => toggleBadgeVisibility(badge.id, badge.visible)}
                                                    className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-gray-50"
                                                    title={badge.visible ? 'Masquer ce badge' : 'Afficher ce badge'}
                                                >
                                                    {badge.visible ? (
                                                        <EyeOff className="h-2.5 w-2.5 text-gray-500" />
                                                    ) : (
                                                        <Eye className="h-2.5 w-2.5 text-gray-500" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {isOwnProfile && (
                                    <p className="text-xs text-gray-400 mt-3">Survolez un badge pour le masquer/afficher sur votre profil public.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Bio */}
                        {profile.bio && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">À propos</h3>
                                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                            </div>
                        )}

                        {/* Vidéo de présentation */}
                        {profile.profileVideo && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    Présentation
                                </h3>
                                <div className="rounded-xl overflow-hidden bg-black aspect-video">
                                    <video
                                        src={profile.profileVideo}
                                        controls
                                        className="w-full h-full object-contain"
                                        preload="metadata"
                                        playsInline
                                    />
                                </div>
                            </div>
                        )}

                        {/* Events organized */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 sm:p-6 border-b border-gray-100">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Événements organisés
                                </h3>
                            </div>

                            {events.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <div className="bg-gray-100 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="h-7 w-7 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">Aucun événement public pour le moment</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {events.map((event) => {
                                        const isPast = new Date(event.date) < new Date();
                                        const isHidden = hiddenEventIds.includes(event.id);
                                        return (
                                            <div key={event.id} className={`flex items-center gap-3 sm:gap-4 px-5 sm:px-6 py-4 transition-all group ${isHidden && isOwnProfile ? 'opacity-40' : ''}`}>
                                                {isOwnProfile && (
                                                    <button
                                                        onClick={() => toggleEventVisibility(event.id)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all border ${isHidden
                                                            ? 'bg-gray-100 border-gray-200 text-gray-400 hover:bg-gray-200'
                                                            : 'bg-sky-50 border-sky-200 text-sky-500 hover:bg-sky-100'
                                                            }`}
                                                        title={isHidden ? 'Afficher sur mon profil' : 'Masquer de mon profil'}
                                                    >
                                                        {isHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/events/${event.id}`}
                                                    className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 hover:bg-sky-50/50 -my-4 py-4 -mr-5 sm:-mr-6 pr-5 sm:pr-6 rounded-r-xl transition-all"
                                                >
                                                    {event.imageUrl ? (
                                                        <img
                                                            src={event.imageUrl}
                                                            alt={event.title}
                                                            className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-xl shadow-sm shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-sky-500" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h4 className="font-bold text-gray-900 truncate group-hover:text-sky-600 transition-colors text-sm sm:text-base">
                                                                {event.title}
                                                            </h4>
                                                            {isPast && (
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium shrink-0">
                                                                    Terminé
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${event.type === 'free' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {event.type === 'free' ? 'Gratuit' : `${event.price}€`}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                <span className="truncate max-w-[120px]">{event.location}</span>
                                                            </span>
                                                            <span className="hidden sm:flex items-center gap-1">
                                                                <Users className="h-3 w-3" />
                                                                {event.currentAttendees}{event.maxAttendees ? `/${event.maxAttendees}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-sky-500 transition-colors shrink-0 hidden sm:block" />
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {isOwnProfile && events.length > 0 && (
                                <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100">
                                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                        <Eye className="h-3 w-3" />
                                        Cliquez sur l&apos;icône œil pour masquer/afficher un événement sur votre profil public.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Abonnés */}
            {showFollowersModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFollowersModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Abonnés ({followersCount})</h3>
                            <button onClick={() => setShowFollowersModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh]">
                            {loadingFollowers ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                                </div>
                            ) : followers.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Aucun abonné</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {followers.map((follower) => (
                                        <div key={follower.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                            <Link href={`/profile/${follower.id}`} className="flex items-center gap-3 flex-1" onClick={() => setShowFollowersModal(false)}>
                                                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {follower.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{follower.name}</p>
                                                    {follower.position && <p className="text-xs text-gray-500">{follower.position}</p>}
                                                </div>
                                            </Link>
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => handleRemoveFollower(follower.id)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    Retirer
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Abonnements */}
            {showFollowingModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowFollowingModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Abonnements ({followingCount})</h3>
                            <button onClick={() => setShowFollowingModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[60vh]">
                            {loadingFollowing ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
                                </div>
                            ) : following.length === 0 ? (
                                <div className="text-center py-12 px-6">
                                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Aucun abonnement</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {following.map((user) => (
                                        <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                            <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1" onClick={() => setShowFollowingModal(false)}>
                                                <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{user.name}</p>
                                                    {user.position && <p className="text-xs text-gray-500">{user.position}</p>}
                                                </div>
                                            </Link>
                                            {isOwnProfile && (
                                                <button
                                                    onClick={() => handleUnfollow(user.id)}
                                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                >
                                                    Se désabonner
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
