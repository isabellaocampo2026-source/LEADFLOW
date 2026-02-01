import { supabase } from "@/lib/supabase"

export async function getDashboardStats() {
    try {
        // Get total leads
        const { count: totalLeads, error: errorTotal } = await supabase
            .from('business_leads')
            .select('*', { count: 'exact', head: true })

        // Get contacted leads
        const { count: contactedLeads, error: errorContacted } = await supabase
            .from('business_leads')
            .select('*', { count: 'exact', head: true })
            .eq('contacted', true)

        // Get recent leads
        const { data: recentLeads, error: errorRecent } = await supabase
            .from('business_leads')
            .select('*')
            .order('scraped_at', { ascending: false })
            .limit(5)

        if (errorTotal || errorContacted || errorRecent) {
            throw new Error("Failed to fetch stats")
        }

        return {
            totalLeads: totalLeads || 0,
            contactedLeads: contactedLeads || 0,
            conversionRate: totalLeads ? Math.round(((contactedLeads || 0) / totalLeads) * 100) : 0,
            recentLeads: recentLeads || []
        }
    } catch (error) {
        console.error("Error fetching stats:", error)
        return {
            totalLeads: 0,
            contactedLeads: 0,
            conversionRate: 0,
            recentLeads: []
        }
    }
}
