'use client';
import { useSession } from 'next-auth/react';
import Layout from '@/app/components/Layout';
import { useState, useEffect } from 'react';

export default function WidgetPage() {
    const { data: session } = useSession();
    const [script, setScript] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (session?.user?.email) {
            // This now generates the correct, working script using the user's email as the SITE_ID
            const generatedScript = `
<script>
  (function() {
    const SITE_ID = '${session.user.email}';
    const API_ENDPOINT = 'https://tracker.cortexcart.com/api/track';

    function sendEvent(eventName, data = {}) {
      const eventData = { 
        siteId: SITE_ID, 
        eventName: eventName, 
        data: { 
          ...data, 
          path: window.location.pathname, 
          referrer: document.referrer 
        }
      };
      try { 
        navigator.sendBeacon(API_ENDPOINT, JSON.stringify(eventData)); 
      } catch(e) { 
        fetch(API_ENDPOINT, { 
          method: 'POST', 
          body: JSON.stringify(eventData), 
          keepalive: true 
        }); 
      }
    }

    // Track initial pageview
    sendEvent('pageview');

    // Track all clicks
    document.addEventListener('click', function(e) {
      sendEvent('click', { x: e.pageX, y: e.pageY, screenWidth: window.innerWidth });
    }, true);
    
    // Expose a global track function for custom events
    window.cortexcart = { track: sendEvent };
  })();
</script>
            `;
            setScript(generatedScript.trim());
        }
    }, [session]);

    const handleCopy = () => {
        navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <h1 className="text-3xl font-bold mb-4">Tracking Script</h1>
                <p className="text-gray-600 mb-6">
                    To track visitors and events on your website, copy the code below and paste it into the {'<head>'} section of your website&apos;s HTML.
                </p>
                <div className="bg-gray-800 rounded-lg p-4 relative">
                    <pre className="text-white text-sm overflow-x-auto">
                        <code>{script}</code>
                    </pre>
                    <button
                        onClick={handleCopy}
                        className="absolute top-2 right-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <h2 className="text-2xl font-bold mt-10 mb-4">Custom Event Tracking</h2>
                <p className="text-gray-600 mb-4">
                    To track custom events, such as a successful purchase, you can call the global {'`cortexcart.track()`'} function.
                </p>
                <div className="bg-gray-800 rounded-lg p-4">
                    <pre className="text-white text-sm overflow-x-auto">
                        <code>
                            {`// Example: Track a sale with a value of 49.99
window.cortexcart.track('sale', { value: 49.99, currency: 'USD' });`}
                        </code>
                    </pre>
                </div>
            </div>
        </Layout>
    );
}