
export interface ApolloPerson {
    id: string
    first_name: string
    last_name: string
    email: string
    title: string
    linkedin_url?: string
}

export async function searchPeopleByDomain(domain: string): Promise<ApolloPerson | null> {
    const apiKey = process.env.APOLLO_API_KEY
    if (!apiKey) {
        throw new Error("Missing APOLLO_API_KEY")
    }

    // Try finding CEO, Founder, Owner
    const jobTitles = ["CEO", "Founder", "Owner", "Director", "President", "Gerente"]

    try {
        const response = await fetch("https://api.apollo.io/v1/mixed_people/search", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "no-cache",
                "X-Api-Key": apiKey
            },
            body: JSON.stringify({
                q_organization_domains: domain,
                person_titles: jobTitles,
                page: 1,
                per_page: 3, // Get top 3
                contact_email_status: ["verified"] // Only verified emails
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error("Apollo API Error:", error)
            return null
        }

        const data = await response.json()

        if (data.people && data.people.length > 0) {
            const p = data.people[0]
            return {
                id: p.id,
                first_name: p.first_name,
                last_name: p.last_name,
                email: p.email,
                title: p.title,
                linkedin_url: p.linkedin_url
            }
        }

        return null

    } catch (error) {
        console.error("Apollo Search Failed:", error)
        return null
    }
}
