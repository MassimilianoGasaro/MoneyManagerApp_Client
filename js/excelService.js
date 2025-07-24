export class ExcelService {
    
    /**
     * Esporta i dati in un file Excel
     * @param {Array} data - Array di oggetti da esportare
     * @param {string} filename - Nome del file (senza estensione)
     */
    static exportToExcel(data, filename = 'expenses') {
        try {
            console.log('Esportazione dati:', data);
            
            // Converti i dati in un formato più leggibile
            const formattedData = data.map(item => ({
                'Titolo': item.title || item.name || '',
                'Descrizione': item.description || '',
                'Importo': item.amount || 0,
                'Tipo': item.type || '',
                'Data': item.date ? new Date(item.date).toLocaleDateString('it-IT') : '',
                'Creato il': item.createdAt ? new Date(item.createdAt).toLocaleDateString('it-IT') : ''
            }));

            // Crea un nuovo workbook
            const wb = XLSX.utils.book_new();
            
            // Converti i dati in un worksheet
            const ws = XLSX.utils.json_to_sheet(formattedData);
            
            // Imposta la larghezza delle colonne
            ws['!cols'] = [
                { wch: 20 }, // Titolo
                { wch: 30 }, // Descrizione
                { wch: 15 }, // Importo
                { wch: 15 }, // Tipo
                { wch: 15 }, // Data
                { wch: 15 }  // Creato il
            ];
            
            // Aggiungi il worksheet al workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Spese');
            
            // Esporta il file
            const currentDate = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `${filename}_${currentDate}.xlsx`);
            
            return true;
            
        } catch (error) {
            console.error('Errore durante l\'esportazione:', error);
            throw new Error('Errore durante l\'esportazione del file Excel');
        }
    }

    /**
     * Importa i dati da un file Excel
     * @param {File} file - File Excel selezionato
     * @returns {Promise<Array>} - Array di oggetti importati
     */
    static async importFromExcel(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        
                        // Prendi il primo foglio
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        
                        // Converti in JSON
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        
                        console.log('Dati importati dal file:', jsonData);
                        
                        // Trasforma i dati nel formato della tua app
                        const formattedData = jsonData.map(row => ({
                            name: row['Titolo'] || row['title'] || '',
                            description: row['Descrizione'] || row['description'] || '',
                            amount: parseFloat(row['Importo'] || row['amount']) || 0,
                            type: row['Tipo'] || row['type'] || 'SpesaGenerica',
                            date: this.parseDate(row['Data'] || row['date']),
                        }));
                        
                        resolve(formattedData);
                        
                    } catch (error) {
                        console.error('Errore nella lettura del file Excel:', error);
                        reject(new Error('Errore nella lettura del file Excel'));
                    }
                };
                
                reader.onerror = () => reject(new Error('Errore nella lettura del file'));
                reader.readAsArrayBuffer(file);
                
            } catch (error) {
                console.error('Errore durante l\'importazione:', error);
                reject(new Error('Errore durante l\'importazione del file Excel'));
            }
        });
    }

    /**
     * Converte una data in formato stringa in ISO
     * @param {string|Date} dateString 
     * @returns {string}
     */
    static parseDate(dateString) {
        if (!dateString) return new Date().toISOString().split('T')[0];
        
        try {
            // Se è già una data
            if (dateString instanceof Date) {
                return dateString.toISOString().split('T')[0];
            }
            
            // Se è una stringa italiana (dd/mm/yyyy)
            if (typeof dateString === 'string' && dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1; // I mesi in JS sono 0-based
                    const year = parseInt(parts[2]);
                    const date = new Date(year, month, day);
                    return date.toISOString().split('T')[0];
                }
            }
            
            // Prova a parsare come data normale
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            
            // Fallback alla data corrente
            return new Date().toISOString().split('T')[0];
            
        } catch (error) {
            console.error('Errore nel parsing della data:', error);
            return new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Valida i dati importati
     * @param {Array} data 
     * @returns {Object} - { valid: Array, invalid: Array }
     */
    /**
     * Valida i dati importati
     * @param {Array} data - Dati da validare
     * @param {Array} typologies - Array delle tipologie disponibili per la validazione
     */
    static validateImportData(data, typologies = []) {
        const valid = [];
        const invalid = [];
        
        data.forEach((item, index) => {
            const errors = [];
            
            // Validazioni
            if (!item.name || item.name.trim() === '') {
                errors.push('Titolo mancante');
            }
            
            if (!item.amount || item.amount <= 0) {
                errors.push('Importo non valido');
            }
            
            if (!item.type || item.type.trim() === '') {
                errors.push('Tipo mancante');
            } else if (typologies.length > 0) {
                // Verifica che la tipologia esista
                const typologyExists = typologies.some(t => 
                    t.name && t.name.toLowerCase() === item.type.toLowerCase()
                );
                
                if (!typologyExists) {
                    errors.push(`Tipologia "${item.type}" non trovata`);
                }
            }
            
            if (errors.length > 0) {
                invalid.push({
                    row: index + 2, // +2 perché la prima riga è l'header
                    data: item,
                    errors: errors
                });
            } else {
                valid.push(item);
            }
        });
        
        return { valid, invalid };
    }

    /**
     * Genera un template Excel vuoto per l'importazione
     * @param {Array} typologies - Array delle tipologie disponibili per esempi
     */
    static generateTemplate(typologies = []) {
        try {
            // Prendi la prima tipologia disponibile come esempio, oppure usa un default
            const exampleType = typologies.length > 0 ? typologies[0].name : 'SpesaGenerica';
            
            const templateData = [
                {
                    'Titolo': 'Esempio spesa',
                    'Descrizione': 'Descrizione della spesa',
                    'Importo': 50.00,
                    'Tipo': exampleType,
                    'Data': new Date().toLocaleDateString('it-IT')
                }
            ];

            // Se ci sono più tipologie, aggiungi altri esempi
            if (typologies.length > 1) {
                templateData.push({
                    'Titolo': 'Altra spesa di esempio',
                    'Descrizione': 'Un\'altra descrizione',
                    'Importo': 25.50,
                    'Tipo': typologies[1].name,
                    'Data': new Date().toLocaleDateString('it-IT')
                });
            }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(templateData);
            
            // Imposta la larghezza delle colonne
            ws['!cols'] = [
                { wch: 20 }, // Titolo
                { wch: 30 }, // Descrizione
                { wch: 15 }, // Importo
                { wch: 15 }, // Tipo
                { wch: 15 }  // Data
            ];
            
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            
            // Se ci sono tipologie, crea un secondo foglio con la lista delle tipologie disponibili
            if (typologies.length > 0) {
                const typologiesData = typologies.map(t => ({
                    'Nome Tipologia': t.name,
                    'Descrizione': t.description || ''
                }));
                
                const wsTypes = XLSX.utils.json_to_sheet(typologiesData);
                wsTypes['!cols'] = [
                    { wch: 20 }, // Nome
                    { wch: 40 }  // Descrizione
                ];
                
                XLSX.utils.book_append_sheet(wb, wsTypes, 'Tipologie Disponibili');
            }
            
            XLSX.writeFile(wb, 'template_import_spese.xlsx');
            
            return true;
            
        } catch (error) {
            console.error('Errore nella creazione del template:', error);
            throw new Error('Errore nella creazione del template');
        }
    }
}
