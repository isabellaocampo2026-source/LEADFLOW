'use server'

import { supabase } from "@/lib/supabase"

export async function getDashboardStats() {
    try {
        // 1. Total Leads
        const { count: totalLeads, error: countError } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })

        if (countError) throw countError

        // 2. Recent Activity (Last 5 leads)
        const { data: recentLeads, error: recentError } = await supabase
            .from('leads')
            .select('title, location, created_at, seller_name')
            .order('created_at', { ascending: false })
            .limit(5)

        if (recentError) throw recentError

        // 3. Stats by Source (Simple aggregation simulation since we don't have complex SQL functions yet)
        // For a real scalable app we'd use a .rpc() call to a sql function, but for small scale this works:
        const { data: leadsForStats } = await supabase.from('leads').select('source')

        // Grouping logic (JS side for simplicity for now)
        const sourceStats = (leadsForStats || []).reduce((acc: any, curr) => {
            acc[curr.source] = (acc[curr.source] || 0) + 1
            return acc
        }, {})

        return {
            success: true,
            data: {
                totalLeads: totalLeads || 0,
                recentActivity: recentLeads || [],
                sourceStats,
                // Mocking some future data until we have "Contacts" table
                connectedCalls: 0,
                conversionRate: 0
            }
        }
    } catch (error) {
        console.error("Error fetching dashboard stats:", error)
        return { success: false, error: "Failed to load dashboard data" }
    }
}
