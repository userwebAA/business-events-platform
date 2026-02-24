import validator from 'validator';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export function validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email) {
        errors.push('L\'email est requis');
    } else if (!validator.isEmail(email)) {
        errors.push('L\'email n\'est pas valide');
    } else if (email.length > 255) {
        errors.push('L\'email est trop long (max 255 caractères)');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
        errors.push('Le mot de passe est requis');
    } else {
        if (password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        }
        if (password.length > 128) {
            errors.push('Le mot de passe est trop long (max 128 caractères)');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une minuscule');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function validateName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name) {
        errors.push('Le nom est requis');
    } else {
        const sanitized = validator.escape(name.trim());
        if (sanitized.length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
        }
        if (sanitized.length > 100) {
            errors.push('Le nom est trop long (max 100 caractères)');
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

export function sanitizeInput(input: string): string {
    return validator.escape(validator.trim(input));
}
