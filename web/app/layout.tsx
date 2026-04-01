import type { Metadata } from 'next';
import { Fira_Code, Share_Tech_Mono } from 'next/font/google';
import IdentitySchema from '@/components/seo/IdentitySchema';
import './globals.css';

const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira' });
const shareTech = Share_Tech_Mono({ weight: '400', subsets: ['latin'], variable: '--font-tech' });

export const metadata: Metadata = {
    title: {
        default: 'RonnyZim OS | Sistema de Inteligência Modular',
        template: '%s | RonnyZim OS'
    },
    description: 'Interface de inteligência pessoal de alta performance, caça de talentos técnica e análise de biorritmo.',
    keywords: ['inteligência artificial', 'recrutamento técnico', 'biorritmo', 'hunterboard', 'dossiê técnico'],
    authors: [{ name: 'RonnyZim', url: 'https://ronnyzim.com' }],
    creator: 'RonnyZim',
    publisher: 'RonnyZim',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        title: 'RonnyZim OS - Neural Interface',
        description: 'O seu terminal centralizado de inteligência e performance.',
        url: 'https://shell.ronnyzim.com',
        siteName: 'RonnyZim OS',
        locale: 'pt_BR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'RonnyZim OS',
        description: 'Interface modular de inteligência e estratégia.',
        creator: '@ronnyzim',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="pt-BR" className="dark">
            <head>
                <IdentitySchema />
            </head>
            <body className={`${firaCode.variable} ${shareTech.variable} antialiased bg-[#020202] text-white overflow-hidden`}>
                {children}
            </body>
        </html>
    );
}
