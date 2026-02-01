"use client"

import { useState, useRef } from "react"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search, AlertTriangle, CheckCircle, Globe, Star, Plus, Upload } from "lucide-react"
import { auditLeads, saveAuditedLeads, AuditResult } from "@/app/actions/audit"
import { Badge } from "@/components/ui/badge"
import Papa from "papaparse"

export default function ValidatorPage() {
    const locale = useLocale()

    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [results, setResults] = useState<AuditResult[]>([])
    const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                const rows = results.data
                if (!rows || rows.length === 0) return

                // Smart Column Detection
                const headers = Object.keys(rows[0]).map(h => h.toLowerCase())
                const nameKey = Object.keys(rows[0]).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('nombre') || k.toLowerCase().includes('negocio') || k.toLowerCase().includes('company')) || Object.keys(rows[0])[0]
                const cityKey = Object.keys(rows[0]).find(k => k.toLowerCase().includes('city') || k.toLowerCase().includes('ciudad') || k.toLowerCase().includes('ubicacion'))

                const newQueries = rows.map((row: any) => {
                    const name = row[nameKey]
                    const city = cityKey ? row[cityKey] : ''
                    if (!name) return null
                    return city ? `${name}, ${city}` : name
                }).filter(Boolean)

                setInput(prev => {
                    const existing = prev ? prev + '\n' : ''
                    return existing + newQueries.join('\n')
                })

                // Reset input
                if (fileInputRef.current) fileInputRef.current.value = ''
            },
            error: (err: any) => {
                console.error("CSV Error:", err)
                alert("Error al leer el CSV")
            }
        })
    }

    async function handleAudit() {
        if (!input.trim()) return

        setIsLoading(true)
        setResults([])
        setSelectedResults(new Set())

        try {
            // Split by new lines and clean
            const queries = input
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 3) // Basic filter for empty lines or too short

            if (queries.length === 0) {
                alert("Ingresa al menos un nombre de negocio")
                setIsLoading(false)
                return
            }

            const response = await auditLeads(queries)
            if (response.success) {
                setResults(response.results)
                // Auto-select opportunities
                const opportunities = new Set<number>()
                response.results.forEach((r, idx) => {
                    if (r.found && r.status === 'good_opportunity') {
                        opportunities.add(idx)
                    }
                })
                setSelectedResults(opportunities)
            }
        } catch (error) {
            console.error(error)
            alert("Error al auditar")
        } finally {
            setIsLoading(false)
        }
    }

    async function handleSaveSelected() {
        if (selectedResults.size === 0) return
        setIsSaving(true)
        try {
            const toSave = results.filter((_, idx) => selectedResults.has(idx))
            const result = await saveAuditedLeads(toSave)
            if (result.success) {
                alert(`¡${result.count} leads guardados exitosamente!`)
                // Redirect or reset?
            }
        } catch (e) {
            alert("Error al guardar")
        } finally {
            setIsSaving(false)
        }
    }

    const toggleSelection = (idx: number) => {
        const next = new Set(selectedResults)
        if (next.has(idx)) next.delete(idx)
        else next.add(idx)
        setSelectedResults(next)
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold mb-2">Auditor SEO</h1>
                <p className="text-muted-foreground">
                    Valida leads de fuentes externas (Apollo, LinkedIn) buscando sus métricas reales en Google Maps.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex justify-between items-center">
                                <span>Pegar Lista</span>
                                <div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept=".csv"
                                        onChange={handleFileImport}
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        title="Importar CSV"
                                        className="h-8 text-xs"
                                    >
                                        <Upload className="h-3.5 w-3.5 mr-1" />
                                        CSV
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-2">
                                    Formato: "Nombre Negocio, Ciudad" (Uno por línea)
                                </label>
                                <Textarea
                                    placeholder={`Clínica Dental Sonrisas, Madrid\nRestaurante El Gran Chef, Barcelona\n...`}
                                    className="min-h-[300px] font-mono text-sm"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>
                            <Button
                                onClick={handleAudit}
                                disabled={isLoading || !input.trim()}
                                className="w-full"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Auditando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="mr-2 h-4 w-4" />
                                        Auditar SEO
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="lg:col-span-2 space-y-4">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-lg">Resultados {results.length > 0 && `(${results.length})`}</CardTitle>
                            {results.length > 0 && (
                                <Button size="sm" onClick={handleSaveSelected} disabled={isSaving || selectedResults.size === 0}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                                    Guardar ({selectedResults.size})
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto min-h-[400px]">
                            {results.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 opacity-50">
                                    <Search className="h-12 w-12 mb-4" />
                                    <p>Los resultados aparecerán aquí</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {results.map((r, idx) => (
                                        <div
                                            key={idx}
                                            className={`
                                                p-4 rounded-lg border flex items-start justify-between gap-4 transition-all
                                                ${selectedResults.has(idx) ? 'border-primary bg-primary/5' : 'bg-card hover:bg-muted/50'}
                                                ${!r.found ? 'opacity-60 bg-muted/20' : ''}
                                            `}
                                        >
                                            {/* Checkbox */}
                                            {r.found && (
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedResults.has(idx)}
                                                        onChange={() => toggleSelection(idx)}
                                                        className="h-4 w-4 rounded border-primary"
                                                    />
                                                </div>
                                            )}

                                            {/* Info */}
                                            <div className="flex-1 space-y-1">
                                                <div className="font-medium flex items-center gap-2">
                                                    {r.found ? r.data?.name : r.query}
                                                    {r.status === 'good_opportunity' && (
                                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Oportunidad</Badge>
                                                    )}
                                                    {!r.found && (
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">No encontrado</Badge>
                                                    )}
                                                </div>

                                                {r.found && r.data && (
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                            <span className={r.data.rating < 4.0 ? "text-yellow-600 font-bold" : ""}>
                                                                {r.data.rating}
                                                            </span>
                                                        </div>
                                                        <div className="">
                                                            {r.data.reviews} reseñas
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Globe className="h-3 w-3" />
                                                            {r.data.website ? (
                                                                <a href={r.data.website} target="_blank" className="hover:underline truncate max-w-[150px]">
                                                                    {r.data.website.replace('https://', '').replace('www.', '')}
                                                                </a>
                                                            ) : (
                                                                <span className="text-red-500 font-medium">Sin Web</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {!r.found && (
                                                    <p className="text-xs text-muted-foreground">La búsqueda no arrojó resultados en Maps.</p>
                                                )}
                                            </div>

                                            {/* Status Icon */}
                                            {r.found && (
                                                <div className="flex flex-col items-end gap-1">
                                                    {r.status === 'good_opportunity' ? (
                                                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                    ) : (
                                                        <CheckCircle className="h-5 w-5 text-green-500 opacity-20" />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
