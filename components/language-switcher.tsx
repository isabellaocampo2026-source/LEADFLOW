"use client"

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        const nextLocale = locale === 'en' ? 'es' : 'en';
        // Simple path replacer. For more complex paths use the next-intl navigation
        // But since we are using 'app/[locale]', we can just replace the first segment
        const segments = pathname.split('/');
        segments[1] = nextLocale;
        router.push(segments.join('/'));
    };

    return (
        <Button variant="ghost" size="icon" onClick={toggleLanguage} title={locale === 'en' ? "Switch to Spanish" : "Cambiar a Inglés"}>
            <Globe className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Toggle Language</span>
            <span className="absolute -top-1 -right-1 text-[10px] font-bold">{locale.toUpperCase()}</span>
        </Button>
    );
}
