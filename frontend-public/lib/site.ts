interface SiteConfig {
  name: string;
  phone: string;
  phoneLink: string;
  phoneFormatted: string;
  email: string;
  emailLink: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    full: string;
  }
  googleMapsLink: string;
  siteUrl: string;
}
export const siteConfig: SiteConfig = {
  name: 'Rock City Motel',
  phone: '785-392-2165',
  phoneLink: 'tel:+17853922165',
  phoneFormatted: '(785) 392-2165',
  email: 'motelrockcity@gmail.com',
  emailLink: 'mailto:motelrockcity@gmail.com',
  address: {
    street: '849 Laurel Street',
    city: 'Minneapolis',
    state: 'KS',
    zip: '67467',
    full: '849 Laurel Street, Minneapolis, KS 67467'
  },
  googleMapsLink: 'https://www.google.com/maps?q=849+Laurel+Street,+Minneapolis,+KS+67467',
  siteUrl: 'https://rockcitymotel.com'
}