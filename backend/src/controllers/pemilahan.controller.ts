import { Request, Response } from 'express';
import { db } from '../db';
import { jenisSampah } from '../db/schema';
import { eq } from 'drizzle-orm';

// Local keyword classifier as fallback
const categoryKeywords: Record<string, string[]> = {
  plastik: ['plastik','botol','galon','ember','tupperware','sedotan','kantong','kresek','pet','hdpe','pvc','ldpe','pp','ps','styrofoam','gelas plastik','cup','aqua','le mineral','sprite','coca cola','fanta','jerigen','toples','mangkok plastik','piring plastik','sendok plastik','pipet','kemasan','bungkus','sachet','refill','wadah','tutup botol','paralon','pipa','selang','talang','fiber','akrilik','mainan plastik','hanger','tong','polybag','mulsa','terpal','jas hujan','sandal','sepatu plastik'],
  kertas: ['kertas','kardus','karton','koran','majalah','buku','hvs','duplex','semen','amplop','nota','struk','kwitansi','brosur','flyer','pamflet','poster','kalender','undangan','tisu','tissue','tetra pak','dokumen','fotokopi','print','cetakan','arsip','map','rokok','label','stiker','box','kotak','egg tray','paper bag','tas kertas'],
  logam: ['logam','besi','aluminium','tembaga','kuningan','seng','kaleng','can','tin','kawat','paku','baut','mur','sekrup','wajan','panci','sendok','garpu','pisau','gunting','baja','stainless','rantai','kunci','gembok','engsel','alumunium foil','foil','aerosol','kaleng cat','pipa besi','plat','velg','knalpot','per','pegas','kabel','antena'],
  organik: ['organik','makanan','sisa makanan','nasi','sayur','buah','daun','rumput','ranting','kayu','bambu','jerami','kulit','biji','ampas','teh','kopi','telur','cangkang','tulang','daging','ikan','kompos','pupuk','sekam','serbuk kayu','sabut kelapa','tempurung','batok','pelepah','dedaunan','bunga','kotoran'],
  elektronik: ['elektronik','hp','handphone','smartphone','tablet','laptop','komputer','charger','adaptor','kabel data','earphone','headset','speaker','tv','televisi','monitor','remote','pcb','motherboard','ram','hardisk','ssd','flashdisk','mouse','keyboard','printer','baterai','aki','accu','power bank','lampu','led','neon','kulkas','mesin cuci','ac','kipas','blender','rice cooker','setrika','microwave','dispenser','vacuum','hair dryer','dvd','cd','kaset','radio'],
  kain: ['kain','baju','celana','rok','kaos','kemeja','jaket','denim','jeans','katun','polyester','nilon','sutra','wol','handuk','selimut','sprei','sarung','bantal','guling','sepatu','tas','dompet','topi','syal','masker kain','karpet','sajadah','gorden','tirai','taplak','lap','majun','perca','benang','kanvas'],
  lainnya: ['kaca','cermin','keramik','porselen','gerabah','tembikar','ban','karet','sol','gelang karet','mika','cat','thinner','lem','resin','epoxy','obat','jarum suntik','medis','masker medis','bola','boneka','kerang','batu','tanah']
};

const sortingTips: Record<string, string> = {
  plastik: '🔹 Bersihkan dari sisa makanan, lepas label/stiker, pisahkan tutup botol. Plastik bening (PET) harganya lebih tinggi.',
  kertas: '🔹 Pastikan kering dan tidak berminyak. Kardus dilipat rata. Kertas basah/berminyak masuk organik.',
  logam: '🔹 Pisahkan berdasarkan jenis (besi, aluminium, tembaga). Tembaga paling mahal. Bersihkan dari karat berlebih.',
  organik: '🔹 Bisa diolah menjadi kompos. Pisahkan dari plastik dan kertas. Potong kecil untuk proses lebih cepat.',
  elektronik: '🔹 Jangan dibongkar sembarangan. Lepas baterai terlebih dahulu. Komponen PCB mengandung logam berharga.',
  kain: '🔹 Pisahkan yang masih layak pakai untuk donasi. Kain rusak bisa dijual untuk bahan majun/lap industri.',
  lainnya: '🔹 Sampah berbahaya (B3) seperti baterai, cat, obat harus dikumpulkan terpisah dan ditangani khusus.'
};

