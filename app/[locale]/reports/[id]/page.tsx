"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { getReportWithLeads, updateReport, removeLeadFromReport, toggleLeadWhatsapp, getAvailableLeads, addLeadsToReport, ReportWithLeads, BusinessLead } from "@/app/actions/reports"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Loader2,
    Phone,
    Globe,
    MapPin,
    Star,
    Trash2,
    Plus,
    Download,
    MessageCircle,
    X,
    Check,
    Search,
    Mail
} from "lucide-react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { generateReportHTML } from "@/lib/export/html-generator"
import { useWhatsAppTemplate } from "@/lib/hooks/use-whatsapp-template"
import { enrichLead } from "@/app/actions/enrich"
import { useToast } from "@/components/ui/use-toast"


export default function ReportDetailPage() {
    const params = useParams()
    const locale = useLocale()
    const reportId = params.id as string
    const { toast } = useToast()

    const [report, setReport] = useState<ReportWithLeads | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Edit mode for name/client
    const [editName, setEditName] = useState("")
    const [editClient, setEditClient] = useState("")
    const [editSenderPhone, setEditSenderPhone] = useState("")
    const [editTemplate, setEditTemplate] = useState("")

    // Global Template
    const { template: globalTemplate } = useWhatsAppTemplate()

    // Add leads modal
    const [showAddModal, setShowAddModal] = useState(false)
    const [availableLeads, setAvailableLeads] = useState<BusinessLead[]>([])
    const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set())
    const [searchFilter, setSearchFilter] = useState("")
    const [isLoadingLeads, setIsLoadingLeads] = useState(false)

    // WhatsApp Msg State
    const [selectedLead, setSelectedLead] = useState<BusinessLead | null>(null)
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewMessage, setPreviewMessage] = useState("")

    // Enrichment State
    const [enrichingLeads, setEnrichingLeads] = useState<Set<string>>(new Set())

    useEffect(() => {
        loadReport()
    }, [reportId])

    async function handleEnrichLead(lead: BusinessLead) {
        if (!lead.website || !lead.id) return

        setEnrichingLeads(prev => new Set(prev).add(lead.id!))
        toast.info(`Buscando emails para ${lead.name}...`)

        try {
            const result = await enrichLead(lead.id, lead.website)

            if (result.success) {
                const count = result.savedCount || 0
                if (count > 0) {
                    toast.success(`¡Encontrados ${count} emails nuevos!`)
                } else {
                    toast.warning("No se encontraron emails públicos para este dominio.")
                }
                loadReport() // Reload to show new data
            } else {
                toast({
                    title: "Error al buscar",
                    description: `${result.error} ${result.debugInfo ? `(${result.debugInfo})` : ''}`,
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast.error("Error de conexión")
        } finally {
            setEnrichingLeads(prev => {
                const next = new Set(prev)
                next.delete(lead.id!)
                return next
            })
        }
    }

    async function loadReport() {
        setIsLoading(true)
        const result = await getReportWithLeads(reportId)
        if (result.success && result.data) {
            setReport(result.data)
            setEditName(result.data.name)
            setEditClient(result.data.client_name || "")
            setEditSenderPhone(result.data.sender_phone || "")
            setEditTemplate(result.data.whatsapp_template || globalTemplate)
        }
        setIsLoading(false)
    }

    async function handleSaveDetails() {
        if (!report) return
        setIsSaving(true)
        await updateReport(report.id, {
            name: editName,
            client_name: editClient,
            sender_phone: editSenderPhone,
            whatsapp_template: editTemplate
        })
        await loadReport()
        setIsSaving(false)
    }

    async function handleRemoveLead(leadId: string) {
        if (!report) return
        await removeLeadFromReport(report.id, leadId)
        loadReport()
    }

    async function handleToggleWhatsapp(leadId: string, currentValue: boolean | null | undefined) {
        await toggleLeadWhatsapp(leadId, !(currentValue === true))
        loadReport()
    }

    async function openAddModal() {
        setShowAddModal(true)
        setIsLoadingLeads(true)
        setSelectedToAdd(new Set())
        const result = await getAvailableLeads(reportId)
        if (result.success && result.data) {
            setAvailableLeads(result.data)
        }
        setIsLoadingLeads(false)
    }

    async function handleAddSelected() {
        if (selectedToAdd.size === 0) return
        await addLeadsToReport(reportId, Array.from(selectedToAdd))
        setShowAddModal(false)
        loadReport()
    }

    function handleExportHTML() {
        if (!report) return

        const html = generateReportHTML({
            reportName: report.name,
            clientName: report.client_name || undefined,
            leads: report.leads,
            whatsappTemplate: globalTemplate, // Use global template as fallback
            onlyWithWhatsapp: false
        })

        const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${report.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.html`
        a.click()
        URL.revokeObjectURL(url)
    }

    // WhatsApp Logic
    const handleWhatsApp = (lead: BusinessLead) => {
        if (!lead.phone) return

        // Use report template if available, otherwise global
        const templateToUse = editTemplate || globalTemplate

        const message = templateToUse
            .replace(/{{Nombre Negocio}}/g, lead.name)
            .replace(/{{Nombre}}/g, lead.name)
            .replace(/{{Ciudad}}/g, lead.city || "")
            .replace(/{{Categoría}}/g, lead.category || "")

        setPreviewMessage(message)
        setSelectedLead(lead)
        setPreviewOpen(true)
    }

    const confirmWhatsApp = async () => {
        if (!selectedLead?.phone || !report) return

        let phone = selectedLead.phone.replace(/\D/g, '')
        // Simple country code fix - assumption: if starts with 3 and is 10 digits (Colombia), add 57
        if (phone.length === 10 && phone.startsWith('3')) {
            phone = '57' + phone
        }

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(previewMessage)}`, '_blank')

        await toggleLeadWhatsapp(selectedLead.id!, true) // Mark as "Has WhatsApp" / Contacted
        loadReport()
        setPreviewOpen(false)
    }

    const filteredAvailable = useMemo(() => {
        if (!searchFilter) return availableLeads
        const lower = searchFilter.toLowerCase()
        return availableLeads.filter(l =>
            l.name.toLowerCase().includes(lower) ||
            (l.category || "").toLowerCase().includes(lower) ||
            (l.city || "").toLowerCase().includes(lower)
        )
    }, [availableLeads, searchFilter])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!report) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground">Reporte no encontrado</p>
                <Link href={`/${locale}/reports`}>
                    <Button variant="link">Volver a Reportes</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-0 max-w-6xl mx-auto w-full">
            {/* WhatsApp Preview Modal */}
            {previewOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setPreviewOpen(false)}>
                    <div className="bg-background p-6 rounded-lg w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">Mensaje para {selectedLead?.name}</h3>
                            <div className="flex flex-col gap-1 mt-1 text-sm">
                                <span className="text-muted-foreground">Cliente: <span className="font-medium text-foreground">{report?.client_name || "N/A"}</span></span>
                                {report?.sender_phone && (
                                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block w-fit">
                                        ⚠️ Usar WhatsApp: <strong>{report.sender_phone}</strong>
                                    </span>
                                )}
                            </div>
                        </div>
                        <textarea
                            value={previewMessage}
                            onChange={(e) => setPreviewMessage(e.target.value)}
                            className="w-full h-40 p-3 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
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

            {/* Add Leads Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
                    <div className="bg-background p-6 rounded-lg w-full max-w-2xl mx-4 shadow-2xl border max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Añadir Leads al Reporte</h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="mb-4 relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, categoría, ciudad..."
                                className="pl-8"
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded-md">
                            {isLoadingLeads ? (
                                <div className="p-8 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </div>
                            ) : filteredAvailable.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    No hay más leads disponibles para añadir.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredAvailable.map(lead => (
                                        <div
                                            key={lead.id}
                                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${selectedToAdd.has(lead.id!) ? 'bg-primary/10' : ''}`}
                                            onClick={() => {
                                                const newSet = new Set(selectedToAdd)
                                                if (newSet.has(lead.id!)) {
                                                    newSet.delete(lead.id!)
                                                } else {
                                                    newSet.add(lead.id!)
                                                }
                                                setSelectedToAdd(newSet)
                                            }}
                                        >
                                            <Checkbox checked={selectedToAdd.has(lead.id!)} />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{lead.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{lead.category} · {lead.city}</p>
                                            </div>
                                            {lead.phone && <Phone className="h-4 w-4 text-muted-foreground shrink-0" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t">
                            <span className="text-sm text-muted-foreground">
                                {selectedToAdd.size} seleccionados
                            </span>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleAddSelected} disabled={selectedToAdd.size === 0}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    Añadir ({selectedToAdd.size})
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div>
                    <Link href={`/${locale}/reports`} className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
                        ← Volver a Reportes
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">{report.name}</h2>
                    {report.client_name && (
                        <p className="text-muted-foreground">Cliente: {report.client_name}</p>
                    )}
                </div>
                <div className="flex gap-2 items-start">
                    <Button variant="outline" onClick={openAddModal}>
                        <Plus className="mr-1 h-4 w-4" />
                        Añadir Manualmente
                    </Button>
                    <Link href={`/${locale}/scraper?reportId=${report.id}&reportName=${encodeURIComponent(report.name)}`}>
                        <Button>
                            <Search className="mr-1 h-4 w-4" />
                            Buscar Nuevos Leads
                        </Button>
                    </Link>
                    <Button onClick={handleExportHTML} disabled={report.leads.length === 0}>
                        <Download className="mr-1 h-4 w-4" />
                        Exportar HTML
                    </Button>
                </div>
            </div>

            {/* Report Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Configuración del Reporte / Campaña</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Nombre del Reporte</label>
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Nombre del Cliente</label>
                            <Input value={editClient} onChange={(e) => setEditClient(e.target.value)} placeholder="Opcional" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium mb-1.5 block">
                                Teléfono de Salida (Recordatorio)
                                <span className="text-xs text-muted-foreground ml-2 font-normal">
                                    Te recordaremos usar este número al enviar mensajes.
                                </span>
                            </label>
                            <Input
                                value={editSenderPhone}
                                onChange={(e) => setEditSenderPhone(e.target.value)}
                                placeholder="Ej: +57 300 123 4567 (Número de la agencia para este cliente)"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            Plantilla de WhatsApp para esta Campaña
                            <span className="text-xs text-muted-foreground ml-2 font-normal">
                                Variables: {'{{Nombre}}'}, {'{{Nombre Negocio}}'}, {'{{Ciudad}}'}, {'{{Categoría}}'}
                            </span>
                        </label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={editTemplate}
                            onChange={(e) => setEditTemplate(e.target.value)}
                            placeholder="Hola {{Nombre}}, te escribo de parte de..."
                        />
                    </div>

                    <Button onClick={handleSaveDetails} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Guardar Configuración
                    </Button>
                </CardContent>
            </Card>

            {/* Leads in Report */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Leads en este Reporte ({report.leads.length})</CardTitle>
                            <CardDescription>
                                Marca "Tiene WhatsApp" para filtrar al exportar.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {report.leads.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <p>No hay leads en este reporte.</p>
                            <Button variant="link" onClick={openAddModal}>
                                <Plus className="mr-1 h-4 w-4" /> Añadir leads
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {report.leads.map((lead) => (
                                <Card key={lead.id} className="overflow-hidden border-muted hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <h3 className="font-semibold line-clamp-1" title={lead.name}>{lead.name}</h3>
                                            <div className="flex gap-1">
                                                {lead.phone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleWhatsApp(lead)}
                                                        title="Enviar WhatsApp"
                                                    >
                                                        <MessageCircle className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleRemoveLead(lead.id!)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5 text-sm">
                                            {lead.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <span className="truncate">{lead.phone}</span>
                                                </div>
                                            )}
                                            {lead.website && (
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <a href={lead.website} target="_blank" className="text-blue-500 hover:underline truncate">Website</a>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="h-3 w-3 shrink-0" />
                                                <span className="truncate">{lead.city || lead.address}</span>
                                            </div>

                                            {/* Found Emails Section */}
                                            {lead.additional_emails && lead.additional_emails.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-dashed">
                                                    <p className="text-[10px] text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> Emails Encontrados:
                                                    </p>
                                                    <div className="flex flex-col gap-1">
                                                        {lead.additional_emails.map((email, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-primary/5 px-2 py-1 rounded text-xs group">
                                                                <span className="select-all block truncate max-w-[180px]" title={email}>{email}</span>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(email);
                                                                        toast({ description: "Email copiado al portapapeles" });
                                                                    }}
                                                                >
                                                                    <span className="sr-only">Copiar</span>
                                                                    <span className="text-[10px]">📋</span>
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Enrich Action (If website exists & no emails found yet or user wants to retry) */}
                                            {lead.website && (!lead.additional_emails || lead.additional_emails.length === 0) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2 h-7 text-xs bg-muted/30 hover:bg-primary/5 border-dashed"
                                                    onClick={() => handleEnrichLead(lead)}
                                                    disabled={enrichingLeads.has(lead.id!)}
                                                >
                                                    {enrichingLeads.has(lead.id!) ? (
                                                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                    ) : (
                                                        <Search className="h-3 w-3 mr-1" />
                                                    )}
                                                    {enrichingLeads.has(lead.id!) ? "Buscando..." : "Buscar Emails Corporativos"}
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                            <div
                                                className="flex items-center gap-2 cursor-pointer"
                                                onClick={() => handleToggleWhatsapp(lead.id!, (lead as any).hasWhatsapp)}
                                            >
                                                <Checkbox checked={(lead as any).hasWhatsapp === true} />
                                                <span className="text-xs text-muted-foreground">Tiene WhatsApp</span>
                                            </div>
                                            {lead.rating && (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                                    {lead.rating}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
