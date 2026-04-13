"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import 'devicon/devicon.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter } from 'lucide-react';

export interface GlobalStack {
    id: string;
    name: string;
    category: string;
    icon_slug: string;
}

interface StackSelectorProps {
    selectedStacks: string[]; // Passar IDs
    onChange: (stacks: string[]) => void;
    disabled?: boolean;
}

const IconMap: Record<string, React.ReactNode> = {
    react: <i className="devicon-react-original text-xl" />,
    nextjs: <i className="devicon-nextjs-plain text-xl" />,
    tailwind: <i className="devicon-tailwindcss-plain text-xl" />,
    nodejs: <i className="devicon-nodejs-plain text-xl" />,
    python: <i className="devicon-python-plain text-xl" />,
    typescript: <i className="devicon-typescript-plain text-xl" />,
    database: <i className="devicon-supabase-plain text-xl" />,
    sql: <i className="devicon-postgresql-plain text-xl" />,
    docker: <i className="devicon-docker-plain text-xl" />,
    aws: <i className="devicon-amazonwebservices-plain-wordmark text-xl" />,
    azure: <i className="devicon-azure-plain text-xl" />,
    gcp: <i className="devicon-googlecloud-plain text-xl" />,
    figma: <i className="devicon-figma-plain text-xl" />,
    vue: <i className="devicon-vuejs-plain text-xl" />,
    angular: <i className="devicon-angularjs-plain text-xl" />,
    svelte: <i className="devicon-svelte-plain text-xl" />,
    java: <i className="devicon-java-plain text-xl" />,
    go: <i className="devicon-go-plain text-xl" />,
    rust: <i className="devicon-rust-plain text-xl" />,
    graphql: <i className="devicon-graphql-plain text-xl" />,
    framer: <i className="devicon-framermotion-plain text-xl" />,
    flutter: <i className="devicon-flutter-plain text-xl" />,
    csharp: <i className="devicon-csharp-plain text-xl" />,
    php: <i className="devicon-php-plain text-xl" />,
    ruby: <i className="devicon-ruby-plain text-xl" />,
    mongodb: <i className="devicon-mongodb-plain text-xl" />,
    redis: <i className="devicon-redis-plain text-xl" />,
    mysql: <i className="devicon-mysql-plain text-xl" />,
    sqlite: <i className="devicon-sqlite-plain text-xl" />,
    firebase: <i className="devicon-firebase-plain text-xl" />,
    supabase: <i className="devicon-supabase-plain text-xl" />,
    django: <i className="devicon-django-plain text-xl" />,
    flask: <i className="devicon-flask-original text-xl" />,
    spring: <i className="devicon-spring-plain text-xl" />,
    github: <i className="devicon-github-plain text-xl" />,
    gitlab: <i className="devicon-gitlab-plain text-xl" />,
    jenkins: <i className="devicon-jenkins-plain text-xl" />,
    kubernetes: <i className="devicon-kubernetes-plain text-xl" />,
    terraform: <i className="devicon-terraform-plain text-xl" />,
    digitalocean: <i className="devicon-digitalocean-plain text-xl" />,
    heroku: <i className="devicon-heroku-plain text-xl" />,
    vercel: <i className="devicon-vercel-plain text-xl" />,
    cloudflare: <i className="devicon-cloudflare-plain text-xl" />,
    swift: <i className="devicon-swift-plain text-xl" />,
    kotlin: <i className="devicon-kotlin-plain text-xl" />,
    android: <i className="devicon-android-plain text-xl" />,
    ansible: <i className="devicon-ansible-plain text-xl" />,
    prometheus: <i className="devicon-prometheus-original text-xl" />,
    grafana: <i className="devicon-grafana-plain text-xl" />,
    linux: <i className="devicon-linux-plain text-xl" />,
    ubuntu: <i className="devicon-ubuntu-plain text-xl" />,
    nginx: <i className="devicon-nginx-original text-xl" />,
    apache: <i className="devicon-apache-plain text-xl" />,
    circleci: <i className="devicon-circleci-plain text-xl" />,
    travisci: <i className="devicon-travis-plain text-xl" />,
    cassandra: <i className="devicon-cassandra-plain text-xl" />,
    mariadb: <i className="devicon-mariadb-plain text-xl" />,
    elasticsearch: <i className="devicon-elasticsearch-plain text-xl" />,
    neo4j: <i className="devicon-neo4j-plain text-xl" />,
    dynamodb: <i className="devicon-dynamodb-plain text-xl" />,
    blender: <i className="devicon-blender-original text-xl" />,
    photoshop: <i className="devicon-photoshop-plain text-xl" />,
    illustrator: <i className="devicon-illustrator-plain text-xl" />,
    premierepro: <i className="devicon-premierepro-plain text-xl" />,
    apple: <i className="devicon-apple-original text-xl" />,
    ionic: <i className="devicon-ionic-original text-xl" />,
    html5: <i className="devicon-html5-plain text-xl" />,
    css3: <i className="devicon-css3-plain text-xl" />,
    javascript: <i className="devicon-javascript-plain text-xl" />,
    bootstrap: <i className="devicon-bootstrap-plain text-xl" />,
    sass: <i className="devicon-sass-plain text-xl" />,
    less: <i className="devicon-less-plain text-xl" />,
    webpack: <i className="devicon-webpack-plain text-xl" />,
    vitejs: <i className="devicon-vitejs-plain text-xl" />,
    babel: <i className="devicon-babel-plain text-xl" />,
    jquery: <i className="devicon-jquery-plain text-xl" />,
    netlify: <i className="devicon-netlify-plain text-xl" />,
    openstack: <i className="devicon-openstack-plain text-xl" />,
    dart: <i className="devicon-dart-plain text-xl" />,
    xcode: <i className="devicon-xcode-plain text-xl" />,
    xamarin: <i className="devicon-xamarin-plain text-xl" />,
    objectivec: <i className="devicon-objectivec-plain text-xl" />,
    xd: <i className="devicon-xd-plain text-xl" />,
    sketch: <i className="devicon-sketch-plain text-xl" />,
    inkscape: <i className="devicon-inkscape-plain text-xl" />,
    maya: <i className="devicon-maya-plain text-xl" />,
    gimp: <i className="devicon-gimp-plain text-xl" />,
    threedsmax: <i className="devicon-threedsmax-plain text-xl" />,
    default: <i className="devicon-git-plain text-xl" />
};

