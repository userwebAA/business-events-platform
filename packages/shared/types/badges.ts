export type BadgeType = 
  | 'vip'
  | 'speaker'
  | 'sponsor'
  | 'organizer'
  | 'early_bird'
  | 'regular'
  | 'networking_pro'
  | 'first_timer'
  | 'frequent_attendee';

export interface Badge {
  id: string;
  type: BadgeType;
  label: string;
  color: string;
  bgColor: string;
  icon?: string;
  description?: string;
}

export const BADGE_CONFIGS: Record<BadgeType, Omit<Badge, 'id'>> = {
  vip: {
    type: 'vip',
    label: 'VIP',
    color: 'text-yellow-800',
    bgColor: 'bg-yellow-100',
    icon: '⭐',
    description: 'Participant VIP'
  },
  speaker: {
    type: 'speaker',
    label: 'Intervenant',
    color: 'text-purple-800',
    bgColor: 'bg-purple-100',
    icon: '🎤',
    description: 'Intervenant de l\'événement'
  },
  sponsor: {
    type: 'sponsor',
    label: 'Sponsor',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
    icon: '💎',
    description: 'Sponsor de l\'événement'
  },
  organizer: {
    type: 'organizer',
    label: 'Organisateur',
    color: 'text-red-800',
    bgColor: 'bg-red-100',
    icon: '👑',
    description: 'Organisateur de l\'événement'
  },
  early_bird: {
    type: 'early_bird',
    label: 'Early Bird',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
    icon: '🐦',
    description: 'Inscrit en avance'
  },
  regular: {
    type: 'regular',
    label: 'Participant',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
    icon: '👤',
    description: 'Participant régulier'
  },
  networking_pro: {
    type: 'networking_pro',
    label: 'Networking Pro',
    color: 'text-sky-800',
    bgColor: 'bg-sky-100',
    icon: '🤝',
    description: 'Expert en networking'
  },
  first_timer: {
    type: 'first_timer',
    label: 'Première fois',
    color: 'text-pink-800',
    bgColor: 'bg-pink-100',
    icon: '🌟',
    description: 'Premier événement'
  },
  frequent_attendee: {
    type: 'frequent_attendee',
    label: 'Habitué',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
    icon: '🔥',
    description: 'Participant régulier aux événements'
  }
};

export function getBadgeConfig(type: BadgeType): Omit<Badge, 'id'> {
  return BADGE_CONFIGS[type];
}
