
export default async function handler(req, res) {
  // Biến môi trường này CẦN ĐƯỢC CẤU HÌNH trong Vercel Project Settings
  // Giá trị là URL của Backend trên Render (ví dụ: https://my-app.onrender.com)
  const backendUrl = process.env.VITE_API_URL;

  if (!backendUrl) {
    console.error('CRON ERROR: VITE_API_URL is not defined.');
    return res.status(500).json({ error: 'VITE_API_URL environment variable is missing.' });
  }
  
  console.log(`[CRON] Pinging backend at: ${backendUrl}`);

  try {
    // Gọi endpoint /api/ping của server
    const response = await fetch(`${backendUrl}/api/ping`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`[CRON] Success. Backend replied: ${JSON.stringify(data)}`);
      return res.status(200).json({ success: true, message: 'Backend pinged successfully', data });
    } else {
      console.error(`[CRON] Failed. Status: ${response.status}`);
      return res.status(response.status).json({ success: false, message: `Backend returned ${response.status}` });
    }
  } catch (error) {
    console.error('[CRON] Network Error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