// Mapa de cores oficiais das ferramentas para UI Pro Max
export const ColorMap: Record<string, string> = {
    react: '#61DAFB',
    nextjs: '#FFFFFF',
    'tailwind': '#06B6D4',
    nodejs: '#339933',
    python: '#3776AB',
    typescript: '#3178C6',
    database: '#3ECF8E', 
    sql: '#4169E1',
    docker: '#2496ED',
    aws: '#FF9900',
    azure: '#0089D6',
    gcp: '#4285F4',
    figma: '#F24E1E',
    vue: '#4FC08D',
    angular: '#DD0031',
    svelte: '#FF3E00',
    java: '#6DB33F', 
    go: '#00ADD8',
    rust: '#DEA584',
    graphql: '#E10098',
    framer: '#0055FF',
    flutter: '#02569B',
    csharp: '#239120',
    php: '#777BB4',
    ruby: '#CC342D',
    mongodb: '#47A248',
    redis: '#DC382D',
    mysql: '#4479A1',
    sqlite: '#003B57',
    firebase: '#FFCA28',
    supabase: '#3ECF8E',
    django: '#092E20',
    flask: '#FFFFFF',
    spring: '#6DB33F',
    github: '#FFFFFF',
    gitlab: '#FC6D26',
    jenkins: '#D24939',
    kubernetes: '#326CE5',
    terraform: '#7B42BC',
    digitalocean: '#0080FF',
    heroku: '#430098',
    vercel: '#FFFFFF',
    cloudflare: '#F38020',
    swift: '#F05138',
    kotlin: '#7F52FF',
    android: '#3DDC84',
    ansible: '#EE0000',
    prometheus: '#E6522C',
    grafana: '#F46800',
    linux: '#FCC624',
    ubuntu: '#E95420',
    nginx: '#009639',
    apache: '#D22128',
    circleci: '#FFFFFF',
    travisci: '#3EAAAF',
    cassandra: '#1287B1',
    mariadb: '#003545',
    elasticsearch: '#005571',
    neo4j: '#4581C3',
    dynamodb: '#4053D6',
    blender: '#F5792A',
    photoshop: '#31A8FF',
    illustrator: '#FF9A00',
    premierepro: '#9999FF',
    apple: '#FFFFFF',
    ionic: '#3880FF',
    html5: '#E34F26',
    css3: '#1572B6',
    javascript: '#F7DF1E',
    bootstrap: '#7952B3',
    sass: '#CC6699',
    less: '#1D365D',
    webpack: '#8DD6F9',
    vitejs: '#646CFF',
    babel: '#F9DC3E',
    jquery: '#0769AD',
    netlify: '#00C7B7',
    openstack: '#ED1944',
    dart: '#0175C2',
    xcode: '#1575F9',
    xamarin: '#3498DB',
    objectivec: '#438EFF',
    xd: '#FF61F6',
    sketch: '#F7B500',
    inkscape: '#FFFFFF',
    maya: '#37B6B0',
    gimp: '#5C5C5C',
    threedsmax: '#3782B3',
    default: '#22c55e'
};

