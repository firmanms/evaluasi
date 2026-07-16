"use server";

export async function cekDomain(url: string): Promise<string> {
  try {
    // Tambahkan https jika belum ada
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return `Tidak Aktif (${response.status})`;
    }

    const html = await response.text();

    // Ambil isi <title>
    const match = html.match(/<title>(.*?)<\/title>/i);
    const title = match ? match[1].trim() : "Tanpa Judul";

    const protocol = new URL(response.url).protocol === "https:" ? "HTTPS" : "HTTP";

    return `Aktif (${protocol.toUpperCase().replace(":", "")}) - ${title}`;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return "Tidak Aktif (Timeout)";
    }
    return "Tidak Aktif";
  }
}
