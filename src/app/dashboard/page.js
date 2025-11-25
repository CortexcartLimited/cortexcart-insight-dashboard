'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Import all components
import Layout from '@/app/components/Layout';
import AlertBanner from '@/app/components/AlertBanner';
import StatCard from '@/app/components/StatCard';
import StatCard2 from '@/app/components/StatCard2';
import ChartContainer from '@/app/components/ChartContainer';
import SalesBarChart from '@/app/components/SalesBarChart';
import ActivityTimeline from '@/app/components/ActivityTimeline';
import DateFilter from '@/app/components/DataFilter';
import TopPagesList from '@/app/components/TopPagesList';
import TopReferrersList from '@/app/components/TopReferrersList';
import DeviceChart from '@/app/components/DeviceChart';
import LiveVisitorCount from '@/app/components/LiveVisitorCount';
import SkeletonCard from '@/app/components/SkeletonCard';
import Ga4LineChart from '@/app/components/Ga4LineChart';
import PerformanceScore from '@/app/components/PerformanceScore';
import OnboardingModal from '@/app/components/OnboardingModal';
import VisitorsByCountryChart from '@/app/components/VisitorsByCountryChart';
import NewVsReturningChart from '@/app/components/NewVsReturningChart';
import DemographicsCharts from '@/app/components/DemographicsCharts';
import GoogleAdsCharts from '@/app/components/GoogleAdsCharts'; // <--- ADDED IMPORT
import { 
    StickinessCard, 
    CityTable, 
    SearchQueriesTable, 
    OrganicLandingTable, 
    EngagedSessionsCard 
} from '@/app/components/analytics/DeepDiveWidgets';

const currencySymbols = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: '$', AUD: '$' };

