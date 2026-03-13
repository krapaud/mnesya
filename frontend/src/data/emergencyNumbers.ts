/**
 * Emergency numbers by country (ISO 3166-1 alpha-2 region codes).
 *
 * @module emergencyNumbers
 */

export type ServiceCategory = 'medical' | 'police' | 'fire' | 'other';

export interface EmergencyService {
    label: string;
    labelFr: string;
    number: string;
    category: ServiceCategory;
}

export interface CountryEmergency {
    countryName: string;
    countryNameFr: string;
    services: EmergencyService[];
}

const emergencyNumbers: Record<string, CountryEmergency> = {
    FR: {
        countryName: 'France',
        countryNameFr: 'France',
        services: [
            { label: 'Medical Emergency (SAMU)', labelFr: 'Urgences médicales (SAMU)', number: '15', category: 'medical' },
            { label: 'Police', labelFr: 'Police', number: '17', category: 'police' },
            { label: 'Fire Department', labelFr: 'Pompiers', number: '18', category: 'fire' },
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
            { label: 'Deaf Emergency (SMS)', labelFr: 'Urgences malentendants (SMS)', number: '114', category: 'other' },
        ],
    },
    BE: {
        countryName: 'Belgium',
        countryNameFr: 'Belgique',
        services: [
            { label: 'Ambulance / Fire', labelFr: 'Ambulance / Pompiers', number: '100', category: 'medical' },
            { label: 'Police', labelFr: 'Police', number: '101', category: 'police' },
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
        ],
    },
    CH: {
        countryName: 'Switzerland',
        countryNameFr: 'Suisse',
        services: [
            { label: 'Police', labelFr: 'Police', number: '117', category: 'police' },
            { label: 'Fire Department', labelFr: 'Pompiers', number: '118', category: 'fire' },
            { label: 'Ambulance', labelFr: 'Ambulance', number: '144', category: 'medical' },
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
            { label: 'Toxicology Center', labelFr: 'Centre antipoison', number: '145', category: 'medical' },
        ],
    },
    LU: {
        countryName: 'Luxembourg',
        countryNameFr: 'Luxembourg',
        services: [
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
            { label: 'Police', labelFr: 'Police', number: '113', category: 'police' },
        ],
    },
    CA: {
        countryName: 'Canada',
        countryNameFr: 'Canada',
        services: [
            { label: 'Emergency Services', labelFr: 'Services d\'urgence', number: '911', category: 'other' },
        ],
    },
    US: {
        countryName: 'United States',
        countryNameFr: 'États-Unis',
        services: [
            { label: 'Emergency Services', labelFr: 'Services d\'urgence', number: '911', category: 'other' },
        ],
    },
    GB: {
        countryName: 'United Kingdom',
        countryNameFr: 'Royaume-Uni',
        services: [
            { label: 'Emergency Services', labelFr: 'Services d\'urgence', number: '999', category: 'other' },
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
        ],
    },
    DE: {
        countryName: 'Germany',
        countryNameFr: 'Allemagne',
        services: [
            { label: 'Police', labelFr: 'Police', number: '110', category: 'police' },
            { label: 'Fire / Medical', labelFr: 'Pompiers / Médical', number: '112', category: 'fire' },
        ],
    },
    ES: {
        countryName: 'Spain',
        countryNameFr: 'Espagne',
        services: [
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
            { label: 'Police', labelFr: 'Police nationale', number: '091', category: 'police' },
            { label: 'Medical Emergency', labelFr: 'Urgences médicales', number: '061', category: 'medical' },
        ],
    },
    IT: {
        countryName: 'Italy',
        countryNameFr: 'Italie',
        services: [
            { label: 'Police', labelFr: 'Police', number: '113', category: 'police' },
            { label: 'Fire Department', labelFr: 'Pompiers', number: '115', category: 'fire' },
            { label: 'Medical Emergency', labelFr: 'Urgences médicales', number: '118', category: 'medical' },
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
        ],
    },
    PT: {
        countryName: 'Portugal',
        countryNameFr: 'Portugal',
        services: [
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
        ],
    },
    NL: {
        countryName: 'Netherlands',
        countryNameFr: 'Pays-Bas',
        services: [
            { label: 'European Emergency', labelFr: 'Urgences européennes', number: '112', category: 'other' },
        ],
    },
    AU: {
        countryName: 'Australia',
        countryNameFr: 'Australie',
        services: [
            { label: 'Emergency Services', labelFr: 'Services d\'urgence', number: '000', category: 'other' },
        ],
    },
    MA: {
        countryName: 'Morocco',
        countryNameFr: 'Maroc',
        services: [
            { label: 'Police', labelFr: 'Police', number: '19', category: 'police' },
            { label: 'Fire / Ambulance', labelFr: 'Pompiers / Ambulance', number: '15', category: 'fire' },
            { label: 'Gendarmerie', labelFr: 'Gendarmerie', number: '177', category: 'police' },
        ],
    },
    DZ: {
        countryName: 'Algeria',
        countryNameFr: 'Algérie',
        services: [
            { label: 'Police', labelFr: 'Police', number: '17', category: 'police' },
            { label: 'Fire / Ambulance', labelFr: 'Pompiers / Ambulance', number: '14', category: 'fire' },
            { label: 'Gendarmerie', labelFr: 'Gendarmerie', number: '1055', category: 'police' },
        ],
    },
    TN: {
        countryName: 'Tunisia',
        countryNameFr: 'Tunisie',
        services: [
            { label: 'Police', labelFr: 'Police', number: '197', category: 'police' },
            { label: 'Fire Department', labelFr: 'Pompiers', number: '198', category: 'fire' },
            { label: 'Medical Emergency (SAMU)', labelFr: 'Urgences médicales (SAMU)', number: '190', category: 'medical' },
        ],
    },
};

/** Fallback for countries not in the list */
export const defaultEmergency: CountryEmergency = {
    countryName: 'International',
    countryNameFr: 'International',
    services: [
        { label: 'European Emergency', labelFr: 'Urgences internationales', number: '112', category: 'other' },
    ],
};

export const getEmergencyNumbers = (regionCode: string | null | undefined): CountryEmergency => {
    if (!regionCode) return defaultEmergency;
    return emergencyNumbers[regionCode.toUpperCase()] ?? defaultEmergency;
};
