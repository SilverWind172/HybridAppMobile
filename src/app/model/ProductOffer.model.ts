export interface ProductOffer {
  id?: number;
  code: string;
  merchant: string;
  domain: string;
  offer_title: string;
  currency: string;
  list_price: number;
  price: number;
  shipping: string;
  condition: string;
  availability: string;
  link: string;
  updated_time: number;
}
