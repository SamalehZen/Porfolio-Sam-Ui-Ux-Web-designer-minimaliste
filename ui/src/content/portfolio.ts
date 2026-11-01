import {
  logoStudio,
  logoFahlo,
  logoMatterDark,
  logoMatterBlue,
  logoContact,
  logoFueled,
  logoImmi,
  logoSakara,
  logoWebex,
  shotFahloLeft,
  shotFahloMiddle,
  shotFahloRight,
  shotMatterLeft,
  shotMatterMiddle,
  shotMatterRight,
  shotContactLeft,
  shotContactMiddle,
  shotContactRight,
  shotWebexLeft,
  shotWebexMiddle,
  shotWebexRight,
  shotSakaraLeft,
  shotSakaraMiddle,
  shotSakaraRight,
  shotImmiLeft,
  shotImmiMiddle,
  shotImmiRight,
  mem1,
  mem2,
  mem3,
  mem4,
  mem5,
} from '@/assets'

export type Logo = { src: string; name?: string }
export type Study = { title: string; desc: string; shots: string[] }

export type Entry = {
  year: string
  route: string
  logos: Logo[]
  company: string
  current?: boolean
  role: string
  desc: string
  cases: Study[]
}

export const TIMELINE: Entry[] = [
  {
    year: '2025',
    route: 'NYC>JIB',
    logos: [{ src: logoStudio }, { src: logoFahlo, name: 'Fahlo' }],
    company: 'Studio',
    current: true,
    role: 'Designer produit principal',
    desc: 'Agence produit basée à New York. J’ai piloté plusieurs missions de produit et de branding de bout en bout, sur mobile et web, livrées à des millions d’utilisateurs.',
    cases: [
      {
        title: 'Fahlo™',
        desc: 'Des produits de suivi animal qui soutiennent la conservation dans le monde entier',
        shots: [shotFahloLeft, shotFahloMiddle, shotFahloRight],
      },
    ],
  },
  {
    year: '2024',
    route: 'DEN>JIB',
    logos: [
      { src: logoMatterDark, name: 'Matter' },
      { src: logoMatterBlue, name: 'Matter app' },
    ],
    company: 'Matter Neuroscience',
    role: 'Designer produit senior',
    desc: 'Start-up de biotechnologie du Colorado qui investit dans la longévité via les neurosciences. J’ai joué un rôle clé dans la construction du langage visuel et de l’expérience 0-1.',
    cases: [
      {
        title: 'Matter',
        desc: 'Suivre l’activité des neurotransmetteurs grâce à un biomarqueur du bonheur',
        shots: [shotMatterLeft, shotMatterMiddle, shotMatterRight],
      },
    ],
  },
  {
    year: '2022',
    route: 'JIB',
    logos: [{ src: logoContact }],
    company: 'Contact',
    role: 'Designer produit senior',
    desc: 'Start-up marketplace londonienne. J’ai dirigé le design et un rebranding ambitieux pour un virage stratégique dans un secteur créatif en pleine mutation.',
    cases: [
      {
        title: 'Contact',
        desc: 'Une plateforme SaaS B2B pour réserver, gérer et payer les talents créatifs',
        shots: [shotContactLeft, shotContactMiddle, shotContactRight],
      },
    ],
  },
  {
    year: '2019',
    route: 'JIB',
    logos: [
      { src: logoFueled },
      { src: logoImmi, name: 'Immi' },
      { src: logoSakara, name: 'Sakara' },
      { src: logoWebex, name: 'Webex' },
    ],
    company: 'Fueled',
    role: 'Designer produit',
    desc: 'Agence digitale new-yorkaise pour start-ups et grands comptes. J’y ai fait mes armes, affiné mon savoir-faire et livré mes premiers produits.',
    cases: [
      {
        title: 'Webex for iPad',
        desc: 'Unifier des logiciels vieillissants en une expérience native fluide',
        shots: [shotWebexLeft, shotWebexMiddle, shotWebexRight],
      },
      {
        title: 'Sakara',
        desc: 'Un modèle de gestion d’abonnements repas haut de gamme',
        shots: [shotSakaraLeft, shotSakaraMiddle, shotSakaraRight],
      },
      {
        title: 'Immi',
        desc: 'Un studio d’animation en réalité augmentée, familial, dans la poche',
        shots: [shotImmiLeft, shotImmiMiddle, shotImmiRight],
      },
    ],
  },
]

export const MEMORIES = [
  { src: mem1, caption: 'Chez moi' },
  { src: mem2, caption: 'Mon refuge' },
  { src: mem3, caption: 'Le Japon me manque' },
  { src: mem4, caption: 'NYC, je t’aime' },
  { src: mem5, caption: 'Rockstar en herbe' },
]

export const CONTACT_MAILTO =
  'mailto:hello@mikes.cv?subject=' + encodeURIComponent('So, about your portfolio...')
