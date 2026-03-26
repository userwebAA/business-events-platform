'use client';

import { useState } from 'react';
import { Star, X, Send } from 'lucide-react';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
    onSubmit: (rating: number, comment: string) => Promise<void>;
}

export default function RatingModal({ isOpen, onClose, eventId, eventTitle, onSubmit }: RatingModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            alert('Veuillez sélectionner une note');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(rating, comment);
            onClose();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="h-5 w-5 text-gray-500" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-white fill-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Comment était la soirée ?
                    </h2>
                    <p className="text-sm text-gray-600">
                        {eventTitle}
                    </p>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                        Notez l'organisateur
                    </p>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`h-10 w-10 sm:h-12 sm:w-12 transition-colors ${
                                        star <= (hoveredRating || rating)
                                            ? 'text-amber-400 fill-amber-400'
                                            : 'text-gray-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    {rating > 0 && (
                        <p className="text-center mt-2 text-sm font-medium text-amber-600">
                            {rating === 1 && '⭐ Décevant'}
                            {rating === 2 && '⭐⭐ Moyen'}
                            {rating === 3 && '⭐⭐⭐ Bien'}
                            {rating === 4 && '⭐⭐⭐⭐ Très bien'}
                            {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                        </p>
                    )}
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
                    </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Partagez votre expérience..."
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-400 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                        {comment.length}/500
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Plus tard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                Envoi...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4" />
                                Envoyer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
