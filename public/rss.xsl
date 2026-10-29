<?xml version="1.0" encoding="utf-8"?>
<!-- Makes /rss.xml readable when someone opens it in a browser. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="utf-8" />
  <xsl:template match="/rss/channel">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="title" /> · RSS feed</title>
        <style>
          body { margin: 0; min-height: 100vh; background: #2b1b10; color: #1c1a17; font: 18px/1.55 Georgia, serif; }
          main { max-width: 680px; margin: 0 auto; padding: 48px 16px; }
          .card { background: #f3eee1; padding: 32px; box-shadow: 0 20px 30px -14px #000; transform: rotate(-0.4deg); }
          h1 { margin: 0 0 6px; font: 400 2.4rem/1 Impact, 'Anton', sans-serif; text-transform: uppercase; }
          .note { margin: 0 0 18px; padding: 12px 14px; background: #f7e46b; font-size: 0.95rem; }
          code { font-size: 0.85rem; word-break: break-all; }
          ol { list-style: none; padding: 0; margin: 24px 0 0; }
          li { padding: 10px 0; border-bottom: 1px dashed #0004; }
          li a { color: inherit; font-weight: 600; }
          small { display: block; font: 0.8rem 'Courier New', monospace; text-transform: uppercase; color: #b3261e; }
          .back { color: #ffcf8a; }
        </style>
      </head>
      <body>
        <main>
          <p><a class="back" href="/">← back to the board</a></p>
          <div class="card">
            <h1><xsl:value-of select="title" /></h1>
            <p class="note">This is an <strong>RSS feed</strong>. Paste this page's address into a feed reader (NetNewsWire, Feedly, Inoreader, Reeder…) to get every new notice as it's pinned up.</p>
            <p><xsl:value-of select="description" /></p>
            <ol>
              <xsl:for-each select="item">
                <li>
                  <small><xsl:value-of select="substring(pubDate, 6, 11)" /></small>
                  <a href="{link}"><xsl:value-of select="title" /></a>
                </li>
              </xsl:for-each>
            </ol>
          </div>
        </main>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
