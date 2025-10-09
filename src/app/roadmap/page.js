
import Layout from '@/app/components/Layout';
import { db } from '@/lib/db';

export const revalidate = 0; // Revalidate data on each request

const getRoadmapFeatures = async () => {
    try {
        const [rows] = await db.query('SELECT * FROM roadmap_features ORDER BY status, id DESC');
        return rows;
    } catch (error) {
        console.error('Error fetching roadmap features:', error);
        return [];
    }
};

const RoadmapPage = async () => {
    const features = await getRoadmapFeatures();

    const inProgress = features.filter(feature => feature.status === 'in_progress');
    const completed = features.filter(feature => feature.status === 'completed');
    const futurePlans = features.filter(feature => feature.status === 'future');

    const renderFeature = (feature) => (
        <div key={feature.id} className="bg-white p-4 rounded-lg shadow mb-4">
            <h3 className="text-xl font-semibold text-gray-800">{feature.name}</h3>
            <p className="text-gray-600 mt-2">{feature.description}</p>
            {feature.release_date && (
                <p className="text-sm text-gray-500 mt-2">
                    {feature.status === 'Completed' ? 'Completed On: ' : 'Target: '}
                    {new Date(feature.release_date).toLocaleDateString()}
                </p>
            )}
        </div>
    );

    return (
       <Layout>
       <div className="min-h-screen p-8">
            <header className="mb-10 text-center">
                <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">CortexCart Roadmap</h1>
                <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                    Discover what we&apos;re building next, what&apos;s currently in progress, and what we&apos;ve already delivered.
                </p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                <section>
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2 border-blue-500">In Progress</h2>
                    {inProgress.length > 0 ? (
                        inProgress.map(renderFeature)
                    ) : (
                        <p className="text-gray-600">No features currently in progress.</p>
                    )}
                </section>

                <section>
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2 border-green-500">Completed</h2>
                    {completed.length > 0 ? (
                        completed.map(renderFeature)
                    ) : (
                        <p className="text-gray-600">No features completed yet.</p>
                    )}
                </section>

                <section>
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 pb-2 border-purple-500">Future Plans</h2>
                    {futurePlans.length > 0 ? (
                        futurePlans.map(renderFeature)
                    ) : (
                        <p className="text-gray-600">No future plans announced yet. Stay tuned!</p>
                    )}
                </section>
            </main>
        </div>
        </Layout>
    );
};

export default RoadmapPage;