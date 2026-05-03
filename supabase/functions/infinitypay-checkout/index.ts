const HANDLE = Deno.env.get('INFINITYPAY_HANDLE') ?? 'matheus111gustav'
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://cocarsagrado.com.br'
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { chave, tipo, valor, nome, whatsapp } = await req.json()
    const valorCentavos = Math.round(parseFloat(String(valor).replace(',', '.')) * 100)

    const body: Record<string, unknown> = {
      handle: HANDLE,
      order_nsu: chave,
      redirect_url: SITE_URL,
      ...(WEBHOOK_URL && { webhook_url: WEBHOOK_URL }),
      items: [{ quantity: 1, price: valorCentavos, description: tipo }],
    }

    if (nome) {
      body.customer = {
        name: nome,
        ...(whatsapp && { phone_number: `+55${String(whatsapp).replace(/\D/g, '')}` }),
      }
    }

    const res = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ url: data.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
