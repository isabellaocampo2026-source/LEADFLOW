import { useState, useEffect } from 'react';

const DEFAULT_WHATSAPP_MESSAGE = `Hola {{Nombre Negocio}}, soy Mauro.

Le escribo porque vi {{Nombre Negocio}} en Google Maps y nosotros nos dedicamos a entregarle prospectos reales interesados en sus servicios, de la misma forma que lo contacté a usted.

No le quiero vender nada por acá, solo quería preguntarle si le interesa saber cómo podemos traerle nuevos clientes mes a mes.`;

const STORAGE_KEY = 'global_whatsapp_template';

export function useWhatsAppTemplate() {
    const [template, setTemplate] = useState(DEFAULT_WHATSAPP_MESSAGE);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load from storage on mount
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setTemplate(stored);
        }
        setIsLoaded(true);

        // Listen for storage changes (sync across tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                setTemplate(e.newValue);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const saveTemplate = (newTemplate: string) => {
        setTemplate(newTemplate);
        localStorage.setItem(STORAGE_KEY, newTemplate);

        // Dispatch custom event for same-tab sync (since storage event only fires on other tabs)
        window.dispatchEvent(new Event('template-updated'));
    };

    // Listen for same-tab updates
    useEffect(() => {
        const handleLocalUpdate = () => {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setTemplate(stored);
            }
        };

        window.addEventListener('template-updated', handleLocalUpdate);
        return () => window.removeEventListener('template-updated', handleLocalUpdate);
    }, []);

    return {
        template,
        setTemplate: saveTemplate,
        isLoaded,
        defaults: DEFAULT_WHATSAPP_MESSAGE
    };
}
