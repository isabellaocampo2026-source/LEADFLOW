'use server'

import { supabase } from "@/lib/supabase"

export interface Contact {
    id: string
    email: string
    first_name: string
    last_name?: string
    company_name: string
    job_title: string
    website?: string
    city?: string
    specialty: string
    personal_note?: string
    source?: string
    created_at: string
}

export type NewContact = Omit<Contact, 'id' | 'created_at' | 'source'> & { source?: string }

/**
 * Fetch all contacts, ordered by newest.
 */
export async function getContacts() {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, data: data as Contact[] }
    } catch (error: any) {
        console.error('Error fetching contacts:', error)
        return { success: false, error: error.message, data: [] }
    }
}

/**
 * Add a single manual contact.
 */
export async function addContact(contact: NewContact) {
    try {
        const { data, error } = await supabase
            .from('contacts')
            .insert([contact])
            .select()
            .single()

        if (error) {
            if (error.code === '23505') { // Unique violation
                return { success: false, error: "Este email ya existe en tus contactos." }
            }
            throw error
        }

        return { success: true, data }
    } catch (error: any) {
        console.error('Error adding contact:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Delete a contact.
 */
export async function deleteContact(id: string) {
    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting contact:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Update a contact.
 */
export async function updateContact(id: string, updates: Partial<NewContact>) {
    try {
        const { error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id)

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Error updating contact:', error)
        return { success: false, error: error.message }
    }
}