export default function StackSelector({ selectedStacks, onChange, disabled }: StackSelectorProps) {
    const [stacks, setStacks] = useState<GlobalStack[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        async function fetchStacks() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('global_stacks')
                .select('*')
                .order('name', { ascending: true });

            if (error) {
                console.error("Erro ao buscar stacks:", error);
            } else if (data) {
                setStacks(data);
            }
            setLoading(false);
        }

        fetchStacks();
    }, []);

    const toggleStack = (id: string) => {
        if (disabled) return;

        if (selectedStacks.includes(id)) {
            onChange(selectedStacks.filter(s => s !== id));
        } else {
            onChange([...selectedStacks, id]);
        }
    };

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center p-8 border border-white/5 bg-[#0a0f0a]/50 rounded-2xl">
                <div className="flex items-center gap-2 text-amber-500/50">
                    <div className="w-4 h-4 border-2 border-currentColor rounded-full border-t-transparent animate-spin"></div>
                    <span className="text-sm font-mono tracking-widest uppercase">Decodificando Tecnologias...</span>
                </div>
            </div>
        );
    }

    // Fallback se n tiver
    if (stacks.length === 0) {
        return <div className="text-slate-500 text-sm italic">Nenhuma Stack listada na matriz de infraestrutura. Execute a migração SQL.</div>
    }

    // Filtros e Limites
    const filteredStacks = stacks.filter(stack => {
        const matchesSearch = stack.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeFilter === 'all' || stack.category === activeFilter;
        return matchesSearch && matchesCategory;
    });

    // Limite travado para garantir a estética Cyber-Mystic de apenas 2 linhas (10 itens no max).
    // A busca funciona filtrando os correspondentes, mas o visual continua compactado caso hajam muitos (ex: "a").
    const isSearching = searchQuery.trim() !== '';
    const displayedStacks = filteredStacks.slice(0, 10);

    const categories = ['all', ...Array.from(new Set(stacks.map(s => s.category)))];

    return (
        <div className="flex flex-col gap-4">
            {/* Barra de Pesquisa e Filtros */}
            <div className="flex flex-col gap-3">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar tecnologia..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        className="block w-full pl-10 pr-3 py-2 border border-green-500/10 rounded-lg bg-black/60 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                </div>
                
                <div className="flex flex-wrap gap-2 w-full">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setActiveFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors border ${
                                activeFilter === cat 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            {cat === 'all' ? 'Tudo' : cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 min-h-[150px] content-start">
                <AnimatePresence mode="popLayout">
                    {displayedStacks.map((stack) => {
                        const isSelected = selectedStacks.includes(stack.id);
                        const slug = stack.icon_slug.toLowerCase();
                        const icon = IconMap[slug] || IconMap['default'];
                        const brandColor = ColorMap[slug] || ColorMap['default'];

                        return (
                            <motion.button
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                key={stack.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleStack(stack.id)}
                                whileHover={{ scale: disabled ? 1 : 1.05 }}
                                whileTap={{ scale: disabled ? 1 : 0.95 }}
                                className={`
                                    relative flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border transition-all duration-300 overflow-hidden h-[76px]
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                    ${!isSelected && 'border-white/10 bg-black/40 text-slate-400 hover:text-white'}
                                `}
                                style={isSelected ? {
                                    borderColor: brandColor,
                                    backgroundColor: `${brandColor}1A`,
                                    color: brandColor,
                                    boxShadow: `0 0 12px ${brandColor}33`
                                } : {}}
                            >
                                {isSelected && (
                                    <div
                                        className="absolute inset-0 pointer-events-none"
                                        style={{ background: `linear-gradient(to top, ${brandColor}20, transparent)` }}
                                    />
                                )}

                                <div className="relative z-10 transition-transform duration-300">
                                    {icon}
                                </div>

                                <span className="relative z-10 text-[10px] font-bold tracking-widest uppercase text-center mt-1 leading-tight">
                                    {stack.name}
                                </span>
                            </motion.button>
                        );
                    })}
                </AnimatePresence>
                
                {displayedStacks.length === 0 && (
                    <div className="col-span-full flex items-center justify-center p-8 text-slate-500 font-mono text-xs">
                        Nenhuma tecnologia detectada neste quadrante.
                    </div>
                )}
            </div>
        </div>
    );
}
