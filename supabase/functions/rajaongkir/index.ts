import { handleCors, json, jsonError } from '../_shared/http.ts'

// @ts-ignore
const RAJAONGKIR_API_KEY = Deno.env.get('RAJAONGKIR_API_KEY')
const BASE_URL = 'https://rajaongkir.komerce.id/api/v1/destination'

// @ts-ignore
Deno.serve(async (req: Request) => {
  // 1. Handle CORS preflight
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (!RAJAONGKIR_API_KEY) {
    console.error('RAJAONGKIR_API_KEY is not set')
    return jsonError(req, 500, 'Missing RAJAONGKIR_API_KEY configuration')
  }

  try {
    const headers = {
      'key': RAJAONGKIR_API_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    }

    // Default Supabase invoke uses POST, so we parse the body
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch (e) {
        body = {};
      }
    }

    const action = body.action;

    // ─── AMBIL DAFTAR PROVINSI ───
    if (action === 'provinces') {
      const response = await fetch(`${BASE_URL}/province`, { method: 'GET', headers })
      const data = await response.json()
      return json(req, data)
    }

    // ─── AMBIL DAFTAR KOTA/KABUPATEN ───
    if (action === 'cities') {
      const provinceId = body.province_id
      const targetUrl = provinceId ? `${BASE_URL}/city/${provinceId}` : `${BASE_URL}/city`
      
      const response = await fetch(targetUrl, { method: 'GET', headers })
      const data = await response.json()
      return json(req, data)
    }

    // ─── CEK ONGKOS KIRIM ───
    if (action === 'cost') {
      const formParams = new URLSearchParams()
      if (body.origin) formParams.append('origin', body.origin)
      if (body.destination) formParams.append('destination', body.destination)
      if (body.weight) formParams.append('weight', body.weight.toString())
      if (body.courier) formParams.append('courier', body.courier)

      const response = await fetch('https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost', {
        method: 'POST',
        headers,
        body: formParams.toString()
      })
      
      const data = await response.json()
      return json(req, data)
    }

    return jsonError(req, 400, 'Action tidak valid atau tidak ditemukan')

  } catch (error) {
    console.error('RajaOngkir Proxy Error:', error)
    return jsonError(req, 500, `Internal Server Error: ${(error as Error).message}`)
  }
})
