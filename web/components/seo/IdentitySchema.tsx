import React from 'react';

export default function IdentitySchema() {
    const schema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "RonnyZim OS",
        "alternateName": "HunterOS",
        "description": "Sistema operacional modular de inteligência pessoal, projetado para análise de dados, recrutamento técnico e gestão de biorritmo.",
        "operatingSystem": "Universal / Web-based",
        "applicationCategory": "BusinessApplication, ProductivityApplication",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "author": {
            "@type": "Person",
            "name": "RonnyZim",
            "url": "https://ronnyzim.com"
        },
        "screenshot": "/og-image.png",
        "softwareVersion": "2.1.0-Neural",
        "featureList": [
            "Análise de Dossiês via IA",
            "Simulador de Entrevistas HunterZim",
            "Mappeamento de Networking em Tempo Real",
            "Dashboard de Biorritmo Técnico"
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
