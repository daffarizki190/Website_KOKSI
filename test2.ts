import { Client } from 'pg';
async function test() {
  const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_N95ArsaUnCLq@ep-shy-violet-auxahk1j-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require' });
  await client.connect();
  const res = await client.query('SELECT nama_barang, sub_kategori FROM products WHERE sub_kategori = ''Alat Tulis Kantor (ATK) Dasar''');
  console.log(res.rows);
  await client.end();
}
test();