function localClassify(input: string): { kategori: string; tip: string; confidence: string } {
  const lower = input.toLowerCase();
  let matchedCategory = 'lainnya';
  let matchScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword) || keyword.includes(lower)) {
        const score = keyword === lower ? 100 : (keyword.includes(lower) ? 70 : 50);
        if (score > matchScore) {
          matchScore = score;
          matchedCategory = category;
        }
      }
    }
  }

  return {
    kategori: matchedCategory,
    tip: sortingTips[matchedCategory] || sortingTips.lainnya,
    confidence: matchScore >= 100 ? 'Tinggi' : matchScore >= 70 ? 'Sedang' : 'Rendah'
  };
}

async function callOpenRouter(input: string): Promise<{ kategori: string; tip: string; confidence: string } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const prompt = `Anda adalah "Brain", asisten AI cerdas dari platform SiBankSampah.
Seorang nasabah memasukkan jenis sampah: "${input}".

Tugas:
1. Klasifikasikan ke SATU dari 7 kategori: organik, plastik, kertas, logam, elektronik, kain, lainnya.
2. Berikan tip analisis edukatif 2-3 kalimat tentang cara memilah atau nilai ekonomis sampah ini.
3. Tentukan akurasi: Tinggi, Sedang, atau Rendah.

Jawab HANYA JSON murni tanpa markdown:
{"kategori":"...","tip":"...","confidence":"..."}`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'SiBankSampah',
    },
    body: JSON.stringify({
      model: 'google/gemma-3-4b-it:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.log(`[AI] OpenRouter error ${response.status}: ${errText}`);
    return null;
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
  return JSON.parse(cleaned);
}

export const classifyWaste = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Masukkan nama/deskripsi sampah minimal 2 karakter.' });
    }

    const input = query.trim();
    let aiData: { kategori: string; tip: string; confidence: string } | null = null;
    let usedAI = false;

    // Try OpenRouter AI
    try {
      aiData = await callOpenRouter(input);
      if (aiData) {
        usedAI = true;
        console.log(`[AI] OpenRouter berhasil menganalisa: "${input}" → ${aiData.kategori}`);
      }
    } catch (err: any) {
      console.log(`[AI] OpenRouter gagal: ${err.message}`);
    }

    // Fallback to local classifier
    if (!aiData) {
      console.log(`[AI] Menggunakan klasifikasi lokal untuk: "${input}"`);
      aiData = localClassify(input);
    }

    // Validate category
    aiData.kategori = aiData.kategori ? aiData.kategori.toLowerCase() : 'lainnya';
    const validCategories = ['organik', 'plastik', 'kertas', 'logam', 'elektronik', 'kain', 'lainnya'];
    if (!validCategories.includes(aiData.kategori)) {
      aiData.kategori = 'lainnya';
    }

    // Match with database
    const allJenis = await db.select().from(jenisSampah).where(eq(jenisSampah.aktif, true));
    const dbMatches = allJenis.filter(j => {
      const nama = j.nama.toLowerCase();
      const lowerInput = input.toLowerCase();
      return nama.includes(lowerInput) || lowerInput.includes(nama) || j.kategori === aiData!.kategori;
    });

    dbMatches.sort((a, b) => {
      const aMatch = a.nama.toLowerCase().includes(input.toLowerCase()) ? 1 : 0;
      const bMatch = b.nama.toLowerCase().includes(input.toLowerCase()) ? 1 : 0;
      return bMatch - aMatch;
    });

    return res.json({
      success: true,
      data: {
        input,
        kategori: aiData.kategori,
        confidence: aiData.confidence || 'Sedang',
        tip: aiData.tip,
        usedAI,
        jenisSampahCocok: dbMatches.slice(0, 5).map(j => ({
          id: j.id,
          nama: j.nama,
          kategori: j.kategori,
          hargaPerKg: j.hargaPerKg,
          satuan: j.satuan,
          deskripsi: j.deskripsi,
        })),
      }
    });

  } catch (error: any) {
    console.error('Classification Error:', error);
    return res.status(500).json({ success: false, message: 'Gagal menganalisa. Coba lagi.' });
  }
};
