export type CountryCode = 'CO' | 'MX' | 'PE' | 'AR' | 'CL';

export interface ZoneMap {
    [city: string]: string[];
}

export const CITY_ZONES: Record<CountryCode, ZoneMap> = {
    'CO': {
        'Bogotá': [
            'Chapinero', 'Usaquén', 'Suba', 'Kennedy', 'Engativá',
            'Teusaquillo', 'Santa Fe', 'Fontibón', 'Bosa', 'Ciudad Bolívar',
            'Puente Aranda', 'Los Mártires', 'Antonio Nariño', 'Barrios Unidos',
            'Candelaria', 'San Cristóbal', 'Usme', 'Tunjuelito', 'Rafael Uribe Uribe'
        ],
        'Medellín': [
            'El Poblado', 'Laureles', 'Belén', 'Envigado', 'Sabaneta', 'Bello',
            'Itagüí', 'Robledo', 'Manrique', 'Aranjuez', 'Castilla'
        ],
        'Cali': [
            'Granada', 'El Peñón', 'San Antonio', 'Ciudad Jardín', 'Pance',
            'Versalles', 'San Fernando', 'El Limonar', 'La Flora'
        ]
    },
    'MX': {
        // ===== CDMX - 16 ALCALDÍAS =====
        'Ciudad de México': [
            // Miguel Hidalgo (Alto nivel)
            'Polanco', 'Lomas de Chapultepec', 'Bosques de las Lomas', 'Anzures',
            'Chapultepec Morales', 'Granada', 'Tacuba', 'Tacubaya', 'San Miguel Chapultepec',
            // Benito Juárez (Clase media-alta)
            'Del Valle', 'Nápoles', 'Narvarte', 'Portales', 'Álamos', 'Xoco',
            'Insurgentes Mixcoac', 'San José Insurgentes', 'Mixcoac',
            // Cuauhtémoc (Centro/Hipster)
            'Condesa', 'Roma Norte', 'Roma Sur', 'Juárez', 'Centro Histórico',
            'Doctores', 'Santa María la Ribera', 'San Rafael', 'Tabacalera', 'Guerrero',
            // Coyoacán (Bohemio)
            'Coyoacán Centro', 'Ciudad Jardín', 'Del Carmen', 'Santa Úrsula Coapa',
            'Pedregal de Carrasco', 'Copilco Universidad', 'Country Club',
            // Álvaro Obregón
            'Santa Fe', 'San Ángel', 'San Ángel Inn', 'Las Águilas', 'Florida',
            'Guadalupe Inn', 'Jardines del Pedregal', 'Altavista',
            // Tlalpan
            'Tlalpan Centro', 'Coapa', 'Pedregal de San Nicolás', 'Fuentes del Pedregal',
            'Héroes de Padierna', 'Villa Coapa', 'Isidro Fabela',
            // Iztapalapa (Popular - más PyMEs)
            'Iztapalapa Centro', 'Santa Cruz Meyehualco', 'Lomas Estrella',
            'Granjas Estrella', 'Cerro de la Estrella', 'San Miguel Teotongo',
            // Gustavo A. Madero
            'Lindavista', 'Aragón', 'Tepeyac Insurgentes', 'Guadalupe Tepeyac',
            'San Juan de Aragón', 'Martín Carrera', 'Nueva Atzacoalco',
            // Azcapotzalco
            'Azcapotzalco Centro', 'Clavería', 'Nueva Santa María', 'Industrial Vallejo',
            // Venustiano Carranza
            'Jardín Balbuena', 'Moctezuma', 'Romero Rubio', 'Morelos',
            // Xochimilco
            'Xochimilco Centro', 'Santa María Tepepan', 'San Gregorio Atlapulco',
            // Cuajimalpa
            'Santa Fe Cuajimalpa', 'Bosques de las Lomas', 'Lomas de Vista Hermosa'
        ],
        // ===== GUADALAJARA METRO =====
        'Guadalajara': [
            // Zapopan (Zona Rica)
            'Puerta de Hierro', 'Valle Real', 'Colinas de San Javier', 'Ciudad del Sol',
            'Bugambilias', 'Jardín Real', 'Arcos de Zapopan', 'Santa Margarita',
            'La Tuzania', 'El Colli Urbano', 'Chapalita', 'Providencia',
            // Guadalajara Centro
            'Centro Histórico', 'Americana', 'Ladrón de Guevara', 'Lafayette',
            'Arcos Vallarta', 'Jardines del Bosque', 'Monraz',
            // Tlaquepaque
            'Tlaquepaque Centro', 'Santa María Tequepexpan',
            // Tonalá
            'Tonalá Centro', 'Coyula'
        ],
        // ===== MONTERREY METRO =====
        'Monterrey': [
            // San Pedro Garza García (Zona más rica de México)
            'Del Valle', 'Valle Oriente', 'Carrizalejo', 'Fuentes del Valle',
            'Bosques del Valle', 'Residencial San Agustín',
            // Monterrey
            'Monterrey Centro', 'Barrio Antiguo', 'Obispado', 'Contry',
            'Cumbres', 'Mitras', 'Ladrillera', 'Anahuac', 'Roma',
            'Villa Universidad', 'Satélite', 'Las Brisas', 'La Rioja',
            'Linda Vista', 'Las Lomas',
            // San Nicolás de los Garza
            'San Nicolás Centro', 'Anáhuac', 'Universidad'
        ],
        // ===== PUEBLA =====
        'Puebla': [
            'Centro Histórico', 'La Paz', 'Huexotitla', 'Anzures', 'San Manuel',
            'Las Ánimas', 'Lomas de Angelópolis', 'Zavaleta', 'Santa Cruz Buenavista',
            'Cholula', 'San Andrés Cholula', 'La Vista Country Club'
        ],
        // ===== TIJUANA =====
        'Tijuana': [
            'Zona Centro', 'Zona Río', 'Playas de Tijuana', 'Chapultepec',
            'Hipódromo', 'Cacho', 'Del Prado', 'La Mesa', 'Otay',
            'Santa Fe', 'Natura', 'Real del Mar'
        ],
        // ===== QUERÉTARO =====
        'Querétaro': [
            'Centro Histórico', 'Juriquilla', 'El Campanario', 'Zibatá',
            'Milenio III', 'Real de Juriquilla', 'Santa Fe de Juriquilla',
            'Pedregal de Querétaro', 'El Refugio', 'Cimatario'
        ],
        // ===== MÉRIDA =====
        'Mérida': [
            'Centro Histórico', 'Altabrisa', 'Montebello', 'Montes de Amé',
            'Temozón Norte', 'García Ginerés', 'Itzimná', 'Campestre',
            'Francisco de Montejo', 'Residencial del Mayab'
        ],
        // ===== CANCÚN =====
        'Cancún': [
            'Zona Hotelera', 'Centro', 'Puerto Cancún', 'Puerto Juárez',
            'Supermanzana 3', 'Supermanzana 25', 'Alfredo V. Bonfil',
            'Residencial Campestre', 'La Isla', 'Malecón Américas'
        ],
        // ===== LEÓN =====
        'León': [
            'Centro Histórico', 'Zona Piel', 'El Coecillo', 'Jardines del Moral',
            'Campestre', 'Lomas del Campestre', 'Gran Jardín', 'Santa Fe',
            'Las Trojes', 'Cañada del Refugio'
        ],
        // ===== TOLUCA =====
        'Toluca': [
            'Centro', 'Metepec', 'La Asunción', 'Santa Ana Tlapaltitlán',
            'Pilares', 'Científicos', 'Valle Don Camilo', 'Xinantécatl'
        ]
    },
    'PE': {
        'Lima': [
            'Miraflores', 'San Isidro', 'Barranco', 'Surco', 'La Molina',
            'San Borja', 'Jesús María', 'Lince', 'Pueblo Libre', 'Magdalena'
        ]
    },
    'AR': {
        'Buenos Aires': [
            'Palermo', 'Recoleta', 'Belgrano', 'Puerto Madero', 'San Telmo',
            'Núñez', 'Caballito', 'Villa Crespo', 'Almagro', 'Colegiales'
        ]
    },
    'CL': {
        'Santiago': [
            'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa', 'La Reina',
            'Lo Barnechea', 'Santiago Centro', 'Maipú', 'La Florida', 'Peñalolén'
        ]
    }
};

/**
 * Get available zones for a city
 */
export function getZonesForCity(countryCode: string, city: string): string[] {
    // Normalize fuzzy match
    const countryZones = CITY_ZONES[countryCode as CountryCode];
    if (!countryZones) return [];

    const normalizedCity = city.trim();
    // Try exact match first
    if (countryZones[normalizedCity]) return countryZones[normalizedCity];

    // Try partial match
    const foundKey = Object.keys(countryZones).find(k =>
        k.toLowerCase().includes(normalizedCity.toLowerCase()) ||
        normalizedCity.toLowerCase().includes(k.toLowerCase())
    );

    return foundKey ? countryZones[foundKey] : [];
}
