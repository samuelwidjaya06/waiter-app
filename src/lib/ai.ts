import type { FavoriteItem, MenuItem, AIRecommendation } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function generateRecommendation(
  customerName: string,
  favorites: FavoriteItem[],
  availableMenu: MenuItem[]
): Promise<AIRecommendation> {
  if (favorites.length === 0) {
    return {
      primary: 'Belum ada riwayat',
      reasoning: 'Pelanggan baru, tawarkan signature menu.',
      alternatives: availableMenu.slice(0, 3).map(m => m.name),
    };
  }

  const topFavorite = favorites[0].item_name;
  const menuList = availableMenu
    .filter(m => m.name !== topFavorite)
    .map(m => `- ${m.name} (${m.category}${m.flavor_profile ? `, ${m.flavor_profile}` : ''})`)
    .join('\n');

  const prompt = `Anda adalah sommelier ahli minuman beralkohol untuk bar di Indonesia.

PELANGGAN: ${customerName}
MINUMAN FAVORIT: ${topFavorite}
RIWAYAT PESANAN: ${favorites.slice(0, 3).map(f => `${f.item_name} (${f.order_count}x)`).join(', ')}

MENU TERSEDIA:
${menuList}

Berikan 1 rekomendasi utama + 2 alternatif dari menu di atas yang profil rasanya MIRIP dengan ${topFavorite}.

Output dalam format JSON murni (tanpa markdown, tanpa code fence):
{
  "primary": "nama minuman",
  "reasoning": "alasan singkat 1-2 kalimat dalam bahasa Indonesia, fokus ke profil rasa",
  "alternatives": ["nama1", "nama2"]
}`;

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content.trim();

    // Strip potential markdown code fences
    const clean = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(clean);

    return {
      primary: parsed.primary || availableMenu[0].name,
      reasoning: parsed.reasoning || 'Profil rasa serupa.',
      alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.slice(0, 2) : [],
    };
  } catch (err) {
    console.error('AI recommendation failed:', err);
    // Fallback: rekomen dari kategori yang sama
    const fallback = availableMenu.filter(m => m.name !== topFavorite).slice(0, 3);
    return {
      primary: fallback[0]?.name || 'Tanyakan ke bartender',
      reasoning: 'Rekomendasi berdasarkan kategori serupa (AI sedang offline).',
      alternatives: fallback.slice(1, 3).map(m => m.name),
    };
  }
}
