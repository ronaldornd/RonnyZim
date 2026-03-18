import type { Metadata } from 'next';
import { Fira_Code, Share_Tech_Mono } from 'next/font/google';
import './globals.css';

const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira' });
const shareTech = Share_Tech_Mono({ weight: '400', subsets: ['latin'], variable: '--font-tech' });

export const metadata: Metadata = {
    title: 'RonnyZim OS',
    description: 'A modular personal intelligence system',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${firaCode.variable} ${shareTech.variable} antialiased bg-[#020202] text-white overflow-hidden`}>
                {children}
            </body>
        </html>
    );
}
