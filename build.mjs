// Assemble src/ into one page. Images sit alongside in img/.
// In the repo the page is written to ./index.html, which is what GitHub Pages serves.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const R = path.dirname(fileURLToPath(import.meta.url));
const OUT = fs.existsSync(path.join(R, 'site')) ? path.join(R, 'site', 'index.html') : path.join(R, 'index.html');
const read = d => fs.readdirSync(path.join(R, d)).filter(f => !f.startsWith('.')).sort().map(f => fs.readFileSync(path.join(R, d, f), 'utf8')).join('\n');
const css = read('src/css');
const html = read('src/html');
const js = read('src/js');

const page = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lincoln Park Pilates website concept</title>
<meta name="description" content="Reformer Pilates in Lincoln Park, Chicago. 45-minute classes of up to twelve people in a warm room, plus private training, an infrared sauna and event space. 2105 N Southport Ave. New clients: 3 classes for $39.">
<meta name="theme-color" content="#d4141c">
<meta name="robots" content="noindex, nofollow">
<meta property="og:title" content="Lincoln Park Pilates website concept">
<meta property="og:description" content="A redesign concept for Lincoln Park Pilates by Jason Kemp. Not the studio's live site. Nothing here books or charges.">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders:opsz,wght@10..72,500..900&family=Hanken+Grotesk:wght@400..700&display=swap">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23d4141c'/%3E%3Ctext x='16' y='24' text-anchor='middle' font-family='Arial Narrow,Arial,sans-serif' font-weight='700' font-size='22' fill='%23fff'%3ELP%3C/text%3E%3C/svg%3E">
<style>
${css}
</style>
</head>
<body>
${html}
<script>
(function(){
${js}
})();
</script>
</body>
</html>
`;
fs.mkdirSync(path.join(R, 'site'), { recursive: true });
fs.writeFileSync(OUT, page);
console.log(path.relative(R, OUT), (page.length / 1024).toFixed(0) + 'KB');
