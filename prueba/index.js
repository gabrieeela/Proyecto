import playwright from 'playwright';
import xlsx from 'xlsx';

(async () => {
    const data = {};  // Almacena los datos obtenidos en un formato organizado por sitio

    // Define las URLs de los sitios que contienen los rankings de lenguajes
    const urls = [
        { url: "https://www.hackaboss.com/blog/lenguajes-programacion-mas-demandados", site: "HackABoss" },
        { url: "https://keepcoding.io/blog/lenguajes-de-programacion-mas-demandados/", site: "KeepCoding" },
        { url: "https://www.codemotion.com/magazine/es/dev-life-es/los-5-lenguajes-de-programacion-mas-demandados-en-2024/", site: "Codemotion" }
    ];

    // Recorre cada navegador
    for (const browserType of ['chromium']) {
        const browser = await playwright[browserType].launch();
        const context = await browser.newContext();
        const page = await context.newPage();

        // Realiza scraping en cada sitio
        for (const { url, site } of urls) {
            await page.goto(url);
            await page.waitForTimeout(1000);

            // Extrae datos específicos de cada sitio para agregarlos en la estructura `data`
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

            data[site] = languages;  // Asigna el arreglo de lenguajes a la clave del sitio en `data`
        }

        await browser.close();
    }

    // Reorganiza los datos para la tabla de Excel
    const maxRows = Math.max(...Object.values(data).map(langs => langs.length));
    const worksheetData = Array.from({ length: maxRows }, (_, i) => {
        const row = {};
        for (const site in data) {
            row[site] = data[site][i] || '';  // Agrega el lenguaje en el ranking o deja vacío si no hay más
        }
        return row;
    });

    // Crea el archivo Excel para guardar todos los datos en una sola hoja
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(worksheetData);  // Crea una sola hoja con todos los datos en columnas
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Lenguajes más demandados');
    
    xlsx.writeFile(workbook, 'Lenguajes_Mas_Demandados_2024.xlsx');
    console.log('Datos guardados en Lenguajes_Mas_Demandados_2024.xlsx');
})();