const DataSourceToggle = ({ dataSource, setDataSource }) => (
  <div className="flex items-center p-1 bg-gray-200 rounded-lg">
    <button onClick={() => setDataSource('cortexcart')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${dataSource === 'cortexcart' ? 'bg-white shadow' : 'text-gray-600'}`}>CortexCart</button>
    <button onClick={() => setDataSource('ga4')} className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${dataSource === 'ga4' ? 'bg-white shadow' : 'text-gray-600'}`}>Google Analytics</button>
  </div>
);

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  
  // State for CortexCart data
  const [stats, setStats] = useState(null);
  const [chartApiData, setChartApiData] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [topReferrers, setTopReferrers] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [performanceError, setPerformanceError] = useState('');
  const [alerts, setAlerts] = useState([]);
  
  // State for GA4 data
  const [ga4Stats, setGa4Stats] = useState(null);
  const [ga4ChartData, setGa4ChartData] = useState([]);
  const [ga4AudienceData, setGa4AudienceData] = useState(null);
  const [ga4Demographics, setGa4Demographics] = useState(null);

  // General state
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState('cortexcart');
  const [siteSettings, setSiteSettings] = useState({ currency: 'USD' });
  
  // Sub-tab state for Google section
  const [subTab, setSubTab] = useState('ga4'); 
  // Google Ads Data State
  const [googleAdsData, setGoogleAdsData] = useState(null);

  const [dateRange, setDateRange] = useState(() => {
      const endDate = new Date();
      // Use a very early date as the start for "All Time"
      const startDate = new Date('2020-01-01'); 
      return { startDate, endDate };
  });

  const siteId = session?.user?.email;

    useEffect(() => {
        if (status === 'authenticated' && session?.user && !session.user.onboarding_completed) {
            setIsOnboardingOpen(true);
        }
    }, [status, session]);

    const handleOnboardingComplete = () => {
        setIsOnboardingOpen(false);
        update(); 
    };

    useEffect(() => {
        if (status !== 'authenticated' || !siteId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            
            const sd = dateRange.startDate ? `&startDate=${dateRange.startDate}` : '';
            const ed = dateRange.endDate ? `&endDate=${dateRange.endDate}` : '';
            const dateParams = `${sd}${ed}`;
            
            try {
                const alertsRes = await fetch('/api/alerts/active');
                if (alertsRes.ok) setAlerts(await alertsRes.json());
            } catch (e) { console.error("Could not fetch alerts", e); }

            if (dataSource === 'cortexcart') {
                try {
                    const responses = await Promise.all([
                        fetch(`/api/stats?siteId=${siteId}${dateParams}`),
                        fetch(`/api/charts/sales-by-day?siteId=${siteId}${dateParams}`),
                        fetch(`/api/events?siteId=${siteId}${dateParams}`),
                        fetch(`/api/stats/top-pages?siteId=${siteId}${dateParams}`),
                        fetch(`/api/stats/top-referrers?siteId=${siteId}${dateParams}`),
                        fetch(`/api/site-settings?siteId=${siteId}`),
                        fetch(`/api/stats/device-types?siteId=${siteId}${dateParams}`),
                    ]);

                    for (const res of responses) {
                        if (!res.ok) throw new Error(`A data fetch failed: ${res.statusText}`);
                    }
                    
                    const [statsData, chartData, eventsData, topPagesData, topReferrersData, settingsData, deviceTypesData] = await Promise.all(responses.map(res => res.json()));

                    setStats(statsData);
                    setChartApiData(chartData);
                    setRecentEvents(eventsData);
                    setTopPages(topPagesData);
                    setTopReferrers(topReferrersData);
                    setSiteSettings(settingsData);
                    setDeviceData(deviceTypesData);
                    
                    if (ga4Demographics) setGa4Demographics(ga4Demographics); // Keep existing if switching back

                } catch (err) { 
                    console.error("Dashboard Error:", err);
                    setError(err.message); 
                }
            } else { // Fetch from GA4 & Ads
                try {
                    const responses = await Promise.all([
                        fetch(`/api/ga4-stats?siteId=${siteId}${dateParams}`),
                        fetch(`/api/ga4-charts?siteId=${siteId}${dateParams}`),
                        fetch(`/api/ga4-audience?siteId=${siteId}${dateParams}`),
                        fetch(`/api/ga4-demographics?siteId=${siteId}${dateParams}`),
                        fetch(`/api/google-ads?siteId=${siteId}${dateParams}`),
                    ]);

                    for (const res of responses) {
                        if (!res.ok) {
                            if (res.url.includes('demographics') || res.url.includes('google-ads')) {
                                console.warn("Optional data failed to load");
                                continue; 
                            }
                            throw new Error(`GA4 Data Fetch Failed: ${res.statusText}`);
                        }
                    }

                    const [
                        statsData, 
                        chartData, 
                        audienceData,
                        demographicsData,
                        googleAdsDataRes
                    ] = await Promise.all(responses.map(res => res.ok ? res.json() : null));

                    setGa4Stats(statsData);
                    setGa4ChartData(chartData);
                    
                    if (audienceData) setGa4AudienceData(audienceData);
                    if (demographicsData) setGa4Demographics(demographicsData);
                    if (googleAdsDataRes) setGoogleAdsData(googleAdsDataRes);

                } catch (err) { 
                    console.error("GA4 Dashboard Error:", err);
                    setError(err.message); 
                }
            }
            setIsLoading(false);
        };
        
        fetchData();
    }, [dateRange.startDate, dateRange.endDate, siteId, dataSource, status]);
  
  useEffect(() => {
    if (status === 'loading' || !siteId) return;
    if (!siteId) { return; }

    async function fetchPerformanceData() {
        setPerformanceError('');
        try {
            const res = await fetch('/api/performance/get-speed');
            const data = await res.json();
            
            if (!res.ok) {
                if (res.status === 429) {
                    setPerformanceError(data.message || "Limit reached.");
                    if (data.score) setPerformanceData(data);
                } else {
                    throw new Error(data.message || `Failed to fetch score: ${res.statusText}`);
                }
            } else {
                setPerformanceData(data);
            }
        } catch (err) {
            setPerformanceError(err.message);
        }
    }
    
    fetchPerformanceData();

    const interval = setInterval(() => {
      fetch(`/api/stats/live-visitors?siteId=${siteId}`)
        .then(res => res.json())
        .then(data => setLiveVisitors(data.liveVisitors))
        .catch(console.error);
    }, 10000); 
    return () => clearInterval(interval);
  }, [siteId, status]);
  
  const handleDateFilterChange = (startDate, endDate) => { setDateRange({ startDate, endDate }); };

  if (status === 'loading') return <Layout><p>Loading...</p></Layout>;
  if (error) return <Layout><p className="p-6 text-red-600">Error: {error}</p></Layout>;
  
  const currencySymbol = siteSettings?.currency ? (currencySymbols[siteSettings.currency] || '$') : '$';
  const formattedRevenue = `${currencySymbol}${stats?.totalRevenue ? parseFloat(stats.totalRevenue).toFixed(2) : '0.00'}`;

  return (
    <Layout>
      <OnboardingModal 
          isOpen={isOnboardingOpen} 
          onComplete={handleOnboardingComplete} 
          siteId={session?.user?.site_id}
      />            

      <div className="space-y-4 mb-6 bg-grey-200">
        {alerts.map((alert) => (
            <AlertBanner key={alert.id} title={alert.title} message={alert.message} type={alert.type} />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <LiveVisitorCount count={liveVisitors} />
        </div>
        <div className="flex items-center gap-4">
            <DataSourceToggle dataSource={dataSource} setDataSource={setDataSource} />
            <DateFilter onFilterChange={handleDateFilterChange} />
        </div>
      </div>

      {/* ================= NEW: Google Sub-Tabs ================= */}
      {dataSource === 'ga4' && (
        <div className="flex items-center gap-4 mb-6 border-b border-gray-200 overflow-x-auto">
            <button onClick={() => setSubTab('ga4')} className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${subTab === 'ga4' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                📊 Analytics (GA4)
            </button>
            <button onClick={() => setSubTab('ads')} className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${subTab === 'ads' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                📣 Google Ads
            </button>
            <button className="pb-2 px-2 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
                💰 AdSense (Coming Soon)
            </button>
            <button className="pb-2 px-2 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
                🔍 Search Console (Coming Soon)
            </button>
        </div>
      )}
      {/* =========================================================== */}
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : (
        <div className={`transition-opacity duration-300`}>
          {dataSource === 'cortexcart' ? (
            /* --- CORTEX CART VIEW --- */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Revenue" value={formattedRevenue} icon="💰" />
                <StatCard title="Total Sales" value={stats?.sales?.toLocaleString() || 0} icon="🛒" />
                <StatCard title="Page Views" value={stats?.pageviews?.toLocaleString() || 0} icon="👁️" />
              </div>
              <ChartContainer title="Sales by Day">
                <SalesBarChart apiData={chartApiData} currencySymbol={currencySymbol} />
              </ChartContainer>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartContainer title="Visitors by Country" className="h-full">
                    <VisitorsByCountryChart dateRange={dateRange} siteId={siteId} externalData={ga4Demographics?.countryData} />
                </ChartContainer>
                <ChartContainer title="Recent Events">
                  <ActivityTimeline eventsData={recentEvents} />
                </ChartContainer>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <ChartContainer title="Top Pages">
                    <TopPagesList pages={topPages} />
                </ChartContainer>
                <ChartContainer title="Device Breakdown">
                  <div className="h-64 flex items-center justify-center">
                    <DeviceChart deviceData={deviceData} />
                  </div>
                </ChartContainer>
                <ChartContainer title="Top Referrers">
                  <TopReferrersList referrers={topReferrers} />
                </ChartContainer>
              </div>
            </div>
          ) : (
            /* --- GOOGLE VIEW (Contains Sub-Tabs) --- */
            <div className="space-y-8">
                
                {/* 1. GA4 SUB-TAB */}
                {subTab === 'ga4' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Users" value={ga4Stats?.users?.toLocaleString() || 0} icon="👥" />
                            <StatCard title="Sessions" value={ga4Stats?.sessions?.toLocaleString() || 0} icon="💻" />
                            <StatCard title="Page Views" value={ga4Stats?.pageviews?.toLocaleString() || 0} icon="👁️" />
                            <StatCard title="Conversions" value={ga4Stats?.conversions?.toLocaleString() || 0} icon="🎯" />
                        </div>
                        <ChartContainer title="Page Views & Conversions Over Time">
                            <Ga4LineChart data={ga4ChartData} />
                        </ChartContainer>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                            <StatCard title="Avg. Engagement Time" value={ga4Stats?.averageEngagementDuration ? `${(ga4Stats.averageEngagementDuration / 60).toFixed(2)} min` : '0 min'} icon="⏱️" />
                            <StatCard2 title="What is Avg. Engagement Time" description="Average time a user spends actively engaged with your website." icon="🔢" />
                            <ChartContainer title="Page Speed Score (Mobile)" className="h-full">
                                {performanceError && <p className="text-center text-sm text-yellow-600 mb-2">{performanceError}</p>}
                                {performanceData ? (
                                    <div className="h-25 flex items-center justify-center">
                                        <PerformanceScore {...performanceData} />
                                    </div>
                                ) : (
                                    <div className="h-full flex items-center justify-center">
                                        <p className="text-center text-gray-500">{performanceError ? 'No cached score available.' : 'Loading score...'}</p>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-4 text-center">Score based on Google Lighthouse data.</p>
                            </ChartContainer>
                            <ChartContainer title="Top Pages">
                                <TopPagesList pages={topPages} />
                            </ChartContainer>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <ChartContainer title="New vs Returning Users">
                                <NewVsReturningChart data={ga4AudienceData?.newVsReturning} />
                            </ChartContainer>
                            <div className="space-y-6">
                                <StatCard 
                                    title="Engagement Rate" 
                                    value={`${ga4AudienceData?.engagementRate || 0}%`}
                                    icon="📈"
                                    description="The percentage of sessions that lasted longer than 10 seconds, had a conversion event, or had at least 2 pageviews."
                                />
                                <StatCard 
                                    title="Engaged Sessions" 
                                    value={ga4AudienceData?.engagedSessions?.toLocaleString() || 0}
                                    icon="👍"
                                    description="The number of sessions that were engaged."
                                />
                            </div>
                        </div>
                        <ChartContainer title="Audience Demographics">
                            <DemographicsCharts data={ga4Demographics} />
                        </ChartContainer>
                        
                        {/* Deep Dive Analytics */}
                        <h3 className="text-xl font-bold mt-8 mb-4 text-gray-800">Deep Dive Analytics</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            <ChartContainer title="User Stickiness (Retention)">
                                <StickinessCard dateRange={dateRange} />
                            </ChartContainer>
                            <ChartContainer title="Engaged Sessions / User">
                                <EngagedSessionsCard dateRange={dateRange} />
                            </ChartContainer>
                            <ChartContainer title="Active Users by City">
                                <CityTable dateRange={dateRange} />
                            </ChartContainer>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <ChartContainer title="Organic Search Landing Pages">
                                <OrganicLandingTable dateRange={dateRange} />
                            </ChartContainer>
                            <ChartContainer title="Search Queries by Country">
                                <SearchQueriesTable dateRange={dateRange} />
                            </ChartContainer>
                        </div>
                    </>
                )}

                {/* 2. GOOGLE ADS SUB-TAB */}
                {subTab === 'ads' && (
                    <ChartContainer title="Google Ads Performance">
                        <GoogleAdsCharts data={googleAdsData} />
                    </ChartContainer>
                )}

            </div>
          )}
        </div>
      )} 
    </Layout>
  );
}