import { BusinessLead } from "@/app/actions/reports"

interface ExportOptions {
    reportName: string
    clientName?: string
    leads: BusinessLead[]
    whatsappTemplate?: string
    onlyWithWhatsapp?: boolean
    countryPhoneCode?: string
}

function escapeHtml(str: string): string {
    if (!str) return ''
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}

/**
 * Generates a standalone HTML file with embedded styles
 * Leads are rendered as static HTML, template editor is client-side with variable buttons
 */
export function generateReportHTML(options: ExportOptions): string {
    const {
        reportName,
        clientName,
        leads,
        onlyWithWhatsapp = false,
        countryPhoneCode = "57"
    } = options

    // Filter leads if needed
    const filteredLeads = onlyWithWhatsapp
        ? leads.filter(l => (l as any).hasWhatsapp === true)
        : leads

    // Generate lead cards HTML
    const leadCardsHTML = filteredLeads.map((lead) => {
        const name = escapeHtml(lead.name || 'Sin nombre')
        const category = escapeHtml(lead.category || 'Negocio Local')
        const phone = lead.phone || ''
        const address = escapeHtml(lead.address || '')
        const city = escapeHtml(lead.city || '')
        const rating = lead.rating
        const mapsUrl = lead.mapsUrl || ''

        return `
        <div class="card" data-name="${name}" data-city="${city}" data-category="${category}" data-address="${address}" data-phone="${escapeHtml(phone)}">
            <div class="card-content">
                <div class="lead-header">
                    <div class="lead-name">${name}</div>
                    ${rating ? `<div class="rating-badge">${rating}</div>` : ''}
                </div>
                <div class="lead-body">
                    <div class="category-pill">${category}</div>
                    ${phone ? `<div class="info-row phone-row">${escapeHtml(phone)}</div>` : `<div class="info-row text-muted">Sin teléfono</div>`}
                    ${(city || address) ? `<div class="info-row">${city || address}</div>` : ''}
                </div>
            </div>
            <div class="card-footer">
                ${phone ? `<button class="btn btn-primary" onclick="sendWhatsApp(this)">WhatsApp</button>` : `<button class="btn btn-outline" disabled>Sin teléfono</button>`}
                ${mapsUrl ? `<a href="${mapsUrl}" target="_blank" class="btn btn-outline">Ver en Maps</a>` : ''}
            </div>
        </div>`
    }).join('\n')

    const emptyState = filteredLeads.length === 0
        ? `<div class="empty-state">No se encontraron leads en este reporte.</div>`
        : ''

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(reportName)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a; color: #fafafa;
            min-height: 100vh; line-height: 1.5;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
        
        .header { margin-bottom: 2rem; text-align: center; }
        .header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
        .header-meta { background: #262626; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; display: inline-block; margin-bottom: 0.5rem; }
        .text-muted { color: #737373; }

        /* Template Editor */
        .template-editor {
            background: #171717; border: 1px solid #262626;
            border-radius: 0.5rem; padding: 1.5rem; margin-bottom: 2rem;
        }
        .template-editor h3 { font-size: 1rem; margin-bottom: 0.75rem; }
        .template-editor textarea {
            width: 100%; min-height: 80px; padding: 0.75rem;
            background: #0a0a0a; color: #fafafa;
            border: 1px solid #404040; border-radius: 0.375rem;
            font-family: inherit; font-size: 0.875rem; resize: vertical;
            margin-bottom: 0.75rem;
        }
        .template-editor textarea:focus { outline: none; border-color: #737373; }
        
        .var-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .var-buttons span { font-size: 0.75rem; color: #737373; margin-right: 0.5rem; line-height: 2; }
        .var-btn {
            background: #262626; color: #fafafa; border: 1px solid #404040;
            padding: 0.375rem 0.75rem; border-radius: 0.375rem;
            font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
        }
        .var-btn:hover { background: #404040; border-color: #525252; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }

        .card {
            background: #171717; border: 1px solid #262626; border-radius: 0.5rem;
            overflow: hidden; transition: all 0.2s;
        }
        .card:hover { border-color: #404040; transform: translateY(-2px); }

        .card-content { padding: 1.25rem; }
        .lead-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .lead-name { font-size: 1.125rem; font-weight: 600; }
        .rating-badge { background: #262626; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; }

        .lead-body { display: flex; flex-direction: column; gap: 0.5rem; }
        .category-pill { background: #262626; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; width: fit-content; }
        .info-row { font-size: 0.875rem; }
        .info-row.phone-row { font-weight: 500; }

        .card-footer { padding: 1rem 1.25rem; background: #171717; border-top: 1px solid #262626; display: flex; gap: 0.75rem; }

        .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 0.375rem;
            padding: 0.5rem 1rem; border-radius: 0.375rem;
            font-size: 0.875rem; font-weight: 500; text-decoration: none;
            cursor: pointer; flex: 1; transition: all 0.2s; border: none;
        }
        .btn-primary { background: #fafafa; color: #0a0a0a; }
        .btn-primary:hover { background: #e5e5e5; }
        .btn-outline { background: transparent; border: 1px solid #404040; color: #fafafa; }
        .btn-outline:hover { background: #262626; }

        .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem; background: #171717; border-radius: 0.5rem; color: #737373; }
        .footer { margin-top: 3rem; text-align: center; padding: 1.5rem 0; border-top: 1px solid #262626; color: #737373; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${clientName ? `<div class="header-meta">Cliente: ${escapeHtml(clientName)}</div>` : ''}
            <h1>${escapeHtml(reportName)}</h1>
            <p class="text-muted">Reporte de leads</p>
        </div>

        <div class="template-editor">
            <h3>Plantilla de mensaje</h3>
            <textarea id="template" placeholder="Escribe tu mensaje aquí..."></textarea>
            <div class="var-buttons">
                <span>Insertar variable:</span>
                <button class="var-btn" onclick="insertVar('Nombre')">Nombre</button>
                <button class="var-btn" onclick="insertVar('Ciudad')">Ciudad</button>
                <button class="var-btn" onclick="insertVar('Categoría')">Categoría</button>
                <button class="var-btn" onclick="insertVar('Dirección')">Dirección</button>
            </div>
        </div>

        <div class="grid">
            ${leadCardsHTML}
            ${emptyState}
        </div>
        
        <div class="footer">
            <p>Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    </div>

    <script>
        var templateArea = document.getElementById('template');
        var countryCode = '${countryPhoneCode}';

        function insertVar(varName) {
            var start = templateArea.selectionStart;
            var end = templateArea.selectionEnd;
            var text = templateArea.value;
            var varText = '{{' + varName + '}}';
            
            templateArea.value = text.substring(0, start) + varText + text.substring(end);
            
            var newPos = start + varText.length;
            templateArea.setSelectionRange(newPos, newPos);
            templateArea.focus();
        }

        function sendWhatsApp(btn) {
            var card = btn.closest('.card');
            var data = card.dataset;

            var template = templateArea.value;
            if (!template.trim()) {
                alert('Por favor escribe un mensaje primero.');
                templateArea.focus();
                return;
            }

            var message = template
                .replace(/\{\{Nombre\}\}/g, data.name || '')
                .replace(/\{\{Ciudad\}\}/g, data.city || '')
                .replace(/\{\{Categoría\}\}/g, data.category || '')
                .replace(/\{\{Dirección\}\}/g, data.address || '');

            var phone = (data.phone || '').replace(/[^0-9]/g, '');
            if (phone && !phone.startsWith(countryCode)) {
                phone = phone.replace(/^0+/, '');
                phone = countryCode + phone;
            }

            if (phone) {
                window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank');
            }
        }
    </script>
</body>
</html>`
}
