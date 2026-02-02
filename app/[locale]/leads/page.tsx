"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { getLeads, SavedLead } from "@/app/actions/leads"
import { markAsContacted } from "@/app/actions/scrape"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Phone,
    Loader2,
    MessageCircle,
    Search,
    MapPin,
    CheckCircle2,
    Settings,
    Star,
    Mail
} from "lucide-react"
import { useWhatsAppTemplate } from "@/lib/hooks/use-whatsapp-template"

export default function LeadsPage() {
    const [leads, setLeads] = useState<SavedLead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<'all' | 'contacted' | 'pending'>('all')

    // WhatsApp Template
    const { template, setTemplate } = useWhatsAppTemplate()
    const [showSettings, setShowSettings] = useState(false)

    // Preview Modal
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMessage, setPreviewMessage] = useState("")
    const [selectedLead, setSelectedLead] = useState<SavedLead | null>(null)

    useEffect(() => {
        loadLeads()
    }, [])

    async function loadLeads() {
        setIsLoading(true)
        try {
            const result = await getLeads()
            if (result.success) {
                setLeads(result.data)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            // Search filter
            const matchesSearch = search === "" ||
                lead.name.toLowerCase().includes(search.toLowerCase()) ||
                (lead.phone && lead.phone.includes(search)) ||
                (lead.city && lead.city.toLowerCase().includes(search.toLowerCase())) ||
                (lead.email && lead.email.toLowerCase().includes(search.toLowerCase()))

            // Status filter
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'contacted' && lead.contacted) ||
                (filterStatus === 'pending' && !lead.contacted)

            return matchesSearch && matchesStatus
        })
    }, [leads, search, filterStatus])

    const handleWhatsApp = (lead: SavedLead) => {
        if (!lead.phone) return

        const message = template
            .replace(/{{Nombre Negocio}}/g, lead.name)
            .replace(/{{Nombre}}/g, lead.name)
            .replace(/{{Ciudad}}/g, lead.city || '')
            .replace(/{{Categoría}}/g, lead.category || '')

        setPreviewMessage(message)
        setSelectedLead(lead)
        setPreviewOpen(true)
    }

    const confirmWhatsApp = async () => {
        if (!selectedLead?.phone) return

        let phone = selectedLead.phone.replace(/\D/g, '')
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(previewMessage)}`, '_blank')

        await markAsContacted(selectedLead.placeId)

        // Update local state
        setLeads(prev => prev.map(l =>
            l.placeId === selectedLead.placeId ? { ...l, contacted: true } : l
        ))
        setPreviewOpen(false)
    }

    const handleEmail = (lead: SavedLead) => {
        if (!lead.email) return

        // Simple template for email subject/body
        const subject = `Propuesta para ${lead.name}`
        const body = `Hola, vi que ${lead.name} podría mejorar su presencia online...`

        window.location.href = `mailto:${lead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }

    const stats = {
        total: leads.length,
        contacted: leads.filter(l => l.contacted).length,
        pending: leads.filter(l => !l.contacted).length
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-0 max-w-5xl mx-auto">
            {/* WhatsApp Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewOpen(false)}>
                    <div className="bg-background p-6 rounded-lg w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold mb-2">Mensaje para {selectedLead?.name}</h3>
                        <textarea
                            value={previewMessage}
                            onChange={(e) => setPreviewMessage(e.target.value)}
                            className="w-full h-40 p-3 border rounded-md text-sm resize-none"
                        />
                        <div className="flex gap-2 mt-4">
                            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={confirmWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Enviar WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Mis Leads</h1>
                    <p className="text-muted-foreground">
                        {stats.total} leads | {stats.contacted} contactados | {stats.pending} pendientes
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Plantilla
                </Button>
            </div>

            {/* Template Settings */}
            {showSettings && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Plantilla de WhatsApp</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            value={template}
                            onChange={(e) => setTemplate(e.target.value)}
                            className="w-full h-32 p-3 border rounded-md text-sm resize-none"
                            placeholder="Usa {{Nombre Negocio}}, {{Ciudad}}, {{Categoría}} como variables"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Variables: {'{{Nombre Negocio}}'}, {'{{Ciudad}}'}, {'{{Categoría}}'}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre, teléfono, email o ciudad..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={filterStatus === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('all')}
                    >
                        Todos
                    </Button>
                    <Button
                        variant={filterStatus === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('pending')}
                    >
                        Pendientes
                    </Button>
                    <Button
                        variant={filterStatus === 'contacted' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterStatus('contacted')}
                    >
                        Contactados
                    </Button>
                </div>
            </div>

            {/* Leads List */}
            <Card>
                <CardContent className="p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {search ? "No se encontraron leads" : "Aún no tienes leads guardados"}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className="flex items-center justify-between p-4 hover:bg-muted/50"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium truncate">{lead.name}</h3>
                                            {lead.contacted && (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            {lead.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phone}
                                                </span>
                                            )}
                                            {lead.city && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {lead.city}
                                                </span>
                                            )}
                                            {lead.email && (
                                                <span className="flex items-center gap-1 text-blue-600">
                                                    <Mail className="h-3 w-3" />
                                                    {lead.email}
                                                </span>
                                            )}
                                            {(lead.rating || lead.reviewCount) && (
                                                <span className="flex items-center gap-1">
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                    {lead.rating || '-'}
                                                    {lead.reviewCount !== undefined && (
                                                        <span className="text-muted-foreground">({lead.reviewCount})</span>
                                                    )}
                                                </span>
                                            )}
                                            {lead.category && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {lead.category}
                                                </Badge>
                                            )}
                                            {lead.website ? (
                                                <a
                                                    href={lead.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline text-xs truncate max-w-[150px]"
                                                >
                                                    🌐 Web
                                                </a>
                                            ) : (
                                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                                    Sin Web
                                                </Badge>
                                            )}
                                            {lead.mapsUrl && (
                                                <a
                                                    href={lead.mapsUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 hover:underline text-xs"
                                                >
                                                    📍 Maps
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-4 flex flex-col gap-2">
                                        {lead.phone && !lead.contacted && (
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white w-full"
                                                onClick={() => handleWhatsApp(lead)}
                                            >
                                                <MessageCircle className="h-4 w-4 mr-1" />
                                                WhatsApp
                                            </Button>
                                        )}
                                        {lead.email && !lead.contacted && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                                                onClick={() => handleEmail(lead)}
                                            >
                                                <Mail className="h-4 w-4 mr-1" />
                                                Email
                                            </Button>
                                        )}
                                        {lead.contacted && (
                                            <Badge variant="outline" className="text-green-600 border-green-600">
                                                Contactado
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
