'use client';
import '@/app/globals.css';
import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import RealTimeClock from './RealTimeClock';
import { 
    ChartPieIcon, Cog6ToothIcon, ArrowRightEndOnRectangleIcon,
    MapIcon, Bars3Icon, XMarkIcon, InformationCircleIcon,
    ChatBubbleLeftRightIcon, ShareIcon, PuzzlePieceIcon, BellIcon, SparklesIcon, ChevronDownIcon, WrenchIcon, DocumentChartBarIcon
} from '@heroicons/react/24/outline';

// --- Sub-component: Top Navigation ---
const TopNav = () => {
    const { data: session, status } = useSession();
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const userDropdownRef = useRef(null);
    const notificationsRef = useRef(null);
    const [aiUsage, setAiUsage] = useState({ used: 0, limit: 0 }); 

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const formatCompact = (num) => Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(num);

    const fetchNotifications = async () => {
        if (status !== 'authenticated') return;
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchNotifications();
            fetch('/api/ai/usage')
                .then(res => res.json())
                .then(data => setAiUsage(data))
                .catch(err => console.error("Failed to load AI usage", err));
            
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [status]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setUserDropdownOpen(false);
            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) setNotificationsOpen(false);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = async (id) => {
        setNotifications(current => current.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id })
        });
        setNotificationsOpen(false);
    };

    if (status !== 'authenticated') return null;

    return (
        <div className="flex items-center justify-between w-full h-full">
            <RealTimeClock />
            <div className="hidden md:flex flex-col items-end mr-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Tokens</div>
                <div className={`text-sm font-bold ${aiUsage.used >= aiUsage.limit ? 'text-red-600' : 'text-blue-600'}`}>
                    {formatCompact(aiUsage.used)} / {formatCompact(aiUsage.limit)}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="relative h-full flex items-center" ref={notificationsRef}>
                    <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 relative">
                        <BellIcon className="h-6 w-6" />
                        {unreadCount > 0 && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>}
                    </button>
                    {notificationsOpen && (
                        <div className="absolute top-full right-0 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            <div className="px-4 py-2 border-b"><p className="text-sm font-medium text-gray-900">Notifications</p></div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? <p className="text-center text-sm text-gray-500 py-4">No new notifications</p> : 
                                notifications.map(notif => <Link key={notif.id} href={notif.link || '#'}><div onClick={() => handleNotificationClick(notif.id)} className={`block px-4 py-3 text-sm hover:bg-gray-100 ${!notif.is_read ? 'bg-blue-50' : ''}`}><p className={!notif.is_read ? 'font-semibold':''}>{notif.message}</p><p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleString()}</p></div></Link>)}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="relative h-full flex items-center" ref={userDropdownRef}>
                    <button onClick={() => setUserDropdownOpen(!userDropdownOpen)} className="flex items-center space-x-2 rounded-full h-full">
                        <span className="text-gray-700 text-sm font-medium hidden sm:block">{session.user.name}</span>
                        <img className="h-8 w-8 rounded-full" src={session.user.image || `https://avatar.vercel.sh/${session.user.email}`} alt="User avatar" />
                    </button>
                    {userDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                            <div className="px-4 py-2 border-b"><p className="text-sm font-medium text-gray-900 truncate">{session.user.name}</p><p className="text-xs text-gray-500 truncate">{session.user.email}</p></div>
                            <a href="/settings" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><Cog6ToothIcon className="h-5 w-5 mr-2" /> Settings</a>
                            <a href="/account" className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg> Account</a>
                            <button onClick={() => signOut({ callbackUrl: '/login' })} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><ArrowRightEndOnRectangleIcon className="h-5 w-5 mr-2" /> Sign Out</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Sub-component: Footer ---
const Footer = () => {
    const footerLinks = [
       { name: 'About', href: 'https://cortexcart.com/pages/about' }, 
       { name: 'Contact', href: 'https://cortexcart.com/pages/contact' },
       { name: 'Terms of Service', href: 'https://cortexcart.com/pages/terms' }, 
       { name: 'Privacy Policy', href: 'https://cortexcart.com/pages/privacy' },
       { name: 'Data Protection', href: 'https://cortexcart.com/pages/data-protection/' },
    ];
    const socialLinks = [
        { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61577780473897', icon: (props) => (<svg fill="currentColor" viewBox="0 0 24 24" {...props}><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.77-1.63 1.562V12h2.773l-.443 2.89h-2.33v7.028C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>) },
        { name: 'Instagram', href: 'https://www.instagram.com/cortexcartai/', icon: (props) => (<svg fill="currentColor" viewBox="0 0 24 24" {...props}><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772A4.902 4.902 0 016.08 2.525c.636-.247 1.363-.416 2.427-.465C9.53 2.013 9.884 2 12.315 2zM12 7a5 5 0 100 10 5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6zm5.25-9.75a1.25 1.25 0 100-2.5 1.25 1.25 0 000 2.5z" clipRule="evenodd" /></svg>) },
        { name: 'X', href: 'https://x.com/JonathanService', icon: (props) => (<svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M13.682 10.623 20.239 3h-1.64l-5.705 6.44L7.65 3H3l6.836 9.753L3 21h1.64l6.082-6.885L16.351 21H21l-7.318-10.377zM14.78 13.968l-.87-1.242L6.155 4.16h2.443l4.733 6.742.87 1.242 7.03 9.98h-2.443l-5.045-7.143z" /></svg>) },
        { name: 'Pinterest', href: 'https://uk.pinterest.com/Cortexcart/', icon: (props) => (<svg fill="currentColor" viewBox="0 0 24 24" {...props}><path d="M12.017 0C5.396 0 .029 5.367.029 12c0 4.137 2.678 7.653 6.333 8.943.02-.19.029-.398.05-.61l.329-1.4a.123.123 0 0 1 .099-.1c.36-.18 1.15-.56 1.15-.56s-.299-.909-.249-1.79c.06-.9.649-2.12 1.459-2.12.68 0 1.2.51 1.2 1.12 0 .68-.43 1.7-.65 2.64-.179.78.379 1.42.919 1.42 1.58 0 2.63-2.1 2.63-4.22 0-1.8-1.12-3.44-3.03-3.44-2.28 0-3.52 1.68-3.52 3.32 0 .61.22 1.25.5 1.62.03.04.04.05.02.13l-.15.65c-.05.2-.14.24-.32.08-1.05-.9-1.5-2.3-1.5-3.82C6.18 5.76 8.35 3 12.33 3c3.22 0 5.59 2.38 5.59 4.91 0 3.22-1.95 5.61-4.79 5.61-.9 0-1.75-.47-2.05-1.02l-.52 2.1c-.24 1.01-1.04 2.45-1.04 2.45s-.28.1-.32.08c-.46-.38-.68-1.2-.55-1.88l.38-1.68c.12-.55-.03-1.2-.5-1.52-1.32-.9-1.9-2.6-1.9-4.22 0-2.28 1.6-4.3 4.6-4.3 2.5 0 4.2 1.8 4.2 4.15 0 2.5-1.55 4.5-3.8 4.5-.75 0-1.45-.38-1.7-.82l-.28-.9c-.1-.4-.2-.8-.2-1.22 0-.9.42-1.68 1.12-1.68.9 0 1.5.8 1.5 1.88 0 .8-.25 1.88-.58 2.8-.25.7-.5 1.4-.5 1.4s-.3.12-.35.1c-.2-.1-.3-.2-.3-.4l.02-1.12z" /></svg>) }
    ];

    return (
        <footer className="bg-white border-t border-gray-200 w-full flex-none">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <nav className="flex flex-wrap justify-center -mx-5 -my-2">
                    {footerLinks.map((link) => (
                        <div key={link.name} className="px-5 py-2"><a href={link.href} className="text-xs text-gray-500 hover:text-gray-900">{link.name}</a></div>
                    ))}
                </nav>
                <div className="mt-4 flex justify-center space-x-6">
                    {socialLinks.map((item) => (
                        <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500" target="_blank" rel="noopener noreferrer">
                            <span className="sr-only">{item.name}</span>
                            <item.icon className="h-5 w-5" aria-hidden="true" />
                        </a>
                    ))}
                </div>
                <p className="mt-4 text-center text-[10px] text-gray-400">
                    &copy; 2025 CortexCart v{process.env.NEXT_PUBLIC_APP_VERSION}. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

const SidebarContent = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isFinancialsMenuOpen, setIsFinancialsMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const getLinkClass = (path) => pathname.startsWith(path) ? 'flex items-center p-2 bg-gray-800 text-gray-200 [&_span]:text-gray-200 [&_svg]:text-gray-200 rounded-lg font-medium transition-colors' : 'flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors font-medium';
  const getSubLinkClass = (path) => pathname.startsWith(path) ? 'text-blue-600 font-bold block py-1' : 'text-gray-600 hover:text-gray-900 block py-1 transition-colors';
  const getParentClass = (childPaths) => childPaths.some(path => pathname.startsWith(path)) ? 'flex items-center justify-between w-full p-2 bg-gray-800 text-gray-200 [&_span]:text-gray-200 [&_svg]:text-gray-200 rounded-lg font-medium transition-colors' : 'flex items-center justify-between w-full p-2 text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors font-medium';

  useEffect(() => {
    if (['/reports', '/recommendations', '/products'].some(p => pathname.startsWith(p))) setIsAiMenuOpen(true);
    if (pathname.startsWith('/financials')) setIsFinancialsMenuOpen(true);
    if (['/experiments', '/heatmaps'].some(p => pathname.startsWith(p))) setIsToolsMenuOpen(true);
  }, [pathname]);

  return (
    <>
      <div className="flex-grow">
        <a href="/" className="flex items-center pb-6 px-2"><h1 className="text-2xl font-bold text-gray-900">CortexCart</h1></a>
        <nav>
          <ul className="space-y-2">
            {session && (
            <> 
                <li><a href="/dashboard" className={getLinkClass('/dashboard')}><ChartPieIcon className="h-6 w-6 mr-3" /><span>Dashboard</span></a></li>
                <li>
                    <button onClick={() => setIsAiMenuOpen(!isAiMenuOpen)} className={getParentClass(['/reports', '/recommendations', '/products'])}>
                        <div className="flex items-center"><SparklesIcon className="h-6 w-6 mr-3" /><span>AI Tools</span></div>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${isAiMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isAiMenuOpen && (
                        <ul className="pt-2 pl-7 mt-1 space-y-2 border-l-2 border-gray-200 ml-4">
                            <li><a href="/reports" className={getSubLinkClass('/reports')}><span>View AI Performance Report</span></a></li>
                            <li><a href="/recommendations" className={getSubLinkClass('/recommendations')}><span>Homepage AI</span></a></li>
                            <li><a href="/products/recommendations" className={getSubLinkClass('/products')}><span>Product AI</span></a></li>
                        </ul>
                    )}
                </li>
                <li><a href="/social" className={getLinkClass('/social')}><ShareIcon className="h-6 w-6 mr-3" /><span>Social Manager</span></a></li>
                <li>
                    <button onClick={() => setIsFinancialsMenuOpen(!isFinancialsMenuOpen)} className={getParentClass(['/financials'])}>
                        <div className="flex items-center"><DocumentChartBarIcon className="h-6 w-6 mr-3" /><span>Financials</span></div> 
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${isFinancialsMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isFinancialsMenuOpen && (
                        <ul className="pt-2 pl-7 mt-1 space-y-2 border-l-2 border-gray-200 ml-4">
                            <li><a href="/financials/quickbooks" className={getSubLinkClass('/financials/quickbooks')}><span>QuickBooks</span></a></li>
                            <li><a href="/financials/shopify" className={getSubLinkClass('/financials/shopify')}><span>Shopify</span></a></li>
                        </ul>
                    )}
                </li>
                <li>
                    <button onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)} className={getParentClass(['/experiments', '/heatmaps'])}>
                        <div className="flex items-center"><WrenchIcon className="h-6 w-6 mr-3" /><span>Experiment Tools</span></div>
                        <ChevronDownIcon className={`h-5 w-5 transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isToolsMenuOpen && (
                        <ul className="pt-2 pl-7 mt-1 space-y-2 border-l-2 border-gray-200 ml-4">
                            <li><a href="/experiments" className={getSubLinkClass('/experiments')}><span>A/B Testing</span></a></li>
                            <li><a href="/heatmaps" className={getSubLinkClass('/heatmaps')}><span>Heatmaps</span></a></li>
                        </ul>
                    )}
                </li>
                <li className="pt-4 border-t border-gray-200 mt-4"><span className="px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Help & Support</span></li>
                <li><a href="/support" className={getLinkClass('/support')}><PuzzlePieceIcon className="h-6 w-6 mr-3" /><span>Support</span></a></li>
                <li className="pt-4 border-t border-gray-200 mt-4"><span className="px-2 text-xs font-bold text-gray-500 uppercase tracking-wider">General</span></li>
                <li><a href="/roadmap" className={getLinkClass('/roadmap')}><MapIcon className="h-6 w-6 mr-3" /><span>Roadmap</span></a></li>
                <li><a href="/notifications" className={getLinkClass('/notifications')}><BellIcon className="h-6 w-6 mr-3" /><span>Notifications</span></a></li>
            </>
            )}
          </ul>
        </nav>
      </div>
      <div>
        {session && (
          <div className="mb-4 text-sm px-2"><p className="font-bold text-gray-900">{session.user.name}</p><p className="text-gray-600 truncate">{session.user.email}</p></div>
        )}
        <Link href={session ? '#' : '/login'} onClick={() => session && signOut({ callbackUrl: '/' })} className="w-full flex items-center p-2 text-gray-700 hover:bg-gray-200 hover:text-gray-900 rounded-lg transition-colors font-medium">
          <ArrowRightEndOnRectangleIcon className="h-6 w-6 mr-3" /><span>{session ? 'Sign Out' : 'Sign In'}</span>
        </Link>
      </div>
    </>
  );
};

// --- Sub-component: Beta Banner ---
const BetaBanner = () => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;
    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg">
            <div className="flex">
                <div className="flex-shrink-0"><InformationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" /></div>
                <div className="ml-3"><p className="text-sm text-yellow-700">This is a beta release. Some features may not work as expected. Please use the feedback button to report any issues.</p></div>
                <div className="ml-auto pl-3"><div className="-mx-1.5 -my-1.5">
                    <button type="button" onClick={() => setIsVisible(false)} className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600">
                        <span className="sr-only">Dismiss</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div></div>
            </div>
        </div>
    );
};

// --- Sub-component: Feedback Button ---
const FeedbackButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [subject, setSubject] = useState('bug');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle');
    const [statusMessage, setStatusMessage] = useState('');

    const feedbackSubjects = {
        'bug': 'Please describe the bug in as much detail as possible, including the steps you took to make it happen.',
        'feature': 'Please describe the new feature you\'d like to see and why it would be helpful.',
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('sending');
        setStatusMessage('');
        try {
            const res = await fetch('/api/feedback/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, message })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'An unknown error occurred.');
            setStatus('success');
            setStatusMessage('Thank you! Your feedback has been sent.');
            setMessage('');
            setTimeout(() => { setIsOpen(false); setStatus('idle'); }, 2000);
        } catch (error) {
            setStatus('error');
            setStatusMessage(error.message);
        }
    };

    if (!isOpen) {
        return <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 z-50"><ChatBubbleLeftRightIcon className="h-6 w-6" /></button>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center" aria-modal="true">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsOpen(false)}></div>
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl transform transition-all sm:my-8">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">Submit Feedback</h3>
                        <p className="mt-1 text-sm text-gray-500">We appreciate your help in making our app better!</p>
                    </div>
                    <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subject</label>
                        <select id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md">
                            <option value="bug">Bug Report</option>
                            <option value="feature">Feature Request</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                        <div className="mt-1">
                            <p className="text-xs text-gray-500 mb-2">{feedbackSubjects[subject]}</p>
                            <textarea id="message" name="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm p-2 focus:ring-blue-500 focus:border-blue-500" required></textarea>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <button type="submit" disabled={status === 'sending'} className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                            {status === 'sending' ? 'Sending...' : 'Submit Feedback'}
                        </button>
                        <button type="button" onClick={() => setIsOpen(false)} className="text-sm font-medium text-gray-700 hover:text-gray-900">Cancel</button>
                    </div>
                    {statusMessage && (<p className={`text-sm ${status === 'error' ? 'text-red-600' : 'text-green-600'}`}>{statusMessage}</p>)}
                </form>
            </div>
        </div>
    );
};

// --- Main Layout Component ---
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Note: Since we moved scrolling to the <main> tag, we need to detect scroll THERE, not on window.
  const mainRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
        if (mainRef.current) {
            setIsScrolled(mainRef.current.scrollTop > 0);
        }
    };
    
    const mainElement = mainRef.current;
    if (mainElement) {
        mainElement.addEventListener('scroll', handleScroll);
    }
    return () => {
        if (mainElement) mainElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="relative h-screen flex bg-gray-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0 w-64 bg-white p-4 flex-col border-r border-gray-200">
        <SidebarContent />
      </aside>
      
      {/* Right Side Wrapper: No Scrolling Here */}
      <div className="flex-1 flex flex-col w-0 h-full overflow-hidden">
        
        {/* Header: Always at Top */}
        <div className={`flex-none sticky top-0 z-10 flex h-16 bg-white shadow ${isScrolled ? 'shadow-md' : 'shadow-sm'}`}>
            <button onClick={() => setSidebarOpen(true)} className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none lg:hidden">
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 sm:px-6 md:px-8 flex justify-end">
                <TopNav />
            </div>
        </div>

        {/* Main Content: This is the ONLY thing that scrolls */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gray-100 relative z-0">
            <BetaBanner />
            {children}
        </main>

        {/* Footer: Always at Bottom (Outside of Main) */}
        <Footer />
        
      </div>

      {/* Mobile Sidebar Flyout */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setSidebarOpen(false)}></div>
        <div className={`relative max-w-xs w-full bg-white h-full flex flex-col p-4 transition-transform transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <button onClick={() => setSidebarOpen(false)} className="absolute top-2 right-2 text-gray-400"><XMarkIcon className="h-6 w-6"/></button>
            <SidebarContent />
        </div>
      </div>
      
      <FeedbackButton />
    </div>
  );
};

export default Layout;