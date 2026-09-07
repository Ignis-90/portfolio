module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.OPENAI_ADS_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Missing OPENAI_ADS_API_KEY" });
    return;
  }

  const { event_id, source_url } = req.body || {};
  if (!event_id || !source_url) {
    res.status(400).json({ error: "event_id and source_url are required" });
    return;
  }

  try {
    const openaiRes = await fetch(
      "https://bzr.openai.com/v1/events?pid=G5g2G6h9mCLMykLsKtV5My",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          validate_only: false,
          events: [
            {
              id: event_id,
              type: "page_viewed",
              timestamp_ms: Date.now(),
              source_url,
              action_source: "web",
              data: {
                type: "contents",
              },
            },
          ],
        }),
      }
    );

    if (!openaiRes.ok) {
      const detail = await openaiRes.text();
      res.status(502).json({ error: "OpenAI Ads API error", detail });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Request to OpenAI Ads API failed" });
  }
};
