"use client"

import { Calendar, Home, Inbox, Search, Settings, Phone, Database, FileText, Users } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLocale } from 'next-intl';

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
    const t = useTranslations('Sidebar');
    const locale = useLocale();

    // Helper to add locale to paths
    const getPath = (path: string) => `/${locale}${path === '/' ? '' : path}`;

    const items = [
        {
            title: t('dashboard'),
            url: "/",
            icon: Home,
        },
        {
            title: t('scraper'),
            url: "/scraper",
            icon: Search,
        },
        {
            title: t('leads'),
            url: "/leads",
            icon: Database,
        },
        {
            title: "Reportes",
            url: "/reports",
            icon: FileText,
        },
    ]

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <div className="flex items-center w-full px-4 py-4">
                        <span className="text-xl font-bold tracking-tight">Lead Flow</span>
                    </div>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <Link href={getPath(item.url)}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
