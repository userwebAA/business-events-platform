export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  position?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  endDate?: Date;
  location: string;
  address: string;
  organizerId: string;
  organizer?: User;
  type: 'free' | 'paid';
  price?: number;
  currency: string;
  maxAttendees?: number;
  currentAttendees: number;
  imageUrl?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  isPrivate: boolean;
  accessToken?: string;
  registrationFields: RegistrationField[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RegistrationField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

export interface Registration {
  id: string;
  eventId: string;
  event?: Event;
  userId: string;
  user?: User;
  status: 'pending' | 'confirmed' | 'cancelled' | 'paid';
  formData: Record<string, any>;
  paymentId?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  registrationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  stripePaymentIntentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultRegistrationFields: RegistrationField[] = [
  {
    id: 'company',
    name: 'company',
    label: 'Entreprise',
    type: 'text',
    required: true,
    placeholder: 'Nom de votre entreprise'
  },
  {
    id: 'position',
    name: 'position',
    label: 'Poste',
    type: 'text',
    required: true,
    placeholder: 'Votre fonction'
  },
  {
    id: 'phone',
    name: 'phone',
    label: 'Téléphone',
    type: 'phone',
    required: true,
    placeholder: '+33 6 12 34 56 78'
  }
];
