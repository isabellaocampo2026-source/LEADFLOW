export interface BusinessLead {
    id?: string;
    source: 'google_maps';
    placeId: string;
    name: string;
    category?: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
    city?: string;
    rating?: number;
    reviewCount?: number;
    priceLevel?: string;
    mapsUrl?: string;
    scrapedAt: Date;
    contacted: boolean;
    notes?: string;
    hasWhatsapp?: boolean;
    additional_emails?: string[]; // Array of extra emails found via enrichment
}

export interface ScrapeOptions {
    query: string
    location: string
    maxResults?: number
}
