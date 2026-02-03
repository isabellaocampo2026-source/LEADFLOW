
import { Contact } from "@/app/actions/contacts"

export function generateInstantlyCSV(contacts: Contact[]): string {
    // 1. Strict Headers for Instantly.ai
    const headers = [
        "Email",
        "FirstName",
        "LastName",
        "CompanyName",
        "JobTitle",
        "Website",
        "City",
        "Specialty",
        "PersonalNote"
    ]

    // 2. Generate Rows
    const rows = contacts.map(c => {
        // Escape special chars (quotes, commas, newlines)
        const safe = (val: string | undefined) => {
            if (!val) return "";
            const text = String(val).replace(/"/g, '""'); // Escape double quotes
            if (text.includes(',') || text.includes('\n') || text.includes('"')) {
                return `"${text}"`;
            }
            return text;
        }

        return [
            safe(c.email),
            safe(c.first_name),
            safe(c.last_name),
            safe(c.company_name),
            safe(c.job_title),
            safe(c.website),
            safe(c.city),
            safe(c.specialty),
            safe(c.personal_note)
        ].join(",");
    })

    // 3. Combine with BOM for UTF-8 Excel compatibility (optional but good)
    // Instantly just needs UTF-8. 
    return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
