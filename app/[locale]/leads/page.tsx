"use client"

import { useEffect, useState, useMemo } from "react"
import { getLeads, SavedLead, deleteLead, updateLead } from "@/app/actions/leads"
import { markAsContacted } from "@/app/actions/scrape"
import { enrichLead } from "@/app/actions/enrich"
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
    Mail,
    Copy,
    Check,
    Pencil,
    Download,
    Trash2,
    Globe,
    X
} from "lucide-react"
import { useWhatsAppTemplate } from "@/lib/hooks/use-whatsapp-template"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"

// Helper to download simplified CSV
function downloadInstantlyCSV(leads: SavedLead[]) {
    // Header
    let csv = "Email,First Name,Last Name,Company Name,Personal Note,Website,Phone,City,State\n"

    leads.forEach(lead => {
        if (!lead.email) return

        // Name Split
        const parts = (lead.name || "Unknown").split(' ')
        const firstName = parts[0]
        const lastName = parts.slice(1).join(' ') || ""

        // Safe CSV fields
        const safe = (val: string | null | undefined) => `"${(val || "").replace(/"/g, '""')}"`

        const note = `Category: ${lead.category || ''} | Rating: ${lead.rating || ''}`

        // Rows
        csv += `${safe(lead.email)},${safe(firstName)},${safe(lastName)},${safe(lead.name)},${safe(note)},${safe(lead.website)},${safe(lead.phone)},${safe(lead.city)},${safe('')}\n`
    })

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `leads_instantly_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

export default function LeadsPage() {
    const { toast } = useToast()
    const [leads, setLeads] = useState<SavedLead[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [filterStatus, setFilterStatus] = useState<'all' | 'contacted' | 'pending' | 'withEmail' | 'archived'>('all')
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
    const [enrichingId, setEnrichingId] = useState<string | null>(null)

    // Inline Edit State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")

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
                (lead.email && lead.email.toLowerCase().includes(search.toLowerCase())) ||
                (lead.category && lead.category.toLowerCase().includes(search.toLowerCase()))

            // Status filter
            const isArchived = filterStatus === 'archived'
            if (!!lead.archived !== isArchived) return false // Strict separation

            const matchesStatus =
                filterStatus === 'all' ||
                filterStatus === 'archived' || // Handled above, but kept for clarity
                (filterStatus === 'contacted' && lead.contacted) ||
                (filterStatus === 'pending' && !lead.contacted) ||
                (filterStatus === 'withEmail' && lead.email)

            return matchesSearch && matchesStatus
        })
    }, [leads, search, filterStatus])

    const copyEmail = async (email: string) => {
        await navigator.clipboard.writeText(email)
        setCopiedEmail(email)
        setTimeout(() => setCopiedEmail(null), 2000)
    }

    const copySalesScript = async (lead: SavedLead) => {
        if (!lead.email) return

        // 1. Extract Name from Email (Simple heuristic)
        // juan.perez@... -> Juan
        // rodrigo@... -> Rodrigo
        let name = "Gerente" // Default
        const localPart = lead.email.split('@')[0]
        if (localPart) {
            // Take first part if dot or underscore exists
            const rawName = localPart.split(/[._]/)[0]
            // Capitalize
            name = rawName.charAt(0).toUpperCase() + rawName.slice(1)
        }

        // 2. Build Template
        const script = `Buenas tardes Sr ${name}, mi nombre es Mauricio de GMBstart.

Posicionamos firmas de abogados en los primeros lugares de las búsquedas locales de Google. Nuestros dos últimos casos alcanzaron el primer lugar y ya tienen 200 llamadas extra al mes.

Con esto podrías aumentar por mínimo que sea y mal que vaya 5 ventas extras al mes. No te quiero saturar por acá; somos una empresa seria que cree en el ganar-ganar y en la confianza. Tenemos un servicio valioso y queremos crear una relación a largo plazo.

Si te suena la idea, por favor respóndeme y te comento más o agendamos una reunión virtual`

        await navigator.clipboard.writeText(script)
        toast({ title: "Script Copiado", description: `Personalizado para "Sr ${name}"` })
    }

    const handleEnrich = async (lead: SavedLead) => {
        if (!lead.website || enrichingId) return
        setEnrichingId(lead.id)

        try {
            const result = await enrichLead(lead.id, lead.website)
            if (result.success && result.emails && result.emails.length > 0) {
                // If multiple emails found, take the best one or all
                const bestEmail = result.emails[0]

                // Update local state
                setLeads(prev => prev.map(l =>
                    l.id === lead.id ? { ...l, email: bestEmail } : l
                ))

                const sourceLabel = result.source === 'hunter' ? 'Hunter.io' : 'Web Scraper';
                toast({
                    title: `¡Email encontrado por ${sourceLabel}!`,
                    description: `Se han guardado ${result.emails.length} emails. ${bestEmail}`
                })
            } else {
                toast({
                    title: "No encontrado",
                    description: result.debugInfo || "No se halló email público. ¿Deseas descartar este lead?",
                    variant: "warning",
                    action: (
                        <Button variant="outline" size="sm" onClick={() => handleArchive(lead.id)} className="bg-destructive/10 hover:bg-destructive/20 border-destructive/50 text-destructive font-semibold">
                            Sí, Desechar
                        </Button>
                    )
                })
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Fallo al buscar email", variant: "destructive" })
        } finally {
            setEnrichingId(null)
        }
    }

    const handleArchive = async (id: string) => {
        // Optimistic
        setLeads(prev => prev.map(l => l.id === id ? { ...l, archived: true } : l))
        const { archiveLead } = await import("@/app/actions/leads")
        await archiveLead(id, true)
        toast({ title: "Lead Archivado", description: "Se ha movido a la papelera." })
    }

    const handleRestore = async (id: string) => {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, archived: false } : l))
        const { archiveLead } = await import("@/app/actions/leads")
        await archiveLead(id, false)
        toast({ title: "Lead Restaurado", description: "Vuelve a estar en tus activos." })
    }

    const toggleContacted = async (lead: SavedLead) => {
        const newValue = !lead.contacted
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, contacted: newValue } : l))
        await updateLead(lead.id, { contacted: newValue })
    }

    const startEditing = (lead: SavedLead) => {
        setEditingId(lead.id)
        setEditValue(lead.email || "")
    }

    const saveInlineEmail = async (id: string, newEmail: string) => {
        // If unchanged, just close
        const current = leads.find(l => l.id === id)?.email || ""
        if (newEmail.trim() === current) {
            setEditingId(null)
            return
        }

        // Optimistic update
        setLeads(prev => prev.map(l =>
            l.id === id ? { ...l, email: newEmail } : l
        ))
        setEditingId(null) // Close immediately for speed

        try {
            const success = await updateLead(id, { email: newEmail })
            if (success) {
                toast({ title: "Guardado", description: "Email actualizado." })
            } else {
                // Revert if failed (optional, but good UX)
                toast({ title: "Error", description: "No se guardó el cambio.", variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Fallo de conexión.", variant: "destructive" })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
        if (e.key === 'Enter') {
            saveInlineEmail(id, editValue)
        } else if (e.key === 'Escape') {
            setEditingId(null)
        }
    }

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

        setLeads(prev => prev.map(l =>
            l.placeId === selectedLead.placeId ? { ...l, contacted: true } : l
        ))
        setPreviewOpen(false)
    }

    const handleExport = () => {
        const leadsToExport = filteredLeads.filter(l => l.email)
        if (leadsToExport.length === 0) {
            toast({ title: "Nada que exportar", description: "Filtra leads que tengan email primero.", variant: "destructive" })
            return
        }
        downloadInstantlyCSV(leadsToExport)
        toast({ title: "Exportado", description: `Se descargaron ${leadsToExport.length} leads para Instantly.` })
    }

    const stats = {
        total: leads.filter(l => !l.archived).length,
        contacted: leads.filter(l => !l.archived && l.contacted).length,
        withEmail: leads.filter(l => !l.archived && l.email).length,
        archived: leads.filter(l => l.archived).length
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-0 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Mis Leads</h1>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {stats.contacted} Contactados</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {stats.withEmail} con Email</span>
                        <span className="flex items-center gap-1"><Trash2 className="h-3 w-3" /> {stats.archived} Archivados</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Plantilla
                    </Button>
                    <Button variant="default" size="sm" onClick={handleExport} className="bg-purple-600 hover:bg-purple-700">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                </div>
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
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar nombre, ciudad..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant={filterStatus === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('all')}>
                        Activos ({stats.total})
                    </Button>
                    <Button variant={filterStatus === 'contacted' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('contacted')}>
                        Contactados
                    </Button>
                    <Button variant={filterStatus === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('pending')}>
                        Pendientes
                    </Button>
                    <Button variant={filterStatus === 'withEmail' ? 'default' : 'outline'} size="sm" onClick={() => setFilterStatus('withEmail')}>
                        Con Email
                    </Button>
                    <div className="w-px h-6 bg-border mx-1 self-center" />
                    <Button variant={filterStatus === 'archived' ? 'destructive' : 'ghost'} size="sm" onClick={() => setFilterStatus('archived')} className={filterStatus === 'archived' ? "" : "text-muted-foreground hover:text-destructive"}>
                        <Trash2 className="h-4 w-4 mr-1" /> Papelera
                    </Button>
                </div>
            </div>

            {/* Leads List */}
            <Card>
                <CardContent className="p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            {filterStatus === 'archived' ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Trash2 className="h-8 w-8 opacity-20" />
                                    <p>La papelera está vacía.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Search className="h-8 w-8 opacity-20" />
                                    <p>No se encontraron leads con estos filtros.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredLeads.map((lead) => (
                                <div key={lead.id} className={`flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 transition-colors ${lead.contacted ? 'bg-green-50/30' : 'hover:bg-muted/30'}`}>

                                    {/* Left: Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between md:justify-start gap-3">
                                            <h3 className="font-semibold text-lg truncate leading-tight">{lead.name}</h3>

                                            {/* Badges */}
                                            <div className="flex gap-2 shrink-0">
                                                {lead.rating && (
                                                    <Badge variant="secondary" className="gap-1 px-1.5 h-6 bg-yellow-400/10 text-yellow-700 hover:bg-yellow-400/20 border-yellow-200">
                                                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                        <span className="font-bold">{lead.rating}</span>
                                                        <span className="text-muted-foreground/60 font-normal">({lead.reviewCount})</span>
                                                    </Badge>
                                                )}
                                                {lead.contacted && <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Contactado</Badge>}
                                            </div>
                                        </div>

                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                            {lead.category} • {lead.city} {lead.address && `• ${lead.address}`}
                                        </p>

                                        {/* Action Bar within Info */}
                                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                                            {/* Email Widget */}
                                            {editingId === lead.id ? (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-blue-600" />
                                                    <Input
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, lead.id)}
                                                        onBlur={() => saveInlineEmail(lead.id, editValue)}
                                                        className="h-7 w-[220px] text-xs"
                                                        placeholder="Pegar email aquí..."
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition-all border ${lead.email
                                                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                            : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border'}`}
                                                        onClick={() => {
                                                            if (lead.email) {
                                                                copyEmail(lead.email);
                                                                toast({ title: "Email Copiado", description: lead.email });
                                                            } else {
                                                                !lead.archived && startEditing(lead);
                                                            }
                                                        }}
                                                        title={lead.email ? "Clic para copiar email" : "Clic para añadir manual"}
                                                    >
                                                        <Mail className={`h-3.5 w-3.5 ${lead.email ? 'text-blue-600' : 'opacity-50'}`} />
                                                        <span className="font-medium text-xs">
                                                            {lead.email || "Añadir Email"}
                                                        </span>
                                                    </div>

                                                    {/* Separate Edit Button */}
                                                    {lead.email && !lead.archived && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-muted-foreground hover:text-primary opacity-50 hover:opacity-100"
                                                            onClick={(e) => { e.stopPropagation(); startEditing(lead); }}
                                                            title="Editar email manual"
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Copy Script Button */}
                                            {lead.email && !lead.archived && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => { e.stopPropagation(); copySalesScript(lead); }}
                                                    title="Copiar Script de Venta"
                                                >
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                            )}

                                            {/* Website Link */}
                                            {lead.website ? (
                                                <a href={lead.website} target="_blank" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                                                    <Globe className="h-3.5 w-3.5" /> Web
                                                </a>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground/50 cursor-not-allowed">
                                                    <Globe className="h-3.5 w-3.5" /> Sin Web
                                                </span>
                                            )}

                                            {/* Hunter Button (Only if Active, Has Web, No Email) */}
                                            {!lead.archived && lead.website && !lead.email && !editingId && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={enrichingId === lead.id}
                                                    onClick={(e) => { e.stopPropagation(); handleEnrich(lead); }}
                                                    className="h-7 px-3 text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 border border-purple-200"
                                                >
                                                    {enrichingId === lead.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Search className="h-3 w-3 mr-1" />}
                                                    Buscar Dueño
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2 md:self-center pt-2 md:pt-0 border-t md:border-t-0 mt-2 md:mt-0 justify-end">

                                        {!lead.archived ? (
                                            <>
                                                {/* Contact Toggle */}
                                                <Button
                                                    size="sm"
                                                    variant={lead.contacted ? "outline" : "outline"}
                                                    className={`h-9 px-3 text-xs gap-1.5 ${lead.contacted ? 'bg-green-50 text-green-700 border-green-200' : 'text-muted-foreground'}`}
                                                    onClick={() => toggleContacted(lead)}
                                                >
                                                    <CheckCircle2 className={`h-4 w-4 ${lead.contacted ? 'fill-green-200' : ''}`} />
                                                    {lead.contacted ? "Contactado" : "Marcar"}
                                                </Button>

                                                {/* WhatsApp */}
                                                {lead.phone && (
                                                    <Button size="icon" variant="ghost" className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-full" onClick={() => handleWhatsApp(lead)} title="Abrir WhatsApp">
                                                        <MessageCircle className="h-5 w-5" />
                                                    </Button>
                                                )}

                                                {/* Archive/Delete */}
                                                <div className="w-px h-6 bg-border mx-1" />
                                                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full" onClick={() => handleArchive(lead.id)} title="Mover a Papelera">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xs text-muted-foreground mr-2 italic">Archivado</span>
                                                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => handleRestore(lead.id)}>
                                                    <Check className="h-3 w-3" /> Restaurar
                                                </Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={async () => {
                                                    if (confirm("¿Eliminar definitivamente?")) {
                                                        await deleteLead(lead.id)
                                                        setLeads(l => l.filter(x => x.id !== lead.id))
                                                    }
                                                }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                    }
                </CardContent >
            </Card >

            {/* WA Preview - Kept same */}
            {
                previewOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewOpen(false)}>
                        <div className="bg-background p-6 rounded-lg w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-2">Mensaje para {selectedLead?.name}</h3>
                            <textarea
                                value={previewMessage}
                                onChange={(e) => setPreviewMessage(e.target.value)}
                                className="w-full h-40 p-3 border rounded-md text-sm resize-none"
                            />
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" onClick={() => setPreviewOpen(false)} className="flex-1">Cancelar</Button>
                                <Button onClick={confirmWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Enviar WhatsApp</Button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
