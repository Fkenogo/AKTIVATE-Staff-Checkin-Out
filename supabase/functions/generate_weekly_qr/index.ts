
// Follows Supabase Edge Function standards (Deno)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * generate_weekly_qr Edge Function
 * This function generates a signed JWT-like payload for the AKTIVATE attendance system.
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json();
    const expiry_date = body.expiry_date;
    
    if (!expiry_date) {
      throw new Error("expiry_date is required");
    }

    // Secret would be stored in Supabase Vault/Secrets
    // Deno.env.get('QR_SYSTEM_SECRET')
    const secret = "AKTIVATE_PROD_INTERNAL_SECRET_2024_SECURE_KEY";
    
    const now = new Date();
    const exp = new Date(expiry_date);
    
    // Human-readable rotation identifier
    const weekNumber = Math.ceil(now.getDate() / 7);
    const rotationId = `ROT_${now.getFullYear()}_W${weekNumber}_${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    // Construct the secure payload
    const payloadObj = {
      iss: 'AKTIVATE_AUTH_PROD',
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(exp.getTime() / 1000),
      rid: rotationId,
      loc: 'BUJ_HQ_MAIN'
    };

    const payloadBase64 = btoa(JSON.stringify(payloadObj));
    
    // HMAC-SHA256 Signing
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encoder.encode(payloadBase64)
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const signature = btoa(signatureHex).substring(0, 32);

    const qrResult = {
      id: crypto.randomUUID(),
      qr_data: `${payloadBase64}.${signature}`,
      valid_from: now.toISOString(),
      valid_until: exp.toISOString(),
      is_active: true,
      rotation_id: rotationId,
      checksum: signature
    };

    // Note: In production, the service role would insert this into the DB here
    // const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))
    // await supabase.from('qr_rotations').insert(qrResult)

    return new Response(JSON.stringify(qrResult), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})
