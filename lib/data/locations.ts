export const BUSINESS_CATEGORIES = [
    // Marketing & Tech
    "Agencias de Marketing Digital",
    "Agencias de Publicidad",
    "Estudios de Diseño Gráfico",
    "Empresas de Desarrollo de Software",
    "Consultoras IT",
    "Agencias SEO",
    "Community Managers",
    "Diseñadores Web",
    "Productoras Audiovisuales",
    "Fotógrafos Profesionales",

    // Salud & Bienestar
    "Dentistas",
    "Clínicas Dentales",
    "Médicos Generales",
    "Pediatras",
    "Dermatólogos",
    "Ginecólogos",
    "Cardiólogos",
    "Psicólogos",
    "Fisioterapeutas",
    "Quiroprácticos",
    "Nutricionistas",
    "Veterinarias",
    "Clínicas Veterinarias",
    "Gimnasios",
    "Centros de Yoga",
    "Entrenadores Personales",
    "Spas",
    "Salones de Belleza",
    "Barberías",
    "Peluquerías",
    "Centros de Estética",
    "Farmacias",

    // Inmobiliaria & Construcción
    "Inmobiliarias",
    "Agentes Inmobiliarios",
    "Constructoras",
    "Arquitectos",
    "Diseñadores de Interiores",
    "Tiendas de Muebles",
    "Ferreterías",
    "Plomeros",
    "Electricistas",
    "Pintores",
    "Carpinteros",
    "Cerrajeros",
    "Jardineros",
    "Empresas de Limpieza",
    "Proveedores de Materiales de Construcción",

    // Gastronomía & Turismo
    "Restaurantes",
    "Restaurantes Italianos",
    "Restaurantes Mexicanos",
    "Restaurantes Asiáticos",
    "Restaurantes de Comida Rápida",
    "Pizzerías",
    "Sushi Bars",
    "Hamburgueserías",
    "Cafeterías",
    "Panaderías",
    "Pastelerías",
    "Heladerías",
    "Bares",
    "Discotecas",
    "Hoteles",
    "Hostales",
    "Agencias de Viajes",
    "Empresas de Catering",

    // Servicios Profesionales
    "Abogados",
    "Contadores",
    "Notarías",
    "Consultoras de Recursos Humanos",
    "Escuelas de Idiomas",
    "Academias de Música",
    "Guarderías",
    "Colegios Privados",
    "Universidades",
    "Autoescuelas",
    "Funerarias",
    "Detectives Privados",
    "Agencias de Seguros",

    // Automotriz
    "Talleres Mecánicos",
    "Concesionarios de Autos",
    "Lavaderos de Carros",
    "Tiendas de Repuestos Automotrices",
    "Alquiler de Vehículos",

    // Comercio
    "Tiendas de Ropa",
    "Zapaterías",
    "Joyerías",
    "Tiendas de Electrónica",
    "Librerías",
    "Floristerías",
    "Tiendas de Mascotas",
    "Supermercados",
    "Tiendas de Conveniencia",
    "Vape Shops",
    "Tiendas de Juguetes",
    "Tiendas de Regalos"
].sort();


export interface City {
    name: string;
    slug: string;
    postalCodes?: string[]; // Deep Search Roulettes
    coordinates?: {
        lat: number;
        lng: number;
    }
}

export interface Country {
    name: string;
    code: string;
    phoneCode: string; // International dialing code (e.g., "57" for Colombia)
    cities: City[];
}

