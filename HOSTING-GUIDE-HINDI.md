# Noor Islamic Journal — Render Hosting Guide (हिंदी)

## 1. क्या-क्या मिलेगा
- `render.yaml`: Render Blueprint फ़ाइल; build/start commands, health check, environment keys और SQLite persistent disk को एक जगह पर रखती है।
- Node.js 22, Express API और SQLite डेटाबेस।
- पाठकों के लिए बिना signup के वेबसाइट।
- `/admin/` पर secret-code login, HTML फ़ाइल import, Smart Paste, draft/publish, edit/delete और SQLite backup।

## 2. GitHub पर अपलोड
1. ZIP को extract करें।
2. पूरी `islamic-editorial-cms` फ़ोल्डर की सभी फाइलें एक GitHub repository में अपलोड करें। `node_modules`, `.env` या SQLite database अपलोड न करें।
3. Repository को Render से connect करें।

## 3. Render पर deploy
1. Render Dashboard खोलें और **New + → Blueprint** चुनें (यदि Blueprint विकल्प उपलब्ध न हो, तो **New + → Web Service** चुनकर नीचे दिए गए commands इस्तेमाल करें)।
2. GitHub repository चुनें जिसमें root में `render.yaml` है।
3. Blueprint service बनाते समय `ADMIN_SECRET_CODE` का निजी, लंबा और अनुमान लगाने में कठिन value डालें। वास्तविक secret को GitHub, code, screenshot या सार्वजनिक दस्तावेज़ में न डालें।
4. `SESSION_SECRET` Render द्वारा generate होना चाहिए। Environment में दोनों keys मौजूद होने की पुष्टि करें।
5. Deploy करें। Render पहले `npm install --no-audit --no-fund`, फिर `npm run check` और `npm test` चलाएगा। सभी build-time checks पास होने पर ही `npm start` से service शुरू होगी।
6. Deploy के बाद `/api/v1/health` खोलें; JSON में `ok: true` आना चाहिए। वेबसाइट `/` और स्टूडियो `/admin/` पर है।

## 4. Web Service manually बनाने पर
- Runtime: Node
- Build Command: `npm install --no-audit --no-fund && npm run check && npm test`
- Start Command: `npm start`
- Health Check Path: `/api/v1/health`
- Persistent Disk mount path: `/var/data` (कम-से-कम 1 GB)
- Environment:
  - `NODE_ENV` = `production`
  - `NODE_VERSION` = `22.16.0`
  - `DATA_DIR` = `/var/data`
  - `SITE_NAME` = `Noor Islamic Journal`
  - `ADMIN_SECRET_CODE` = आपका निजी secret
  - `SESSION_SECRET` = लंबा random secret

SQLite फ़ाइल `/var/data/content.sqlite` में रहेगी। Persistent disk के बिना deploy/restart पर database खो सकता है। इस Blueprint में Starter service और persistent disk configure किए गए हैं; Render के free plan पर persistent disk उपलब्ध न होने/सीमित होने के कारण यह configuration paid plan मांग सकती है। मौजूदा कीमत/उपलब्धता Render dashboard में जाँचें।

## 5. Local run
Node.js 20+ (इस configuration में 22.16.0) install करें। `.env.example` की copy `.env` नाम से बनाएँ और दोनों secret values बदलें। फिर:
- `npm install`
- `npm run check`
- `npm test`
- `npm start`

## 6. Publish करने का workflow
1. `/admin/` खोलें और secret code से login करें।
2. किसी वेबसाइट/Google Docs/Word से article copy करके Smart Paste editor में paste करें; या `.html`/`.htm` file import करें।
3. Title और category भरें। खाली excerpt/SEO fields अपने आप article text/title से भरे जाते हैं।
4. Preview देखें और Draft या Publish चुनकर Save करें।
5. Public article होम पेज पर दिखेगा। Edit/Delete और Backup स्टूडियो से करें।

### Formatting की सीमा
Smart Paste semantic HTML और clipboard में उपलब्ध bold/italic/headings/lists जैसी formatting को बचाने/पहचानने की कोशिश करता है। यदि स्रोत केवल plain text देता है, तो headings अनुमान से पहचानी जाती हैं; किसी भी सिस्टम से हर वेबसाइट का formatting 100% सही पहचानने की गारंटी नहीं होती। इसलिए Publish से पहले Preview अनिवार्य रूप से जाँचें।

## 7. Backup और सुरक्षा
- स्टूडियो में Backup दबाकर `.sqlite` फ़ाइल डाउनलोड करें और Render से बाहर सुरक्षित रखें।
- Secret भूलने/लीक होने पर Render Environment में बदलें और redeploy करें।
- Admin secret जिसे पता होगा वह admin access पा सकता है; इसे साझा न करें।
- इस संस्करण में कोई public signup नहीं है।
