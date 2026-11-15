// CSS khusus struk cetak, dipakai di jendela baru (window.open)
import type { CartItem } from '@/components/User/FloatingButton/FloatingButton';
import { formatKm } from '@/lib/deliveryFee';

export type OrderType = 'dine-in' | 'online';

export interface Receipt {
  id: number;
  tanggal: string;
  nama: string;
  orderType: OrderType;
  gerai: string;
  alamat: string;
  jarakKm: number | null;
  items: CartItem[];
  subtotal: number;
  ongkir: number;
  total: number;
  metodeBayar: string;
  statusBayar: string;
  catatan: string;
}

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PRINT_STYLE = `
  body{font-family:'Courier New',monospace;font-size:13px;width:300px;margin:16px auto;color:#222}
  h2{text-align:center;margin:0;letter-spacing:3px}
  .c{text-align:center}.sub{color:#555;padding-left:8px}.r{text-align:right}
  table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}
  hr{border:0;border-top:1px dashed #555;margin:10px 0}
  .tot td{font-weight:bold;font-size:15px}
`;

export function buildReceiptHtml(receipt: Receipt): string {
  const lunas = receipt.statusBayar === 'Lunas';
  const rows = receipt.items
    .map(
      (i) =>
        `<tr><td colspan="2">${esc(i.nama_makanan)}</td></tr>
         <tr><td class="sub">${i.quantity} x ${rupiah(i.harga)}</td><td class="r">${rupiah(i.harga * i.quantity)}</td></tr>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${lunas ? 'Struk' : 'Nota'} #${receipt.id}</title>
    <style>${PRINT_STYLE}</style></head><body>
    <h2>PAPEDA</h2><p class="c">Restoran Makanan Nusantara</p>
    <p class="c"><b>${lunas ? 'STRUK PEMBAYARAN' : 'NOTA PESANAN'}</b></p><hr>
    <table>
      <tr><td>No. Pesanan</td><td class="r">#${receipt.id}</td></tr>
      <tr><td>Tanggal</td><td class="r">${esc(receipt.tanggal)}</td></tr>
      <tr><td>Pelanggan</td><td class="r">${esc(receipt.nama)}</td></tr>
      <tr><td>Metode</td><td class="r">${receipt.orderType === 'dine-in' ? 'Makan di Tempat' : 'Pesan Antar'}</td></tr>
      <tr><td>Gerai</td><td class="r">${esc(receipt.gerai)}</td></tr>
    </table>
    ${
      receipt.orderType === 'online'
        ? `<p>Alamat: ${esc(receipt.alamat)}${receipt.jarakKm !== null ? ` (± ${formatKm(receipt.jarakKm)})` : ''}</p>`
        : ''
    }<hr>
    <table>${rows}</table><hr>
    <table>
      <tr><td>Subtotal</td><td class="r">${rupiah(receipt.subtotal)}</td></tr>
      ${receipt.ongkir > 0 ? `<tr><td>Ongkos Kirim</td><td class="r">${rupiah(receipt.ongkir)}</td></tr>` : ''}
      <tr class="tot"><td>TOTAL</td><td class="r">${rupiah(receipt.total)}</td></tr>
    </table><hr>
    <table>
      <tr><td>Pembayaran</td><td class="r">${esc(receipt.metodeBayar)}</td></tr>
      <tr><td>Status</td><td class="r">${esc(receipt.statusBayar)}</td></tr>
    </table><hr>
    <p class="c">${esc(receipt.catatan)}</p>
    <p class="c">*** Terima kasih ***</p>
    <script>window.onload=function(){window.print();}</script>
    </body></html>`;
}