'use client'

import { useState } from 'react'
import { Plus, Trash2, DollarSign, Sparkles, RefreshCw, Download, Copy, Check } from 'lucide-react'
import FollowUpChat from './sa-follow-up-chat'

interface LineItem { id: string; product: string; description: string; quantity: number; unitPrice: number; total: number }

const SNAPPR_PRODUCTS = [
  { name: 'Starter — Per Shoot', price: 299, desc: 'Single on-demand photo shoot, 1 photographer, edited photos in 24-48hrs' },
  { name: 'Starter — Real Estate', price: 149, desc: 'Property photography package, 25 edited photos, virtual staging available' },
  { name: 'Starter — Headshots', price: 199, desc: 'Professional headshots, 3-5 retouched photos, 30min session' },
  { name: 'Starter — Events', price: 399, desc: 'Event photography, 2-4hr coverage, gallery delivered next day' },
  { name: 'Business — Monthly Retainer', price: 2500, desc: 'Up to 10 shoots/month, dedicated account manager, priority booking' },
  { name: 'Business — Quarterly Package', price: 6500, desc: '30 shoots/quarter, brand consistency guidelines, bulk editing' },
  { name: 'Enterprise — Annual Contract', price: 0, desc: 'Custom pricing: unlimited shoots, global coverage, SLA guarantees, API integration' },
  { name: 'Enterprise — Platform Integration', price: 0, desc: 'API access, custom workflow integration, white-label options' },
  { name: 'Add-on: Video', price: 500, desc: 'Short-form video content, 30-60sec clips, social-ready formats' },
  { name: 'Add-on: Virtual Staging', price: 75, desc: 'Per-image virtual staging for real estate listings' },
  { name: 'Add-on: Rush Delivery', price: 150, desc: 'Same-day or next-day photo delivery' },
]

interface Props { dealName: string | null }

export default function SaPricebookBuilder({ dealName }: Props) {
  const [items, setItems] = useState<LineItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [quoteNotes, setQuoteNotes] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const addProduct = (product: typeof SNAPPR_PRODUCTS[0]) => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      product: product.name,
      description: product.desc,
      quantity: 1,
      unitPrice: product.price,
      total: product.price,
    }])
  }

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.total = updated.quantity * updated.unitPrice
      }
      return updated
    }))
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const subtotal = items.reduce((s, i) => s + i.total, 0)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal - discountAmount

  const generateQuote = async () => {
    if (items.length === 0) return
    setLoading(true)
    try {
      const r = await fetch('/api/sa-pricebook-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItems: items, dealName, discountPct: discount }),
      })
      const text = await r.text()
      let d: any
      try { d = JSON.parse(text) } catch { setQuoteNotes('Request timed out. Try again.'); return }
      setQuoteNotes(d.summary || d.notes?.join('\n') || 'Quote generated.')
    } catch { setQuoteNotes('Failed to generate AI quote summary.') }
    finally { setLoading(false) }
  }

  const copyQuote = () => {
    const lines = items.map(i => `${i.product} x${i.quantity} @ $${i.unitPrice.toLocaleString()} = $${i.total.toLocaleString()}`)
    const text = [`Quote for: ${dealName || 'Prospect'}`, '', ...lines, '', `Subtotal: $${subtotal.toLocaleString()}`,
      discount > 0 ? `Discount: ${discount}% (-$${discountAmount.toLocaleString()})` : '',
      `Total: $${total.toLocaleString()}`, '', quoteNotes || ''].filter(Boolean).join('\n')
    navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Pricebook & Quote Builder</h2>
        <p className="text-sm text-slate-400">Build a pricing proposal from Snappr&apos;s service tiers.</p>
      </div>

      {/* Product catalog */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Add Products</h3>
        <div className="grid grid-cols-2 gap-2">
          {SNAPPR_PRODUCTS.map((p, i) => (
            <button key={i} onClick={() => addProduct(p)} className="p-3 rounded-lg bg-white/[0.03] border border-white/10 text-left hover:border-[#FF5C00]/30 hover:bg-[#FF5C00]/5 transition-all group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white group-hover:text-[#FF5C00] transition-colors">{p.name}</span>
                <span className="text-xs font-mono text-emerald-400">{p.price > 0 ? `$${p.price}` : 'Custom'}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Line items */}
      {items.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Quote Line Items</h3>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-white/5">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Product</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium w-20">Qty</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium w-28">Unit Price</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium w-28">Total</th>
                <th className="w-12"></th>
              </tr></thead>
              <tbody className="divide-y divide-white/5">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{item.product}</div>
                      <div className="text-[10px] text-slate-500">{item.description}</div>
                    </td>
                    <td className="px-4 py-3"><input type="number" value={item.quantity} min={1} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)} className="w-16 text-center px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none" /></td>
                    <td className="px-4 py-3"><input type="number" value={item.unitPrice} min={0} onChange={e => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)} className="w-24 text-right px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none" /></td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-mono">${item.total.toLocaleString()}</td>
                    <td className="px-2 py-3"><button onClick={() => removeItem(item.id)} className="p-1 text-slate-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4">
              <label className="text-xs text-slate-400">Discount %</label>
              <input type="number" value={discount} min={0} max={100} onChange={e => setDiscount(parseInt(e.target.value) || 0)} className="w-16 text-center px-2 py-1 rounded bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
            </div>
            <div className="text-right">
              {discount > 0 && <div className="text-xs text-slate-500">Subtotal: ${subtotal.toLocaleString()} — Discount: -${discountAmount.toLocaleString()}</div>}
              <div className="text-lg font-bold text-emerald-400">${total.toLocaleString()}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={generateQuote} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5C00] text-white font-medium text-sm hover:bg-[#e04f00] disabled:opacity-50">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> AI Quote Summary</>}
            </button>
            <button onClick={copyQuote} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm hover:bg-white/10">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Quote</>}
            </button>
          </div>

          {quoteNotes && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <h4 className="text-xs font-semibold text-[#FF5C00] uppercase tracking-wider mb-2">AI Quote Summary</h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{quoteNotes}</p>
            </div>
          )}

          <FollowUpChat context={JSON.stringify({ items, discount, total, quoteNotes })} tool="pricebook" dealName={dealName} />
        </div>
      )}
    </div>
  )
}
