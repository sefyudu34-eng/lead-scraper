import React, { useState } from 'react';

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
  const [error, setError] = useState('');

  const scrapLeads = async () => {
    if (!keywords.trim() || !location.trim()) {
      setError('Mots-clés et localisation requis');
      return;
    }
    setIsLoading(true);
    setError('');
    setLeads([]);

    try {
      const systemPrompt = `Tu es un expert en extraction de leads B2B depuis Google Business Profile.`;
      const userPrompt = `Extrais ${maxLeads} leads pour "${keywords}" à "${location}" (rayon ${radius} km)`;

      const response = await fetch('https://llm.blackbox.ai/chat/completions', {
        method: 'POST',
        headers: {
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

      const data = await response.json();
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Format invalide');

      const parsedLeads: Lead[] = JSON.parse(jsonMatch[0]);
      const leadsWithIds = parsedLeads.map((lead, index) => ({
        ...lead,
        id: `lead-${Date.now()}-${index}`
      }));

      setLeads(leadsWithIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '0 auto', padding: 32 }}>
      <h1>Générateur de Leads B2B</h1>
      <p>Entrez vos mots-clés et localisation pour extraire des leads depuis Google Business</p>

      <div style={{ marginBottom: 16 }}>
        <label>Mots-clés</label><br />
        <input
          style={{ width: '100%', padding: 8, fontSize: 16 }}
          placeholder="Ex: plombier"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Localisation</label><br />
        <input
          style={{ width: '100%', padding: 8, fontSize: 16 }}
          placeholder="Ex: Montpellier"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Rayon (km)</label><br />
        <input
          type="number"
          min="1"
          max="100"
          style={{ width: '100%', padding: 8, fontSize: 16 }}
          value={radius}
          onChange={(e) => setRadius(Math.min(100, Math.max(1, parseInt(e.target.value) || 10)))}
          disabled={isLoading}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label>Nombre de leads</label><br />
        <input
          type="number"
          min="1"
          max="100"
          style={{ width: '100%', padding: 8, fontSize: 16 }}
          value={maxLeads}
          onChange={(e) => setMaxLeads(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
          disabled={isLoading}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button
        onClick={scrapLeads}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: 12,
          fontSize: 16,
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        {isLoading ? 'Chargement...' : 'Lancer la recherche'}
      </button>

      {leads.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2>Résultats ({leads.length})</h2>
          {leads.map((lead) => (
            <div key={lead.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 12, borderRadius: 4 }}>
              <h3>{lead.company}</h3>
              <p><strong>Catégorie :</strong> {lead.category}</p>
              <p><strong>Téléphone :</strong> {lead.phone}</p>
              <p><strong>Email :</strong> {lead.email}</p>
              <p><strong>Adresse :</strong> {lead.address}</p>
              <p><strong>Site :</strong> <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a></p>
              <p><strong>Google Maps :</strong> <a href={lead.googleMapsUrl} target="_blank" rel="noopener noreferrer">Voir</a></p>
              <p><strong>Qualité :</strong> {lead.quality}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
