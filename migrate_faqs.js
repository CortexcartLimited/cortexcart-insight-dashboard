// migrate_faqs.js
const mysql = require('mysql2/promise');

// This imports the hardcoded array from your FAQ page.
// Make sure the path is correct relative to your project root.
const { faqs } = require('./src/app/faq/page.js'); 

// --- IMPORTANT: Manually add your database credentials here ---
const dbConfig = {
    host: 'localhost',
    user: 'admin_cortexcart',
    password: '{Y/+9qG5?{Z0nfDq',
    database: 'admin_cortexcart',
};

async function migrateFaqs() {
    let connection;
    console.log('Starting FAQ migration...');

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Database connection successful.');

        // Optional: Clear the table first to avoid duplicates if you run this multiple times
        console.log('Clearing existing faqs table...');
        await connection.execute('DELETE FROM faqs');

        let count = 0;
        for (const faq of faqs) {
            const { question, answer, category } = faq;

            // Ensure all fields have a value before inserting
            if (question && answer && category) {
                const query = 'INSERT INTO faqs (question, answer, category) VALUES (?, ?, ?)';
                await connection.execute(query, [question, answer, category]);
                count++;
            }
        }

        console.log(`Migration complete! Successfully inserted ${count} FAQs.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('Database connection closed.');
        }
    }
}

migrateFaqs();
