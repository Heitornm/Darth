import { PlaceHolderImages } from '@/lib/placeholder-images';

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  desc: string;
  image: string;
  hint: string;
  features: string[];
}

export const SERVICES: ServiceItem[] = [
  { 
    id: 'srv-1', 
    name: 'Corte Clássico', 
    price: 1, 
    durationMinutes: 30, 
    desc: 'O corte que nunca sai de moda. Executado com precisão cirúrgica usando tesoura e máquina, focado na estrutura do seu rosto.',
    image: PlaceHolderImages.find(img => img.id === 'srv-corte-classico')?.imageUrl || '/images/corteClassico.png',
    hint: PlaceHolderImages.find(img => img.id === 'srv-corte-classico')?.imageHint || 'classic haircut',
    features: ['Acabamento a navalha', 'Lavagem inclusa', 'Finalização com pomada']
  },
  { 
    id: 'srv-2', 
    name: 'Barba Completa', 
    price: 1, 
    durationMinutes: 30, 
    desc: 'Tratamento completo para sua barba. Inclui design personalizado, toalha quente e óleos premium para hidratação.',
    image: PlaceHolderImages.find(img => img.id === 'srv-barba-completa')?.imageUrl || '/images/barbaCompleta.png',
    hint: PlaceHolderImages.find(img => img.id === 'srv-barba-completa')?.imageHint || 'beard grooming',
    features: ['Toalha quente', 'Massagem facial', 'Alinhamento de fios']
  },
  { 
    id: 'srv-3', 
    name: 'Combo Imperial', 
    price: 1, 
    durationMinutes: 60, 
    desc: 'Nossa experiência completa. O alinhamento perfeito entre cabelo e barba para uma renovação total da sua imagem.',
    image: PlaceHolderImages.find(img => img.id === 'srv-combo-imperial')?.imageUrl || '/images/comboImperial.png',
    hint: PlaceHolderImages.find(img => img.id === 'srv-combo-imperial')?.imageHint || 'hair and beard combo',
    features: ['Corte completo', 'Barba completa', 'Cerveja cortesia']
  },
  { 
    id: 'srv-4', 
    name: 'Corte Premium', 
    price: 1, 
    durationMinutes: 45, 
    desc: 'Para quem busca exclusividade. Inclui lavagem com produtos de alta performance e técnicas avançadas de visagismo.',
    image: PlaceHolderImages.find(img => img.id === 'srv-corte-premium')?.imageUrl || '/images/cortePremium.png',
    hint: PlaceHolderImages.find(img => img.id === 'srv-corte-premium')?.imageHint || 'premium haircut',
    features: ['Visagismo facial', 'Produtos importados', 'Atendimento prioritário']
  },
];