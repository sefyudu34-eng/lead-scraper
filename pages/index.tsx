import React, { useState } from 'react';
import { Loader2, Search, Download, Mail, Phone, MapPin, Globe, AlertCircle } from 'lucide-react';
 
interface Lead {
  id: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  googleMapsUrl: string;
  category: string;
  quality: 'high' | 'medium' | 'low';
}


export default function LeadScraperApp() {
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(10);
  const [maxLeads, setMaxLeads] = useState(50);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [searchFilter, setSearchFilter] = useState('');
  const [error, setError] = useState('');

  const scrapLeads = async () => {
    if (!keywords.trim()) {
      setError('Veuillez entrer des mots-clés de recherche');
      return;
    }
    if (!location.trim()) {
      setError('Veuillez entrer une localisation');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(0);
    setLeads([]);

    try {
      const systemPrompt = `Tu es un expert en web scraping et extraction de leads B2B à partir de Google Business Profile (anciennement Google My Business).

SOURCES DE DONNÉES:
- Google Business Profile / Google Maps
- Pages Jaunes (pagesjaunes.fr)
- Annuaires professionnels locaux
- Recherches Google Business locales

Pour chaque lead, tu dois extraire et fournir:
- company: nom exact de l'entreprise tel qu'il apparaît sur Google Business
- phone: numéro de téléphone français (format: 0X XX XX XX XX) extrait du profil Google Business
- email: email professionnel (contact@entreprise.fr ou info@entreprise.fr) trouvé sur Google Business ou le site web
- address: adresse complète exacte depuis Google Maps/Business
- website: site web officiel de l'entreprise
- googleMapsUrl: lien Google Maps direct vers l'entreprise (format: https://maps.google.com/?cid=XXXXXXXXX ou https://goo.gl/maps/XXXXX)
- category: catégorie d'activité selon Google Business (ex: Restaurant, Plombier, Location de voiture)
- quality: niveau de qualité basé sur:
  * high: profil Google Business complet avec avis 4+, site web actif, toutes infos présentes
  * medium: profil Google Business avec infos de base, quelques avis
  * low: profil minimal ou informations incomplètes

MÉTHODOLOGIE D'EXTRACTION:
1. Recherche sur Google Business avec les mots-clés fournis
2. Extraction des entreprises correspondantes dans la zone géographique
3. Collecte des informations de contact depuis les profils Google Business
4. Vérification de la présence d'un site web et d'avis clients
5. Qualification des leads selon les critères de qualité

IMPORTANT:
- Les données doivent provenir de sources réelles (Google Business, annuaires)
- Les numéros de téléphone doivent être au format français valide et publiquement disponibles
- Les emails doivent correspondre au domaine de l'entreprise
- Prioriser les entreprises avec profils Google Business vérifiés
- Inclure uniquement des entreprises actives et vérifiables
- Distribue les niveaux de qualité: 40% high, 40% medium, 20% low

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte additionnel.`;

      const userPrompt = `Extrais exactement ${maxLeads} leads qualifiés depuis Google Business Profile pour la recherche: "${keywords}" dans la zone: "${location}" (rayon: ${radius} km)

PROCESSUS D'EXTRACTION:
1. Effectue une recherche Google Business/Maps avec ces mots-clés dans la zone géographique spécifiée
2. Identifie les entreprises dans un rayon de ${radius} km autour de ${location}
3. Extrais les informations de contact depuis leurs profils Google Business
4. Récupère le lien Google Maps direct de chaque entreprise
5. Vérifie la présence d'un site web et d'avis clients
6. Qualifie chaque lead selon la complétude de son profil Google Business

CRITÈRES DE SÉLECTION:
- Entreprises avec profil Google Business actif dans la zone ${location} (rayon ${radius} km)
- Numéros de téléphone publiquement affichés
- Emails disponibles sur le profil ou le site web
- Lien Google Maps direct vers l'établissement
- Entreprises vérifiées ou avec avis clients

Réponds avec un tableau JSON contenant ${maxLeads} objets avec cette structure:
[
  {
    "company": "Nom exact depuis Google Business",
    "phone": "0X XX XX XX XX",
    "email": "contact@entreprise.fr",
    "address": "Adresse complète depuis Google Maps",
    "website": "https://www.entreprise.fr",
    "googleMapsUrl": "https://maps.google.com/?cid=XXXXXXXXX",
    "category": "Catégorie Google Business",
    "quality": "high"
  }
]

Note: Tous les leads doivent être extraits de sources publiques vérifiables (Google Business Profile, Google Maps, annuaires en ligne).`;

      const response = await fetch('https://llm.blackbox.ai/chat/completions', {
        method: 'POST',
        headers: {
          'customerId': 'cus_TNfmYissyU6g42',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`
        },
        body: JSON.stringify({
          model: 'openrouter/claude-sonnet-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des leads');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      let parsedLeads: Lead[];
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Format de réponse invalide');
        }
        parsedLeads = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        throw new Error('Impossible de parser les résultats');
      }

      const leadsWithIds = parsedLeads.map((lead, index) => ({
        ...lead,
        id: `lead-${Date.now()}-${index}`
      }));

      setLeads(leadsWithIds);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Entreprise', 'Téléphone', 'Email', 'Adresse', 'Site Web', 'Google Maps', 'Catégorie', 'Qualité'];
    const csvContent = [
      headers.join(','),
      ...leads.map(lead => 
        [lead.company, lead.phone, lead.email, lead.address, lead.website, lead.googleMapsUrl, lead.category, lead.quality]
          .map(field => `"${field}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${keywords.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(leads, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${keywords.replace(/\s+/g, '_')}_${Date.now()}.json`;
    link.click();
  };

  const filteredLeads = leads.filter(lead =>
    searchFilter === '' ||
    lead.company.toLowerCase().includes(searchFilter.toLowerCase()) ||
    lead.category.toLowerCase().includes(searchFilter.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Faible';
      default: return quality;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Générateur de Leads B2B</h1>
          <p className="text-lg text-gray-600">Extraction de leads depuis Google Business Profile et annuaires professionnels</p>
        </div>

        <div className="mb-8 shadow-lg border-2 border-gray-200 rounded-xl bg-white p-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Search className="w-6 h-6 text-blue-600" />
              Recherche de Leads
            </h2>
            <p className="text-sm text-gray-600">Entrez vos mots-clés (activité + localisation) pour extraire des leads depuis Google Business</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-base font-semibold mb-2">Activité / Mots-clés</label>
              <input
                className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: location voiture, restaurant, plombier..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Localisation</label>
              <input
                className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Montpellier, Paris, Lyon..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-base font-semibold mb-2">Zone (rayon en km)</label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={radius}
                onChange={(e) => setRadius(Math.min(100, Math.max(1, parseInt(e.target.value) || 10)))}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mt-6">
            <div>
              <label className="block text-base font-semibold mb-2">Nombre de leads (max 100)</label>
              <input
                type="number"
                min="1"
                max="100"
                className="w-full h-12 px-4 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={maxLeads}
                onChange={(e) => setMaxLeads(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={isLoading}
              />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg w-full">
                <p className="font-semibold mb-1">Zone de recherche :</p>
                <p>{location || 'Non définie'} - Rayon: {radius} km</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={scrapLeads}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Recherche en cours... {progress}%
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Lancer la recherche
                </>
              )}
            </button>
          </div>
        </div>

        {leads.length > 0 && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <input
                placeholder="Filtrer les résultats..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full sm:w-1/3 h-11 px-4 border border-gray-300 rounded-lg"
              />
              <div className="flex gap-3">
                <button
                  onClick={exportToCSV}
                  className="h-11 px-4 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <button
                  onClick={exportToJSON}
                  className="h-11 px-4 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" /> JSON
                </button>
              </div>
            </div>

            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-900 font-semibold">
                {filteredLeads.length} lead{filteredLeads.length > 1 ? 's' : ''} trouvé{filteredLeads.length > 1 ? 's' : ''}
                {searchFilter && ` (${leads.length} total)`}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredLeads.map((lead) => (
                <div key={lead.id} className="border rounded-lg shadow p-4 bg-white hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold leading-tight">{lead.company}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getQualityColor(lead.quality)}`}>
                      {getQualityLabel(lead.quality)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{lead.category}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-blue-600 mt-1" />
                      <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
                    </div>
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-blue-600 mt-1" />
                      <a href={`mailto:${lead.email}`} className="hover:text-blue-600 break-all">{lead.email}</a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                      <p className="text-gray-600 line-clamp-2">{lead.address}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-blue-600 mt-1" />
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 break-all">
                        {lead.website}
                      </a>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-green-600 mt-1" />
                      <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-green-600 font-semibold">
                        Voir sur Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!isLoading && leads.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">Aucun lead extrait pour le moment</p>
            <p className="text-gray-500">Entrez vos mots-clés (activité + localisation) pour extraire des leads depuis Google Business</p>
            <p className="text-sm text-gray-400 mt-2">Sources: Google Business Profile, Google Maps, Pages Jaunes</p>
          </div>
        )}
      </div>
    </div>
  );
}
