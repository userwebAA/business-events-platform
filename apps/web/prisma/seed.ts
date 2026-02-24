import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Hash password pour les comptes de test
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    // Hash password pour le compte Alex
    const alexPassword = await bcrypt.hash('Pozerty321', 10);

    // Créer le compte Alex (Super Admin principal)
    const alexAdmin = await prisma.user.upsert({
        where: { email: 'alexalix58@gmail.com' },
        update: {
            password: alexPassword,
            role: Role.SUPER_ADMIN,
        },
        create: {
            email: 'alexalix58@gmail.com',
            password: alexPassword,
            name: 'Alex Admin',
            role: Role.SUPER_ADMIN,
        },
    });

    console.log('✅ Alex Super Admin créé:', alexAdmin.email);

    // Créer le Super Admin de test
    const superAdmin = await prisma.user.upsert({
        where: { email: 'superadmin@taff.com' },
        update: {},
        create: {
            email: 'superadmin@taff.com',
            password: hashedPassword,
            name: 'Super Administrateur',
            role: Role.SUPER_ADMIN,
        },
    });

    console.log('✅ Super Admin test créé:', superAdmin.email);

    // Créer l'Admin (ton associé)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@taff.com' },
        update: {},
        create: {
            email: 'admin@taff.com',
            password: hashedPassword,
            name: 'Administrateur',
            role: Role.ADMIN,
        },
    });

    console.log('✅ Admin créé:', admin.email);

    // Créer un utilisateur test
    const user = await prisma.user.upsert({
        where: { email: 'user@taff.com' },
        update: {},
        create: {
            email: 'user@taff.com',
            password: hashedPassword,
            name: 'Utilisateur Test',
            role: Role.USER,
        },
    });

    console.log('✅ Utilisateur test créé:', user.email);

    // ── Profils Networking (démo) ──────────────────────────────────
    const networkingProfiles = [
        {
            email: 'sophie.martin@demo.com',
            name: 'Sophie Martin',
            firstName: 'Sophie',
            lastName: 'Martin',
            position: 'Directrice Marketing',
            company: 'L\'Oréal Paris',
            location: 'Paris, France',
            bio: 'Passionnée par le marketing digital et l\'innovation. 15 ans d\'expérience dans le luxe et la beauté. J\'accompagne les marques dans leur transformation digitale.',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face',
            skills: ['Marketing Digital', 'Branding', 'Stratégie', 'Management', 'E-commerce'],
            linkedin: 'https://linkedin.com/in/sophie-martin',
        },
        {
            email: 'thomas.dubois@demo.com',
            name: 'Thomas Dubois',
            firstName: 'Thomas',
            lastName: 'Dubois',
            position: 'CTO & Co-fondateur',
            company: 'TechVision AI',
            location: 'Lyon, France',
            bio: 'Entrepreneur tech, spécialisé en intelligence artificielle et machine learning. Ancien ingénieur chez Google. Je construis des solutions IA pour les entreprises.',
            photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            skills: ['Intelligence Artificielle', 'Python', 'Leadership', 'Startup', 'Cloud'],
            linkedin: 'https://linkedin.com/in/thomas-dubois',
        },
        {
            email: 'camille.leroy@demo.com',
            name: 'Camille Leroy',
            firstName: 'Camille',
            lastName: 'Leroy',
            position: 'Avocate en Droit des Affaires',
            company: 'Cabinet Leroy & Associés',
            location: 'Bordeaux, France',
            bio: 'Spécialiste en droit des sociétés et fusions-acquisitions. J\'accompagne les startups et PME dans leur croissance et leurs levées de fonds.',
            photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&crop=face',
            skills: ['Droit des Affaires', 'M&A', 'Levée de Fonds', 'Contrats', 'RGPD'],
            linkedin: 'https://linkedin.com/in/camille-leroy',
        },
        {
            email: 'marc.bernard@demo.com',
            name: 'Marc Bernard',
            firstName: 'Marc',
            lastName: 'Bernard',
            position: 'Directeur Financier',
            company: 'Société Générale',
            location: 'Paris, France',
            bio: 'Expert en finance d\'entreprise et gestion de patrimoine. 20 ans dans le secteur bancaire. Passionné par la fintech et les nouveaux modèles économiques.',
            photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            skills: ['Finance', 'Investissement', 'Fintech', 'Gestion de Risques', 'Audit'],
            linkedin: 'https://linkedin.com/in/marc-bernard',
        },
        {
            email: 'julie.moreau@demo.com',
            name: 'Julie Moreau',
            firstName: 'Julie',
            lastName: 'Moreau',
            position: 'UX/UI Designer Senior',
            company: 'Figma',
            location: 'Toulouse, France',
            bio: 'Designer produit avec 8 ans d\'expérience. Je crée des interfaces intuitives et accessibles. Conférencière et mentor pour les jeunes designers.',
            photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            skills: ['UX Design', 'UI Design', 'Figma', 'Design System', 'Accessibilité'],
            linkedin: 'https://linkedin.com/in/julie-moreau',
        },
        {
            email: 'alexandre.petit@demo.com',
            name: 'Alexandre Petit',
            firstName: 'Alexandre',
            lastName: 'Petit',
            position: 'CEO & Fondateur',
            company: 'GreenTech Solutions',
            location: 'Nantes, France',
            bio: 'Entrepreneur engagé dans la transition écologique. Ma startup développe des solutions IoT pour réduire l\'empreinte carbone des entreprises.',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
            skills: ['Entrepreneuriat', 'GreenTech', 'IoT', 'Développement Durable', 'Pitch'],
            linkedin: 'https://linkedin.com/in/alexandre-petit',
        },
        {
            email: 'emma.garcia@demo.com',
            name: 'Emma Garcia',
            firstName: 'Emma',
            lastName: 'Garcia',
            position: 'Head of Sales',
            company: 'Salesforce',
            location: 'Marseille, France',
            bio: 'Experte en développement commercial B2B et SaaS. Je manage une équipe de 30 commerciaux. Passionnée par la négociation et le closing.',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
            skills: ['Vente B2B', 'SaaS', 'Négociation', 'CRM', 'Management Commercial'],
            linkedin: 'https://linkedin.com/in/emma-garcia',
        },
        {
            email: 'nicolas.roux@demo.com',
            name: 'Nicolas Roux',
            firstName: 'Nicolas',
            lastName: 'Roux',
            position: 'Data Scientist Lead',
            company: 'Dataiku',
            location: 'Paris, France',
            bio: 'Data scientist passionné par le deep learning et la data visualisation. Contributeur open source et formateur en data science.',
            photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face',
            skills: ['Data Science', 'Machine Learning', 'Python', 'SQL', 'Visualisation'],
            linkedin: 'https://linkedin.com/in/nicolas-roux',
        },
    ];

    for (const profile of networkingProfiles) {
        await prisma.user.upsert({
            where: { email: profile.email },
            update: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                position: profile.position,
                company: profile.company,
                location: profile.location,
                bio: profile.bio,
                photo: profile.photo,
                skills: profile.skills,
                linkedin: profile.linkedin,
                profileCompleted: true,
            },
            create: {
                email: profile.email,
                password: hashedPassword,
                name: profile.name,
                firstName: profile.firstName,
                lastName: profile.lastName,
                position: profile.position,
                company: profile.company,
                location: profile.location,
                bio: profile.bio,
                photo: profile.photo,
                skills: profile.skills,
                linkedin: profile.linkedin,
                profileCompleted: true,
                role: Role.USER,
            },
        });
    }

    console.log(`✅ ${networkingProfiles.length} profils networking créés`);

    console.log('\n📋 Comptes créés:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('� Alex Super Admin (Principal):');
    console.log('   Email: alexalix58@gmail.com');
    console.log('   Password: Pozerty321');
    console.log('');
    console.log('�🔐 Super Admin (Test):');
    console.log('   Email: superadmin@taff.com');
    console.log('   Password: Admin123!');
    console.log('');
    console.log('🔧 Admin:');
    console.log('   Email: admin@taff.com');
    console.log('   Password: Admin123!');
    console.log('');
    console.log('👤 User:');
    console.log('   Email: user@taff.com');
    console.log('   Password: Admin123!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
