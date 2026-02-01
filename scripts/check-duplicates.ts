
import { supabase } from "../lib/supabase"

async function checkDuplicates() {
    console.log("Checking for duplicates in business_leads...")

    const { data: leads, error } = await supabase
        .from('business_leads')
        .select('name, place_id, address')

    if (error) {
        console.error("Error fetching leads:", error)
        return
    }

    if (!leads || leads.length === 0) {
        console.log("No leads found.")
        return
    }

    const placeIdMap = new Map<string, number>()
    const nameMap = new Map<string, number>()
    const duplicates = []

    leads.forEach(lead => {
        // Check place_id duplicates
        const pidCount = placeIdMap.get(lead.place_id) || 0
        placeIdMap.set(lead.place_id, pidCount + 1)

        // Check name duplicates (heuristic)
        const nameCount = nameMap.get(lead.name) || 0
        nameMap.set(lead.name, nameCount + 1)
    })

    // Report
    console.log(`Total leads: ${leads.length}`)

    // Duplicates by Place ID
    const pidDupes = Array.from(placeIdMap.entries()).filter(([k, v]) => v > 1)
    console.log(`Duplicates by Place ID: ${pidDupes.length}`)
    if (pidDupes.length > 0) {
        console.log("Found Place ID duplicates (constraint missing?):", pidDupes)
    }

    // Duplicates by Name
    const nameDupes = Array.from(nameMap.entries()).filter(([k, v]) => v > 1)
    console.log(`Duplicates by Name: ${nameDupes.length}`)
    if (nameDupes.length > 0) {
        console.log("Potential duplicates by Name:", nameDupes.slice(0, 5))
    }
}

checkDuplicates()
