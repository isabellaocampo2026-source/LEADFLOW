"use client"

import { useState, useEffect } from "react"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Download, Search, Trash2, Edit2, Loader2, FileSpreadsheet } from "lucide-react"
import { getContacts, addContact, deleteContact, Contact, NewContact } from "@/app/actions/contacts"
import { generateInstantlyCSV, downloadCSV } from "@/lib/export/csv-instantly"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ContactsPage() {
    const locale = useLocale()
    const { toast } = useToast()
    const [contacts, setContacts] = useState<Contact[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [openDialog, setOpenDialog] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form State
    const [formData, setFormData] = useState<Partial<NewContact>>({
        source: 'manual'
    })

    useEffect(() => {
        loadContacts()
    }, [])

    const loadContacts = async () => {
        setLoading(true)
        const res = await getContacts()
        if (res.success) {
            setContacts(res.data)
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
        setLoading(false)
    }

    const filteredContacts = contacts.filter(c => {
        const query = searchQuery.toLowerCase()
        return (
            c.first_name.toLowerCase().includes(query) ||
            c.last_name?.toLowerCase().includes(query) ||
            c.company_name.toLowerCase().includes(query) ||
            c.email.toLowerCase().includes(query)
        )
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic Validation
        if (!formData.email || !formData.first_name || !formData.company_name || !formData.job_title || !formData.specialty) {
            toast({ title: "Faltan datos", description: "Email, Nombre, Empresa, Cargo y Especialidad son obligatorios.", variant: "destructive" })
            return
        }

        // Email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            toast({ title: "Email inválido", description: "Por favor revisa el formato del email.", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        const res = await addContact(formData as NewContact)
        setIsSubmitting(false)

        if (res.success) {
            toast({ title: "Contacto guardado", description: "Listo para exportar a Instantly." })
            setOpenDialog(false)
            setFormData({ source: 'manual' }) // Reset
            loadContacts()
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("¿Seguro que quieres eliminar este contacto?")) return
        const res = await deleteContact(id)
        if (res.success) {
            setContacts(contacts.filter(c => c.id !== id))
            toast({ title: "Eliminado", description: "Contacto eliminado." })
        }
    }

    const handleExport = () => {
        if (contacts.length === 0) {
            toast({ title: "Sin datos", description: "Agrega contactos antes de exportar.", variant: "destructive" })
            return
        }
        const csv = generateInstantlyCSV(contacts)
        const filename = `instantly_contacts_${new Date().toISOString().split('T')[0]}.csv`
        downloadCSV(csv, filename)
        toast({ title: "Exportado", description: `Archivo ${filename} descargado.` })
    }

    const handleInputChange = (field: keyof NewContact, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <div className="container mx-auto py-8 p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Cold Email Pipeline</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona tus contactos VIP para campañas de Instantly.ai
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                        Exportar CSV
                    </Button>
                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Contacto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nuevo Contacto VIP</DialogTitle>
                                <DialogDescription>
                                    Agrega un decision-maker. Campos marcados con * son obligatorios para Instantly.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                {/* Email */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-red-500 font-bold">Email *</Label>
                                    <Input
                                        id="email"
                                        placeholder="ceo@empresa.com"
                                        value={formData.email || ''}
                                        onChange={e => handleInputChange('email', e.target.value)}
                                        required
                                    />
                                </div>
                                {/* Website */}
                                <div className="space-y-2">
                                    <Label htmlFor="website">Sitio Web</Label>
                                    <Input
                                        id="website"
                                        placeholder="empresa.com"
                                        value={formData.website || ''}
                                        onChange={e => handleInputChange('website', e.target.value)}
                                    />
                                </div>

                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="first_name">Nombre (First Name) *</Label>
                                    <Input
                                        id="first_name"
                                        placeholder="Juan"
                                        value={formData.first_name || ''}
                                        onChange={e => handleInputChange('first_name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Apellido (Last Name)</Label>
                                    <Input
                                        id="last_name"
                                        placeholder="Perez"
                                        value={formData.last_name || ''}
                                        onChange={e => handleInputChange('last_name', e.target.value)}
                                    />
                                </div>

                                {/* Professional */}
                                <div className="space-y-2">
                                    <Label htmlFor="company">Empresa *</Label>
                                    <Input
                                        id="company"
                                        placeholder="Agencia X"
                                        value={formData.company_name || ''}
                                        onChange={e => handleInputChange('company_name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="title">Cargo / Título *</Label>
                                    <Input
                                        id="title"
                                        placeholder="CEO / Fundador"
                                        value={formData.job_title || ''}
                                        onChange={e => handleInputChange('job_title', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Context */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">Ciudad</Label>
                                    <Input
                                        id="city"
                                        placeholder="Madrid"
                                        value={formData.city || ''}
                                        onChange={e => handleInputChange('city', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="specialty">Especialidad *</Label>
                                    <Input
                                        id="specialty"
                                        placeholder="Ej: Odontología Estética"
                                        value={formData.specialty || ''}
                                        onChange={e => handleInputChange('specialty', e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Note */}
                                <div className="col-span-1 md:col-span-2 space-y-2">
                                    <Label htmlFor="note">Nota Personal (para IA de Instantly)</Label>
                                    <Textarea
                                        id="note"
                                        placeholder="Escribe algo específico sobre el cliente..."
                                        className="h-24"
                                        value={formData.personal_note || ''}
                                        onChange={e => handleInputChange('personal_note', e.target.value)}
                                        maxLength={2000}
                                    />
                                    <div className="text-xs text-muted-foreground text-right">
                                        {(formData.personal_note?.length || 0)}/2000
                                    </div>
                                </div>

                                <DialogFooter className="col-span-1 md:col-span-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Guardar Contacto
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                        <CardTitle>Base de Datos ({filteredContacts.length})</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar contactos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre / Cargo</TableHead>
                                <TableHead>Empresa</TableHead>
                                <TableHead>Especialidad</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                                    </TableCell>
                                </TableRow>
                            ) : filteredContacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No hay contactos. ¡Agrega el primero!
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <TableRow key={contact.id}>
                                        <TableCell>
                                            <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                                            <div className="text-xs text-muted-foreground">{contact.job_title}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{contact.company_name}</div>
                                            <div className="text-xs text-muted-foreground">{contact.city}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm bg-secondary/50 px-2 py-1 rounded inline-block">
                                                {contact.specialty}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{contact.email}</div>
                                            <div className="text-xs text-blue-500 truncate max-w-[150px]">{contact.website}</div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
