import re

with open('src/pages/DashboardAdmin.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace: `Status pesanan #${orderId} berhasil
content = content.replace(
    'toast.success(`Status pesanan #${orderId} berhasil diubah',
    "const tgtOrder = orders.find(o => o.id === orderId);\n        toast.success(`Status pesanan ${tgtOrder ? getDisplayOrderId(tgtOrder.id, tgtOrder.createdAt) : orderId} berhasil diubah"
)

# Replace: Pesanan #${orderId}? Seluruh data
content = content.replace(
    'message: `Apakah Anda yakin ingin menghapus transaksi Pesanan #${orderId}? Seluruh data pesanan dan rincian',
    "message: `Apakah Anda yakin ingin menghapus transaksi Pesanan ${getDisplayOrderId(orderId)}? Seluruh data pesanan dan rincian"
)

# Replace: toast.success(data.message || `Pesanan #${orderId} berhasil dihapus.`);
content = content.replace(
    'toast.success(data.message || `Pesanan #${orderId} berhasil dihapus.`);',
    'toast.success(data.message || `Pesanan ${getDisplayOrderId(orderId)} berhasil dihapus.`);'
)

# Replace: ID Order #{order.id}
content = content.replace(
    'ID Order #{order.id}',
    'ID Pesanan {getDisplayOrderId(order.id, order.createdAt)}'
)

# Replace: Halo Sdr/i ${order.user.nama}, mengenai pesanan #${order.id}
content = content.replace(
    'mengenai pesanan #${order.id}',
    'mengenai pesanan ${getDisplayOrderId(order.id, order.createdAt)}'
)

# Replace: Cetak Struk Pesanan #${order.id}
content = content.replace(
    'Cetak Struk Pesanan #${order.id}',
    'Cetak Struk Pesanan ${getDisplayOrderId(order.id, order.createdAt)}'
)

# Replace: Hapus Transaksi Pesanan #${order.id}
content = content.replace(
    'Hapus Transaksi Pesanan #${order.id}',
    'Hapus Transaksi Pesanan ${getDisplayOrderId(order.id, order.createdAt)}'
)

# Replace: Update Status Pesanan #{selectedOrderForStatus.id}
content = content.replace(
    'Update Status Pesanan #{selectedOrderForStatus.id}',
    'Update Status Pesanan {getDisplayOrderId(selectedOrderForStatus.id, selectedOrderForStatus.createdAt)}'
)

# For Print Receipt:
# <span className="font-bold">#{order.id}</span></div>
content = content.replace(
    '<span className="font-bold">#{order.id}</span>',
    '<span className="font-bold">{getDisplayOrderId(order.id, order.createdAt)}</span>'
)

# Excel Export:
# Row data for 'NO': order.id -> getDisplayOrderId(order.id, order.createdAt)
content = content.replace(
    "['NO'] = order.id;",
    "['NO'] = getDisplayOrderId(order.id, order.createdAt);"
)

# Print Receipt "Pesanan #"
content = content.replace(
    'Cetak Struk Pesanan #',
    'Cetak Struk Pesanan '
)


with open('src/pages/DashboardAdmin.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
