"use client"

import { useEffect, useState, useMemo } from "react"
import { getLeads, SavedLead, deleteLead, updateLead } from "@/app/actions/leads"
import { markAsContacted, enrichLeadWithEmail } from "@/app/actions/scrape"
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
    Download
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
    const [filterStatus, setFilterStatus] = useState<'all' | 'contacted' | 'pending' | 'withEmail'>('all')
    const [copiedEmail, setCopiedEmail] = useState<string | null>(null)
    const [enrichingId, setEnrichingId] = useState<string | null>(null)

    // Edit Email Modal
    const [editOpen, setEditOpen] = useState(false)
    const [editingLead, setEditingLead] = useState<SavedLead | null>(null)
    const [newEmail, setNewEmail] = useState("")
    const [isSaving, setIsSaving] = useState(false)

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

    const handleEnrich = async (lead: SavedLead) => {
        if (!lead.website || enrichingId) return
        setEnrichingId(lead.id)

        try {
            const result = await enrichLeadWithEmail(lead.placeId, lead.website)
            if (result.success && result.email) {
                setLeads(prev => prev.map(l =>
                    l.id === lead.id ? { ...l, email: result.email } : l
                ))
                toast({ title: "Email encontrado", description: result.email })
            } else {
                toast({ title: "No encontrado", description: "No se halló email público.", variant: "destructive" })
            }
        } catch (error) {
            console.error(error)
            toast({ title: "Error", description: "Fallo al buscar email", variant: "destructive" })
        } finally {
            setEnrichingId(null)
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

    const startEditEmail = (lead: SavedLead) => {
        setEditingLead(lead)
        setNewEmail(lead.email || "")
        setEditOpen(true)
    }

    const saveEmail = async () => {
        if (!editingLead) return
        setIsSaving(true)
        try {
            const success = await updateLead(editingLead.id, { email: newEmail })
            if (success) {
                setLeads(prev => prev.map(l =>
                    l.id === editingLead.id ? { ...l, email: newEmail } : l
                ))
                toast({ title: "Guardado", description: "Email actualizado correctamente." })
                setEditOpen(false)
            } else {
                toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" })
            }
        } catch (e) {
            toast({ title: "Error", description: "Falló la actualización.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
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
        total: leads.length,
        contacted: leads.filter(l => l.contacted).length,
        withEmail: leads.filter(l => l.email).length
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Mis Leads</h1>
                    <p className="text-muted-foreground">
                        {stats.total} leads | {stats.withEmail} con email | {stats.contacted} contactados
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Plantilla
                    </Button>
                    <Button variant="default" size="sm" onClick={handleExport} className="bg-purple-600 hover:bg-purple-700">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar Instantly
                    </Button>
                </div>
            </div>

            {/* Editing Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Email</DialogTitle>
                        <DialogDescription>
                            Añade o corrige el email para <b>{editingLead?.name}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label>Email</Label>
                        <Input
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            placeholder="ejemplo@empresa.com"
                            onKeyDown={e => e.key === 'Enter' && saveEmail()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                        <Button onClick={saveEmail} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2 bg-muted p-1 rounded-lg">
                    <Button variant={filterStatus === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterStatus('all')}>Todos</Button>
                    <Button variant={filterStatus === 'withEmail' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterStatus('withEmail')}>Con Email</Button>
                    <Button variant={filterStatus === 'contacted' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterStatus('contacted')}>Contactados</Button>
                    <Button variant={filterStatus === 'pending' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilterStatus('pending')}>Pendientes</Button>
                </div>
            </div>

            {/* Leads List */}
            <Card>
                <CardContent className="p-0">
                    {filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {search ? "No se encontraron leads" : "Vacío"}
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredLeads.map((lead) => (
                                <div key={lead.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium truncate">{lead.name}</h3>
                                            {lead.contacted && <Badge variant="outline" className="text-green-600 border-green-600 text-[10px] px-1 py-0 h-5">Contactado</Badge>}
                                        </div>

                                        {/* Meta Row */}
                                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                                            {/* Email Section (Editable) */}
                                            <div
                                                className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-colors ${lead.email ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                onClick={() => startEditEmail(lead)}
                                                title="Clic para editar email"
                                            >
                                                <Mail className="h-3 w-3" />
                                                <span className="font-medium">{lead.email || "Añadir Email"}</span>
                                                <Pencil className="h-3 w-3 opacity-50 ml-1" />
                                            </div>

                                            {lead.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {lead.phone}
                                                </span>
                                            )}

                                            {lead.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{lead.city}</span>}

                                            {lead.website ? (
                                                <a href={lead.website} target="_blank" className="text-blue-500 hover:underline text-xs">Web ►</a>
                                            ) : (
                                                <span className="text-orange-500 text-xs">Sin Web</span>
                                            )}

                                            {/* Hybrid Algo Button */}
                                            {lead.website && !lead.email && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={enrichingId === lead.id}
                                                    onClick={(e) => { e.stopPropagation(); handleEnrich(lead); }}
                                                    className="h-5 px-2 text-[10px] text-purple-600 bg-purple-50 hover:bg-purple-100"
                                                >
                                                    {enrichingId === lead.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "🤖 Buscar Email"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {lead.phone && (
                                            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleWhatsApp(lead)} title="WhatsApp">
                                                <MessageCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={async () => {
                                            if (confirm("¿Borrar lead?")) {
                                                await deleteLead(lead.id)
                                                setLeads(l => l.filter(x => x.id !== lead.id))
                                            }
                                        }}>
                                            <span className="sr-only">Borrar</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* WA Preview - Kept same */}
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
                            <Button variant="outline" onClick={() => setPreviewOpen(false)} className="flex-1">Cancelar</Button>
                            <Button onClick={confirmWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">Enviar WhatsApp</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
