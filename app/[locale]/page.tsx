"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Search, MessageCircle, Database } from "lucide-react"
import Link from "next/link"
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export default function Home() {
  const t = useTranslations('HomePage');
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 pt-0 max-w-5xl mx-auto">

      {/* Welcome Header */}
      <div className="flex flex-col items-center text-center space-y-4 py-8">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          Bienvenido a Lead Flow
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Tu sistema simple para conseguir clientes en 3 pasos.
        </p>
      </div>

      {/* 3 Step Guide */}
      <div className="grid gap-8 md:grid-cols-3 relative text-center">
        {/* Connecting Line (Desktop) */}
        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-muted -z-10" />

        {/* Step 1: Find */}
        <Link href={`/${locale}/scraper`} className="block group h-full">
          <Card className="relative border-2 border-muted shadow-sm group-hover:shadow-md group-hover:border-foreground/20 transition-all cursor-pointer h-full">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background border rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm text-foreground group-hover:border-foreground group-hover:text-foreground transition-colors">
              1
            </div>
            <CardHeader className="pt-8 pb-8 px-6 h-full flex flex-col items-center justify-start">
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="h-10 w-10 text-foreground stroke-[1.5]" />
              </div>
              <CardTitle className="mb-2 group-hover:text-foreground transition-colors">Buscar Leads</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Encuentra negocios calificados en Google Maps en segundos.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Step 2: Contact */}
        <div className="block group cursor-default h-full">
          <Card className="relative border-2 border-muted shadow-sm group-hover:shadow-md group-hover:border-foreground/20 transition-all h-full">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background border rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm text-foreground group-hover:border-foreground group-hover:text-foreground transition-colors">
              2
            </div>
            <CardHeader className="pt-8 pb-8 px-6 h-full flex flex-col items-center justify-start">
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-10 w-10 text-foreground stroke-[1.5]" />
              </div>
              <CardTitle className="mb-2 group-hover:text-foreground transition-colors">Contactar</CardTitle>
              <CardDescription className="text-muted-foreground font-medium">
                Contacta a tus clientes interesados directamente por WhatsApp.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Step 3: Manage */}
        <Link href={`/${locale}/leads`} className="block group h-full">
          <Card className="relative border-2 border-muted shadow-sm group-hover:shadow-md group-hover:border-foreground/20 transition-all cursor-pointer h-full">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-background border rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm text-foreground group-hover:border-foreground group-hover:text-foreground transition-colors">
              3
            </div>
            <CardHeader className="pt-8 pb-8 px-6 h-full flex flex-col items-center justify-start">
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Database className="h-10 w-10 text-foreground stroke-[1.5]" />
              </div>
              <CardTitle className="mb-2 group-hover:text-foreground transition-colors">Gestionar</CardTitle>
              <CardDescription className="text-muted-foreground font-medium px-4">
                Ten el control total: visualiza, filtra y haz seguimiento.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

    </div>
  )
}
