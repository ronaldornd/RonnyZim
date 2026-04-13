/** HMR_CACHE_RESET: 2026-04-01-T17:52 */
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
    description: 'Domine sua carreira com RonnyZim OS: a interface definitiva de inteligência pessoal, recrutamento técnico e performance neural. Junte-se a 10.000+ engenheiros de elite.',
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
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css" />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </head>
            <body className={`${firaCode.variable} ${shareTech.variable} antialiased bg-[#020202] text-white overflow-hidden`}>
                {children}
            </body>
        </html>
    );
}
