'use client'
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

const SocialLinks = () => {
    // FIX: Corrected the structure and removed the parsing error
    const socialMedia = [
        { name: 'Facebook', icon: FaFacebook, href: '#' },
        { name: 'Twitter', icon: FaTwitter, href: '#' },
        { name: 'Instagram', icon: FaInstagram, href: '#' },
        { name: 'LinkedIn', icon: FaLinkedin, href: '#' },
        { name: 'YouTube', icon: FaYoutube, href: '#' },
    ];

    return (
        <div className="flex justify-center space-x-6">
            {socialMedia.map((item) => (
                <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-500">
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                </a>
            ))}
        </div>
    );
};

export default SocialLinks;