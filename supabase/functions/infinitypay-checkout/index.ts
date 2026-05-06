const HANDLE      = Deno.env.get('INFINITYPAY_HANDLE') ?? 'matheus111gustav'
const SITE_URL    = Deno.env.get('SITE_URL') ?? 'https://cocarsagrado.com.br'
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL') ?? ''

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })

  try {
    const { chave, tipo, valor, nome } = await req.json()
    const price = Math.round(parseFloat(String(valor).replace(',', '.')) * 100)

    const payload: Record<string, unknown> = {
      handle: HANDLE,
      items: [{
        quantity: 1,
        price,
        description: tipo,
      }],
      order_nsu: chave,
      redirect_url: SITE_URL,
      ...(WEBHOOK_URL && { webhook_url: WEBHOOK_URL }),
      ...(nome && { customer: { name: nome } }),
    }

    const res = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const url = data.url ?? data.link ?? data.checkout_url ?? data.payment_url

    return new Response(JSON.stringify({ url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