export const LOCATIONS: Country[] = [
    {
        name: "Colombia",
        code: "CO",
        phoneCode: "57",
        cities: [
            {
                name: "Bogotá",
                slug: "bogota",
                coordinates: { lat: 4.7110, lng: -74.0721 }, // Bogotá Center
                postalCodes: [
                    "110111", "110121", "110131", "110141", "110151", // Usaquén
                    "110211", "110221", "110231", // Chapinero
                    "110311", "110321", // Santa Fe
                    "110411", // San Cristóbal
                    "110511", "110521", // Usme
                    "110611", "110621", // Tunjuelito
                    "110711", "110721", "110731", // Bosa
                    "110811", "110821", "110831", // Kennedy
                    "110911", "110921", "110931", // Fontibón
                    "111011", "111021", "111031", "111041", "111051", "111061", // Engativá
                    "111111", "111121", "111131", "111141", "111151", "111161", "111171", // Suba
                    "111211", "111221", // Barrios Unidos
                    "111311", "111321", // Teusaquillo
                    "111411", // Los Mártires
                    "111511", // Antonio Nariño
                    "111611", // Puente Aranda
                    "111711", "111721", "111731", // La Candelaria / Cdad Bolívar
                ]
            },
            {
                name: "Medellín",
                slug: "medellin",
                coordinates: { lat: 6.2442, lng: -75.5812 }, // Medellín Center
                postalCodes: ["050001", "050002", "050003", "050004", "050005", "050006", "050011", "050021", "050022", "050030"]
            },
            { name: "Cali", slug: "cali", coordinates: { lat: 3.4516, lng: -76.5320 } },
            { name: "Barranquilla", slug: "barranquilla", coordinates: { lat: 10.9685, lng: -74.7813 } },
            { name: "Cartagena", slug: "cartagena", coordinates: { lat: 10.3910, lng: -75.4794 } },
            { name: "Bucaramanga", slug: "bucaramanga", coordinates: { lat: 7.1254, lng: -73.1198 } },
            { name: "Pereira", slug: "pereira", coordinates: { lat: 4.8133, lng: -75.6961 } },
            { name: "Manizales", slug: "manizales", coordinates: { lat: 5.0689, lng: -75.5174 } },
            { name: "Cúcuta", slug: "cucuta", coordinates: { lat: 7.8939, lng: -72.5078 } },
            { name: "Ibagué", slug: "ibague", coordinates: { lat: 4.4389, lng: -75.2322 } },
            { name: "Santa Marta", slug: "santa-marta", coordinates: { lat: 11.2408, lng: -74.1990 } }
        ]
    },
    {
        name: "México",
        code: "MX",
        phoneCode: "52",
        cities: [
            {
                name: "Ciudad de México",
                slug: "cdmx",
                coordinates: { lat: 19.4326, lng: -99.1332 },
                postalCodes: [
                    'Polanco', 'Lomas de Chapultepec', 'Bosques de las Lomas', 'Anzures',
                    'Del Valle', 'Nápoles', 'Narvarte', 'Portales', 'Álamos',
                    'Condesa', 'Roma Norte', 'Roma Sur', 'Juárez', 'Centro Histórico',
                    'Coyoacán Centro', 'San Ángel', 'Santa Fe', 'Tlalpan Centro',
                    'Coapa', 'Lindavista', 'Aragón', 'Clavería', 'Satélite'
                ]
            },
            {
                name: "Guadalajara",
                slug: "guadalajara",
                coordinates: { lat: 20.6597, lng: -103.3496 },
                postalCodes: [
                    'Puerta de Hierro', 'Valle Real', 'Colinas de San Javier', 'Ciudad del Sol',
                    'Bugambilias', 'Chapalita', 'Providencia', 'Centro Histórico', 'Americana'
                ]
            },
            {
                name: "Monterrey",
                slug: "monterrey",
                coordinates: { lat: 25.6866, lng: -100.3161 },
                postalCodes: [
                    'Del Valle', 'Valle Oriente', 'Carrizalejo', 'Monterrey Centro',
                    'Obispado', 'Contry', 'Cumbres', 'Mitras', 'Linda Vista'
                ]
            },
            {
                name: "Puebla",
                slug: "puebla",
                coordinates: { lat: 19.0414, lng: -98.2063 },
                postalCodes: ['Angelópolis', 'La Paz', 'Huexotitla', 'Zavaleta', 'Cholula', 'Centro Histórico']
            },
            {
                name: "Tijuana",
                slug: "tijuana",
                coordinates: { lat: 32.5149, lng: -117.0382 },
                postalCodes: ['Zona Río', 'Zona Centro', 'Playas de Tijuana', 'Chapultepec', 'Hipódromo']
            },
            {
                name: "Querétaro",
                slug: "queretaro",
                coordinates: { lat: 20.5888, lng: -100.3899 },
                postalCodes: ['Juriquilla', 'El Campanario', 'Zibatá', 'Centro Histórico']
            }
        ]
    },
    {
        name: "España",
        code: "ES",
        phoneCode: "34",
        cities: [
            {
                name: "Madrid",
                slug: "madrid",
                coordinates: { lat: 40.4168, lng: -3.7038 },
                postalCodes: [
                    "28001", "28002", "28003", "28004", "28005", "28006", "28007", "28008", "28009", "28010",
                    "28011", "28012", "28013", "28014", "28015", "28016", "28017", "28018", "28019", "28020",
                    "28021", "28022", "28023", "28024", "28025", "28026", "28027", "28028", "28029", "28030",
                    "28031", "28032", "28033", "28034", "28035", "28036", "28037", "28038", "28039", "28040",
                    "28041", "28042", "28043", "28044", "28045", "28046", "28047", "28048", "28049", "28050",
                    "28051", "28052", "28053", "28054", "28055"
                ]
            },
            { name: "Barcelona", slug: "barcelona", coordinates: { lat: 41.3851, lng: 2.1734 } },
            { name: "Valencia", slug: "valencia", coordinates: { lat: 39.4699, lng: -0.3763 } },
            { name: "Sevilla", slug: "sevilla", coordinates: { lat: 37.3891, lng: -5.9845 } }
        ]
    },
    {
        name: "Argentina",
        code: "AR",
        phoneCode: "54",
        cities: [
            { name: "Buenos Aires", slug: "buenos-aires", coordinates: { lat: -34.6037, lng: -58.3816 } },
            { name: "Córdoba", slug: "cordoba", coordinates: { lat: -31.4201, lng: -64.1888 } },
            { name: "Rosario", slug: "rosario", coordinates: { lat: -32.9442, lng: -60.6505 } }
        ]
    },
    {
        name: "Chile",
        code: "CL",
        phoneCode: "56",
        cities: [
            { name: "Santiago", slug: "santiago", coordinates: { lat: -33.4489, lng: -70.6693 } },
            { name: "Valparaíso", slug: "valparaiso", coordinates: { lat: -33.0472, lng: -71.6127 } },
            { name: "Concepción", slug: "concepcion", coordinates: { lat: -36.8201, lng: -73.0444 } }
        ]
    },
    {
        name: "Perú",
        code: "PE",
        phoneCode: "51",
        cities: [
            { name: "Lima", slug: "lima", coordinates: { lat: -12.0464, lng: -77.0428 } },
            { name: "Arequipa", slug: "arequipa", coordinates: { lat: -16.4090, lng: -71.5375 } },
            { name: "Trujillo", slug: "trujillo", coordinates: { lat: -8.1160, lng: -79.0300 } },
            { name: "Cusco", slug: "cusco", coordinates: { lat: -13.5320, lng: -71.9675 } }
        ]
    },
    {
        name: "Estados Unidos",
        code: "US",
        phoneCode: "1",
        cities: [
            { name: "New York", slug: "new-york", coordinates: { lat: 40.7128, lng: -74.0060 } },
            { name: "Los Angeles", slug: "los-angeles", coordinates: { lat: 34.0522, lng: -118.2437 } },
            { name: "Miami", slug: "miami", coordinates: { lat: 25.7617, lng: -80.1918 } },
            { name: "Chicago", slug: "chicago", coordinates: { lat: 41.8781, lng: -87.6298 } }
        ]
    }
];
