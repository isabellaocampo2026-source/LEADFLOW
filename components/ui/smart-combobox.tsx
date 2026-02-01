"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface SmartComboboxProps {
    items: { value: string; label: string }[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    emptyText?: string
    allowCustom?: boolean
    customPlaceholder?: string
    disabled?: boolean
}

export function SmartCombobox({
    items,
    value,
    onChange,
    placeholder = "Seleccionar...",
    searchPlaceholder = "Buscar...",
    emptyText = "No encontrado.",
    allowCustom = false,
    customPlaceholder = "Escribir personalizado...",
    disabled = false
}: SmartComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const filteredItems = items

    // Handle custom value selection
    const handleSelect = (currentValue: string) => {
        onChange(currentValue === value ? "" : currentValue)
        setOpen(false)
    }

    const handleCustomSelect = () => {
        if (search.trim()) {
            onChange(search.trim())
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between font-normal text-left"
                    disabled={disabled}
                >
                    {value
                        ? (items.find((item) => item.value === value)?.label || value)
                        : <span className="text-muted-foreground">{placeholder}</span>}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    {/* Note: We handle filtering natively or rely on Command's default if we passed filtered items. 
                For custom input, Command default filtering can be tricky. 
                Let's use CommandInput to capture text.
            */}
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {allowCustom ? (
                                <div className="p-2 cursor-pointer hover:bg-muted rounded-sm text-sm" onClick={handleCustomSelect}>
                                    <div className="flex items-center gap-2 text-primary font-medium">
                                        <Plus className="h-3 w-3" /> Usar "{search}"
                                    </div>
                                </div>
                            ) : (
                                emptyText
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {items
                                .filter(item => item.label.toLowerCase().includes(search.toLowerCase()))
                                .slice(0, 50) // Limit render performance
                                .map((item) => (
                                    <CommandItem
                                        key={item.value}
                                        value={item.value}
                                        onSelect={(currentValue) => {
                                            // CommandItem converts value to lowercase usually. 
                                            // We use the item.value directly.
                                            onChange(item.value)
                                            setOpen(false)
                                            setSearch("")
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === item.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {item.label}
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
