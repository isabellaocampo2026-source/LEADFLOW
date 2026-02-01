"use client"

import { useEffect, useState } from "react"
import { getReports, createReport, deleteReport, Report } from "@/app/actions/reports"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Loader2,
    FileText,
    Trash2,
    ExternalLink,
    Users
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useLocale } from "next-intl"

export default function ReportsPage() {
    const locale = useLocale()
    const [reports, setReports] = useState<Report[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)

    // New report form
    const [showForm, setShowForm] = useState(false)
    const [newName, setNewName] = useState("")
    const [newClient, setNewClient] = useState("")

    useEffect(() => {
        loadReports()
    }, [])

    async function loadReports() {
        setIsLoading(true)
        const result = await getReports()
        if (result.success && result.data) {
            setReports(result.data)
        }
        setIsLoading(false)
    }

    async function handleCreate() {
        if (!newName.trim()) return

        setIsCreating(true)
        const result = await createReport({
            name: newName.trim(),
            client_name: newClient.trim() || undefined
        })

        if (result.success) {
            setNewName("")
            setNewClient("")
            setShowForm(false)
            loadReports()
        }
        setIsCreating(false)
    }

    async function handleDelete(reportId: string) {
        if (!confirm("¿Eliminar este reporte? Los leads NO se eliminarán de tu base de datos.")) return

        await deleteReport(reportId)
        loadReports()
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8 pt-0 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reportes para Clientes</h2>
                    <p className="text-muted-foreground">
                        Crea colecciones de leads y expórtalas como HTML para tus clientes.
                    </p>
                </div>
                <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Reporte
                </Button>
            </div>

            {/* Create Form */}
            {showForm && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1.5 block">Nombre del Reporte *</label>
                                <Input
                                    placeholder="Ej: Dentistas Bogotá - Enero 2026"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-1.5 block">Nombre del Cliente</label>
                                <Input
                                    placeholder="Ej: Dr. García"
                                    value={newClient}
                                    onChange={(e) => setNewClient(e.target.value)}
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
                                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
                                </Button>
                                <Button variant="ghost" onClick={() => setShowForm(false)}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Reports List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : reports.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No hay reportes aún</p>
                        <p className="text-sm">Crea tu primer reporte para empezar a organizar leads para tus clientes.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {reports.map((report) => (
                        <Card key={report.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="line-clamp-1" title={report.name}>
                                            {report.name}
                                        </CardTitle>
                                        {report.client_name && (
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <Users className="h-3 w-3" />
                                                {report.client_name}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="shrink-0">
                                        {report.lead_count || 0} leads
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <p className="text-xs text-muted-foreground mb-4">
                                    Creado {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: es })}
                                </p>
                                <div className="flex gap-2">
                                    <Link href={`/${locale}/reports/${report.id}`} className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full">
                                            <ExternalLink className="mr-1 h-3 w-3" />
                                            Ver / Editar
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(report.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
