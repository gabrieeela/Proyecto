import playwright from 'playwright';
import xlsx from 'xlsx';

(async () => {
    const data = {}; 

    const urls = [
        { url: "https://www.hackaboss.com/blog/lenguajes-programacion-mas-demandados", site: "HackABoss" },
        { url: "https://keepcoding.io/blog/lenguajes-de-programacion-mas-demandados/", site: "KeepCoding" },
        { url: "https://www.codemotion.com/magazine/es/dev-life-es/los-5-lenguajes-de-programacion-mas-demandados-en-2024/", site: "Codemotion" }
    ];

    for (const browserType of ['chromium']) {
        const browser = await playwright[browserType].launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        for (const { url, site } of urls) {
            await page.goto(url);
            await page.waitForTimeout(1000);

            let languages = [];
            if (url.includes("hackaboss")) {
                languages = await page.$$eval('div[class="content-rich-text w-richtext"] h2', items => 
                    items.slice(0, 5).map(item => item.innerText.trim())
                );
            } else if (url.includes("keepcoding")) {
                languages = await page.$$eval('ul[class="ez-toc-list ez-toc-list-level-1 "] li', items => 
                    items.map(item => item.innerText.trim())
                );
            } else if (url.includes("codemotion")) {
                languages = await page.$$eval('div[class="entry-content"] h2', items => 
                    items.slice(0, 5).map(item => item.innerText.trim())
                );
            }

            data[site] = languages;  
        }

        await browser.close();
    }

    const maxRows = Math.max(...Object.values(data).map(langs => langs.length));
    const worksheetData = Array.from({ length: maxRows }, (_, i) => {
        const row = {};
        for (const site in data) {
            row[site] = data[site][i] || '';  
        }
        return row;
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(worksheetData); 
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Lenguajes más demandados');
    
    xlsx.writeFile(workbook, 'Lenguajes_Mas_Demandados_2024.xlsx');
    console.log('Datos guardados en Lenguajes_Mas_Demandados_2024.xlsx');
})();
