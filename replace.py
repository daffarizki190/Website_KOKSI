import re

file_path = 'src/pages/DashboardAdmin.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { smartCategorize } from '../data/smartCategorizer';",
    "import { smartCategorize } from '../data/smartCategorizer';\nimport { useBarcodeScanner } from '../hooks/useBarcodeScanner';\nimport Barcode from 'react-barcode';"
)

# 2. State & Hook
state_hook = '''  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [scannerMode, setScannerMode] = useState<'detail' | 'proses' | 'siap' | 'selesai'>('detail');
  
  useBarcodeScanner({
    onScan: (barcode) => {
      const orderId = parseInt(barcode, 10);
      if (isNaN(orderId)) return;
      
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        toast.error(Pesanan ID  tidak ditemukan!, "Scanner Barcode");
        return;
      }

      if (scannerMode === 'detail') {
        setSelectedOrderForStatus(order);
        setNewStatusValue(order.status || 'Menunggu Konfirmasi');
        setNewKeteranganValue(order.keterangan || '');
      } else {
        let targetStatus = '';
        if (scannerMode === 'proses') targetStatus = 'Sedang Disiapkan';
        if (scannerMode === 'siap') targetStatus = 'Siap Diambil';
        if (scannerMode === 'selesai') targetStatus = 'Selesai';
        
        handleUpdateStatusScanner(order.id, targetStatus);
      }
    }
  });

  const handleUpdateStatusScanner = async (orderId: number, status: string) => {
    try {
      const res = await fetch(/api/orders//status, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: Bearer  },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Gagal update status via scanner');
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast.success(Pesanan  -> , "Scanner Auto-Update");
    } catch (err: any) {
      toast.error(err.message, "Scanner Error");
    }
  };'''

content = content.replace(
    "  const [orders, setOrders] = useState<Order[]>([]);\n    const [ordersLoading, setOrdersLoading] = useState(true);",
    state_hook
)

# Wait, the original was indented with 4 spaces!
content = content.replace(
    "    const [orders, setOrders] = useState<Order[]>([]);\n    const [ordersLoading, setOrdersLoading] = useState(true);",
    state_hook
)


# 3. UI Scanner Mode
old_ui = '''                  <select
                    value={orderPtFilter}
                    onChange={(e) => setOrderPtFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                  >
                    <option value="Semua">Semua PT</option>
                    {Array.from(new Set(orders.map(o => o.user?.pt).filter(Boolean))).map((ptName: any) => (
                      <option key={ptName} value={ptName}>{ptName}</option>
                    ))}
                  </select>'''

new_ui = old_ui + '''

                  <div className="hidden md:flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl shadow-sm">
                    <ScanLine className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="text-xs font-bold text-indigo-900 shrink-0">Scanner Action:</span>
                    <select
                      value={scannerMode}
                      onChange={(e: any) => setScannerMode(e.target.value)}
                      className="bg-white border border-indigo-200 text-indigo-800 text-[11px] font-bold rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="detail">Lihat Detail</option>
                      <option value="proses">Ubah ➔ Menyiapkan</option>
                      <option value="siap">Ubah ➔ Siap Diambil</option>
                      <option value="selesai">Ubah ➔ Selesai</option>
                    </select>
                  </div>'''

content = content.replace(old_ui, new_ui)

# 4. Thermal Print Barcode
old_print = '''                            <div className="mb-4 text-xs leading-tight space-y-1">
                              <div className="flex"><span className="w-16">No Order</span><span className="mr-2">:</span> <span className="font-bold">{getDisplayOrderId(order.id, order.createdAt)}</span></div>
                              <div className="flex"><span className="w-16">Tanggal</span><span className="mr-2">:</span> <span>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: idLocale })}</span></div>
                              <div className="flex"><span className="w-16">Pemesan</span><span className="mr-2">:</span> <span className="font-bold">{order.user?.nama || '-'}</span></div>
                              <div className="flex"><span className="w-16">Dept</span><span className="mr-2">:</span> <span>{order.user?.departemen || '-'}</span></div>
                              <div className="flex"><span className="w-16">No. HP</span><span className="mr-2">:</span> <span>{order.user?.no_hp || '-'}</span></div>
                            </div>'''

new_print = '''                            <div className="mb-4 text-xs leading-tight flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex"><span className="w-16">No Order</span><span className="mr-2">:</span> <span className="font-bold">{getDisplayOrderId(order.id, order.createdAt)}</span></div>
                                <div className="flex"><span className="w-16">Tanggal</span><span className="mr-2">:</span> <span>{format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: idLocale })}</span></div>
                                <div className="flex"><span className="w-16">Pemesan</span><span className="mr-2">:</span> <span className="font-bold">{order.user?.nama || '-'}</span></div>
                                <div className="flex"><span className="w-16">Dept</span><span className="mr-2">:</span> <span>{order.user?.departemen || '-'}</span></div>
                                <div className="flex"><span className="w-16">No. HP</span><span className="mr-2">:</span> <span>{order.user?.no_hp || '-'}</span></div>
                              </div>
                              <div className="text-right">
                                <Barcode value={order.id.toString()} width={1.5} height={40} fontSize={12} displayValue={true} margin={0} />
                              </div>
                            </div>'''

content = content.replace(old_print, new_print)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced!")
