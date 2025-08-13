// src/app/api/reports/[reportId]/download/route.js
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

export async function GET(request, { params }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
    const { reportId } = params;
    const userEmail = session.user.email;

    try {
        const [reports] = await db.query(
            // Fetch both the text content and the chart data
            'SELECT report_content, chart_data FROM generated_reports WHERE id = ? AND user_email = ?',
            [reportId, userEmail]
        );

        if (reports.length === 0) {
            return NextResponse.json({ message: 'Report not found or access denied.' }, { status: 404 });
        }

        const report = reports[0];
        const htmlContent = marked.parse(report.report_content);
        const chartData = JSON.stringify(report.chart_data?.salesByDay || []);

        // We now build a more advanced HTML document that includes the Chart.js library
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>CortexCart Performance Report</title>
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
                    .report-container { max-width: 800px; margin: 40px auto; padding: 20px; }
                    h1, h2, h3 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
                    .chart-container { margin: 40px 0; }
                </style>
            </head>
            <body>
                <div class="report-container">
                    <h1>CortexCart Performance Report</h1>
                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                    
                    ${htmlContent}

                    <div class="chart-container">
                        <h2>Sales By Day</h2>
                        <canvas id="salesChart"></canvas>
                    </div>
                </div>

                <script>
                    const salesData = ${chartData};
                    const ctx = document.getElementById('salesChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: salesData.map(d => new Date(d.date).toLocaleDateString('en-GB')),
                            datasets: [{
                                label: 'Sales (£)',
                                data: salesData.map(d => d.total_sales),
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: { scales: { y: { beginAtZero: true } } }
                    });
                </script>
            </body>
            </html>
        `;

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        await browser.close();

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="CortexCart-Report-${reportId}.pdf"`,
            },
        });

    } catch (error) {
        console.error('Error generating PDF report:', error);
        return NextResponse.json({ message: 'Failed to generate PDF report.' }, { status: 500 });
    }
}
