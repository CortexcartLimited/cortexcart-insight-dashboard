// File: src/app/license/page.jsx

'use client';

import { useEffect } from 'react';
import Layout from '@/app/components/Layout';

export default function License() {
    
    // This hook runs the interactive script after the page has loaded
    useEffect(() => {
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('main > div[id]');
        
        function updateActiveLink() {
            let currentSectionId = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (window.scrollY >= sectionTop - 100) {
                    currentSectionId = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        }

        const summaryCards = document.querySelectorAll('.summary-card');
        summaryCards.forEach(card => {
            card.addEventListener('click', () => {
                const targetId = card.dataset.target;
                if (targetId) {
                    const detailTarget = document.getElementById(targetId + '-detail') || document.getElementById(targetId);
                    if(detailTarget && detailTarget.classList.contains('full-text')){
                        detailTarget.classList.toggle('open');
                    }
                }
            });
        });

        window.addEventListener('scroll', updateActiveLink);
        updateActiveLink(); // Initial check

        // Cleanup function to remove the event listener
        return () => {
            window.removeEventListener('scroll', updateActiveLink);
        };
    }, []);


    return (
        <Layout>
            <div className="min-h-screen lg:flex">
                <nav className="w-full lg:w-64 xl:w-72 bg-white lg:h-screen lg:sticky top-16 border-b lg:border-b-0 lg:border-r border-slate-200">
                    <div className="p-4 lg:p-6">
                        <h1 className="text-xl font-bold text-slate-900">CortexCart EULA</h1>
                        <p className="text-sm text-slate-500 mt-1">Interactive Agreement</p>
                    </div>
                    <ul className="p-2 lg:p-4 space-y-1">
                        <li><a href="#summary" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">⚖️</span> Key Takeaways
                        </a></li>
                        <li><a href="#license" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">✅</span> What You CAN Do
                        </a></li>
                        <li><a href="#restrictions" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">❌</span> What You CANNOT Do
                        </a></li>
                        <li><a href="#ip" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">©️</span> Intellectual Property
                        </a></li>
                        <li><a href="#liability" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">⚠️</span> Disclaimers & Liability
                        </a></li>
                        <li><a href="#legal" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">🌍</span> Law & Jurisdiction
                        </a></li>
                        <li><a href="#full-text" className="nav-link flex items-center px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg">
                            <span className="mr-3 text-lg">📜</span> Full Agreement
                        </a></li>
                    </ul>
                    <div className="p-4 lg:p-6 mt-4 lg:mt-8 border-t border-slate-200">
                        <p className="text-xs text-slate-500">This is an interactive guide. The <a href="#full-text" className="font-medium text-slate-700 hover:underline">Full Agreement</a> is the legally binding document.</p>
                    </div>
                </nav>

                <main className="flex-1 p-4 sm:p-6 lg:p-10">
                    <div id="summary" className="scroll-mt-20">
                        <h2 className="text-3xl font-bold text-slate-900">Agreement at a Glance</h2>
                        <p className="mt-2 text-slate-600 max-w-3xl">This is a simplified summary of the End-User License Agreement for the **CortexCart Insight Dashboard**. This summary is for convenience and does not replace the full legal agreement. Click on any card to see the full legal text for that point.</p>
                        
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="summary-card bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:border-slate-300" data-target="full-license-detail">
                                <h3 className="font-semibold text-slate-900">Limited License</h3>
                                <p className="text-sm text-slate-500 mt-2">You are granted a license to use one copy of the software on a single device for your own business purposes.</p>
                            </div>
                            <div className="summary-card bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:border-slate-300" data-target="full-restrict-1">
                                <h3 className="font-semibold text-slate-900">No Copying or Reselling</h3>
                                <p className="text-sm text-slate-500 mt-2">You cannot copy, sell, redistribute, or modify the software without written permission.</p>
                            </div>
                            <div className="summary-card bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:border-slate-300" data-target="full-ip-detail">
                                <h3 className="font-semibold text-slate-900">We Own the Software</h3>
                                <p className="text-sm text-slate-500 mt-2">Jonathan B Service owns all intellectual property rights. You are only licensing its use.</p>
                            </div>
                            <div className="summary-card bg-red-50 p-6 rounded-xl border border-red-200 hover:shadow-lg hover:border-red-300" data-target="full-liability-detail">
                                <h3 className="font-semibold text-red-900">Use &quote;As Is&quote;</h3>
                                <p className="text-sm text-red-700 mt-2">The software is provided without warranties. The licensor is not liable for damages from its use.</p>
                            </div>
                            <div className="summary-card bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:border-slate-300" data-target="full-termination">
                                <h3 className="font-semibold text-slate-900">Termination</h3>
                                <p className="text-sm text-slate-500 mt-2">Your license can be terminated if you breach the agreement, requiring you to delete the software.</p>
                            </div>
                            <div className="summary-card bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg hover:border-slate-300" data-target="full-law-detail">
                                <h3 className="font-semibold text-slate-900">Governing Law</h3>
                                <p className="text-sm text-slate-500 mt-2">The agreement is governed by the laws of England and Wales.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-slate-200 scroll-mt-20" id="license">
                                       <h2 class="text-2xl font-bold text-slate-900">✅ What You CAN Do (Grant of License)</h2>
                <p class="mt-2 text-slate-600 max-w-3xl">This section details the rights granted to you as a licensee. Your use of the software is limited to these specific permissions. Click the card to read the full clause.</p>
                <div class="mt-6">
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-license-detail">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Install and Use the Software</h3>
                           <p class="mt-2 text-slate-500">Upon acceptance, you receive a non-exclusive, non-transferable, revocable, and limited license. This allows you to install and use a single copy of the CortexCart Insight Dashboard on one device strictly for your internal business operations.</p>
                        </div>
                        <div id="full-license-detail" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 2</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">Upon your acceptance of this EULA, the Licensor grants you a non-exclusive, non-transferable, revocable, limited license to install and use one copy of the Software on a single device for your internal business purposes.</blockquote>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-16 pt-8 border-t border-slate-200 scroll-mt-20" id="restrictions">
                <h2 class="text-2xl font-bold text-slate-900">❌ What You CANNOT Do (Restrictions & Prohibitions)</h2>
                <p class="mt-2 text-slate-600 max-w-3xl">This section is critical. It outlines activities that are strictly forbidden. Violating these terms constitutes a material breach of the agreement and can lead to the termination of your license. Click each restriction to see its full legal definition.</p>
                 <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-restrict-1">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Do Not Copy or Redistribute</h3>
                           <p class="mt-2 text-slate-500">You cannot copy, sell, rent, lease, sublicense, or otherwise transfer the software to anyone without explicit written consent.</p>
                        </div>
                        <div id="full-restrict-1" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 3a</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">Copy, sell, rent, lease, sublicense, distribute, or otherwise transfer the Software or any of its components to any third party without the prior written consent of the Licensor.</blockquote>
                        </div>
                    </div>
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-restrict-2">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Do Not Modify</h3>
                           <p class="mt-2 text-slate-500">You are not allowed to modify, adapt, translate, or create derivative works from the software.</p>
                        </div>
                        <div id="full-restrict-2" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 3b</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">Modify, adapt, translate, or create derivative works based upon the Software.</blockquote>
                        </div>
                    </div>
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-restrict-3">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Do Not Reverse Engineer</h3>
                           <p class="mt-2 text-slate-500">You cannot decompile, disassemble, or attempt to discover the source code of the software.</p>
                        </div>
                        <div id="full-restrict-3" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 3c</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Software, except and only to the extent that such activity is expressly permitted by applicable law notwithstanding this limitation.</blockquote>
                        </div>
                    </div>
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-restrict-4">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Do Not Use for Harmful Acts</h3>
                           <p class="mt-2 text-slate-500">Using the software for anything unlawful, fraudulent, or harmful is strictly prohibited.</p>
                        </div>
                        <div id="full-restrict-4" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 3d</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">Use the Software in any way that is unlawful, fraudulent, or harmful, or in connection with any unlawful, fraudulent, or harmful purpose or activity. This includes, but is not limited to, using the Software to transmit any material that is defamatory, obscene, or offensive, or that infringes on the intellectual property rights of any third party.</blockquote>
                        </div>
                    </div>
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-restrict-5">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Do Not Damage Our Reputation</h3>
                           <p class="mt-2 text-slate-500">You must not use the software in a way that could damage the reputation of CortexCart or Jonathan B Service.</p>
                        </div>
                        <div id="full-restrict-5" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 3e</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">Use the Software in any manner that could damage, disable, overburden, or impair the reputation of &quote;CortexCart&quote;, &quote;cortexcart.com&quote;, the &quote;CortexCart Insight Dashboard&quote;, or &quote;Jonathan B Service&quote;.</blockquote>
                        </div>
                    </div>
                 </div>
            </div>

             <div class="mt-16 pt-8 border-t border-slate-200 scroll-mt-20" id="ip">
                <h2 class="text-2xl font-bold text-slate-900">©️ Intellectual Property</h2>
                <p class="mt-2 text-slate-600 max-w-3xl">This section clarifies the ownership of the software. The EULA grants you a license to use the software, not ownership of it.</p>
                <div class="mt-6">
                     <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-ip-detail">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Ownership of Software</h3>
                           <p class="mt-2 text-slate-500">You acknowledge that all rights, titles, and interests in the Software, including copyrights, patents, and trademarks, are the exclusive property of Jonathan B Service. This agreement gives you no ownership rights.</p>
                        </div>
                        <div id="full-ip-detail" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 4</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">You acknowledge that the Software and all intellectual property rights therein (including but not limited to copyright, patents, and trademarks) are the exclusive property of Jonathan B Service. This EULA does not grant you any ownership rights in the Software. All rights not expressly granted are reserved by the Licensor. The &quote;CortexCart&quote; name, logo, and the &quote;CortexCart Insight Dashboard&quote; name are trademarks of the Licensor.</blockquote>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-16 pt-8 border-t border-slate-200 scroll-mt-20" id="liability">
                <h2 class="text-2xl font-bold text-slate-900">⚠️ Disclaimers & Limitation of Liability</h2>
                <p class="mt-2 text-slate-600 max-w-3xl">This is a critical legal section outlining that the software is provided &quote;as is&quote; and setting limits on the licensor&apos;s liability in case of any issues.</p>
                 <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="summary-card bg-amber-50 rounded-xl border border-amber-200" data-target="full-warranty">
                        <div class="p-6">
                           <h3 class="font-semibold text-amber-900">Disclaimer of Warranty</h3>
                           <p class="mt-2 text-amber-800">The software is provided &quote;AS IS&quote; without any kind of warranty. You assume the entire risk related to its quality and performance.</p>
                        </div>
                        <div id="full-warranty" class="full-text bg-amber-100/50 px-6 pb-6 rounded-b-xl border-t border-amber-200">
                             <h4 class="font-semibold text-amber-900 pt-4">Full Legal Text: Section 6</h4>
                             <blockquote class="mt-2 text-sm text-amber-800 italic border-l-2 border-amber-300 pl-4">THE SOFTWARE IS PROVIDED &quote;AS IS&quote; WITHOUT WARRANTY OF ANY KIND. THE LICENSOR DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE SOFTWARE IS WITH YOU.</blockquote>
                        </div>
                    </div>
                    <div class="summary-card bg-red-50 rounded-xl border border-red-200" data-target="full-liability-detail">
                        <div class="p-6">
                           <h3 class="font-semibold text-red-900">Limitation of Liability</h3>
                           <p class="mt-2 text-red-800">The licensor will not be liable for any damages (including lost profits or data) arising from the use of the software. Liability is limited to the amount you paid for the software.</p>
                        </div>
                        <div id="full-liability-detail" class="full-text bg-red-100/50 px-6 pb-6 rounded-b-xl border-t border-red-200">
                             <h4 class="font-semibold text-red-900 pt-4">Full Legal Text: Section 7</h4>
                             <blockquote class="mt-2 text-sm text-red-800 italic border-l-2 border-red-300 pl-4">IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR ANY OTHER PECUNIARY LOSS) ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE, EVEN IF THE LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN ANY CASE, THE LICENSOR&apos;S ENTIRE LIABILITY UNDER ANY PROVISION OF THIS EULA SHALL BE LIMITED TO THE AMOUNT ACTUALLY PAID BY YOU FOR THE SOFTWARE.</blockquote>
                        </div>
                    </div>
                 </div>
            </div>
            
            <div class="mt-16 pt-8 border-t border-slate-200 scroll-mt-20" id="legal">
                <h2 class="text-2xl font-bold text-slate-900">🌍 Governing Law & Jurisdiction</h2>
                <p class="mt-2 text-slate-600 max-w-3xl">This section specifies the legal framework that governs the agreement and how international use is handled.</p>
                <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-law-detail">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">Governing Law</h3>
                           <p class="mt-2 text-slate-500">This agreement is governed by the laws of England and Wales, and disputes will be handled in their courts.</p>
                        </div>
                        <div id="full-law-detail" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 8</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">This EULA shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising out of or in connection with this EULA shall be subject to the exclusive jurisdiction of the courts of England and Wales.</blockquote>
                        </div>
                    </div>
                     <div class="summary-card bg-white rounded-xl border border-slate-200" data-target="full-intl-detail">
                        <div class="p-6">
                           <h3 class="font-semibold text-slate-900">International Use</h3>
                           <p class="mt-2 text-slate-500">If you use the software outside the UK, you must comply with all applicable local and international laws.</p>
                        </div>
                        <div id="full-intl-detail" class="full-text bg-slate-50 px-6 pb-6 rounded-b-xl border-t border-slate-200">
                             <h4 class="font-semibold text-slate-800 pt-4">Full Legal Text: Section 9</h4>
                             <blockquote class="mt-2 text-sm text-slate-600 italic border-l-2 border-slate-300 pl-4">While this agreement is governed by the laws of England and Wales, you agree to comply with all applicable local and international laws and regulations regarding the download, installation, and use of the Software. You agree that you will not export or re-export the Software in violation of any applicable laws or regulations.</blockquote>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-16 pt-8 border-t border-slate-200 scroll-mt-20" id="full-text">
                <h2 class="text-3xl font-bold text-slate-900">📜 Full End-User License Agreement</h2>
                <p class="mt-2 text-slate-600 max-w-3xl">This is the complete and legally binding agreement. The sections below are provided for full legal reference.</p>
                <div class="mt-8 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 prose prose-slate max-w-none">
                    <p class="font-semibold">IMPORTANT: PLEASE READ THIS END-USER LICENSE AGREEMENT CAREFULLY.</p>
                    <p>This End-User License Agreement (&quote;EULA&quote;) is a legal agreement between you (either an individual or a single entity) and <strong>Jonathan B Service</strong> (&quote;the Licensor&quote;), the sole owner of the intellectual property for the software application known as the <strong>CortexCart Insight Dashboard</strong> (&quote;the Software&quote;).</p>
                    <p>By installing, copying, or otherwise using the Software, you agree to be bound by the terms of this EULA. If you do not agree to the terms of this EULA, do not install or use the Software.</p>
                    <p class="text-sm"><strong>DISCLAIMER:</strong> This EULA was generated by a large language model. The author of this EULA is not a solicitor or a lawyer and this document does not constitute legal advice. You should consult with a qualified legal professional to ensure this EULA meets your specific needs and is enforceable in your jurisdiction.</p>

                    <h3 id="full-definitions">1. Definitions</h3>
                    <ul>
                        <li><strong>&quote;Software&quote;</strong> refers to the CortexCart Insight Dashboard application, including any associated media, printed materials, and &quote;online&quote; or electronic documentation.</li>
                        <li><strong>&quote;Licensor&quote;</strong> refers to Jonathan B Service, the creator and intellectual property owner of the Software.</li>
                        <li><strong>&quote;CortexCart&quote;</strong> refers to the brand associated with the Software. The website for the brand is cortexcart.com.</li>
                        <li><strong>&quote;You&quote;</strong> or <strong>&quote;Licensee&quote;</strong> refers to the individual or entity that has acquired a license to use the Software.</li>
                    </ul>

                    <h3 id="full-license">2. Grant of License</h3>
                    <p>Upon your acceptance of this EULA, the Licensor grants you a non-exclusive, non-transferable, revocable, limited license to install and use one copy of the Software on a single device for your internal business purposes.</p>

                    <h3 id="full-restrictions">3. Restrictions and Prohibitions</h3>
                    <p>You expressly agree that you shall not, and shall not permit others to:</p>
                    <ol type="a">
                        <li><strong>Copy or Redistribute:</strong> Copy, sell, rent, lease, sublicense, distribute, or otherwise transfer the Software or any of its components to any third party without the prior written consent of the Licensor.</li>
                        <li><strong>Modify or Create Derivative Works:</strong> Modify, adapt, translate, or create derivative works based upon the Software.</li>
                        <li><strong>Reverse Engineer:</strong> Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Software, except and only to the extent that such activity is expressly permitted by applicable law notwithstanding this limitation.</li>
                        <li><strong>Harmful Use:</strong> Use the Software in any way that is unlawful, fraudulent, or harmful, or in connection with any unlawful, fraudulent, or harmful purpose or activity. This includes, but is not limited to, using the Software to transmit any material that is defamatory, obscene, or offensive, or that infringes on the intellectual property rights of any third party.</li>
                        <li><strong>Damage Reputation:</strong> Use the Software in any manner that could damage, disable, overburden, or impair the reputation of &quote;CortexCart&quote;, &quote;cortexcart.com&quote;, the &quote;CortexCart Insight Dashboard&quote;, or &quote;Jonathan B Service&quote;.</li>
                    </ol>
                    <p>Any use of the Software in violation of these restrictions shall be considered a material breach of this EULA and may result in the immediate termination of your license.</p>

                    <h3 id="full-ip">4. Intellectual Property</h3>
                    <p>You acknowledge that the Software and all intellectual property rights therein (including but not limited to copyright, patents, and trademarks) are the exclusive property of Jonathan B Service. This EULA does not grant you any ownership rights in the Software. All rights not expressly granted are reserved by the Licensor. The &quote;CortexCart&quote; name, logo, and the &quote;CortexCart Insight Dashboard&quote; name are trademarks of the Licensor.</p>

                    <h3 id="full-termination">5. Termination</h3>
                    <p>This EULA is effective until terminated. Your rights under this license will terminate automatically without notice from the Licensor if you fail to comply with any term(s) of this EULA. Upon termination of the EULA, you shall cease all use of the Software and destroy all copies, full or partial, of the Software.</p>

                    <h3 id="full-warranty-main">6. Disclaimer of Warranty</h3>
                    <p>THE SOFTWARE IS PROVIDED &quote;AS IS&quote; WITHOUT WARRANTY OF ANY KIND. THE LICENSOR DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE SOFTWARE IS WITH YOU.</p>

                    <h3 id="full-liability">7. Limitation of Liability</h3>
                    <p>IN NO EVENT SHALL THE LICENSOR BE LIABLE FOR ANY SPECIAL, INCIDENTAL, INDIRECT, OR CONSEQUENTIAL DAMAGES WHATSOEVER (INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOSS OF BUSINESS PROFITS, BUSINESS INTERRUPTION, LOSS OF BUSINESS INFORMATION, OR ANY OTHER PECUNIARY LOSS) ARISING OUT OF THE USE OF OR INABILITY TO USE THE SOFTWARE, EVEN IF THE LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. IN ANY CASE, THE LICENSOR&apos;S ENTIRE LIABILITY UNDER ANY PROVISION OF THIS EULA SHALL BE LIMITED TO THE AMOUNT ACTUALLY PAID BY YOU FOR THE SOFTWARE.</p>

                    <h3 id="full-legal-main">8. Governing Law and Jurisdiction</h3>
                    <p>This EULA shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising out of or in connection with this EULA shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>

                    <h3 id="full-international">9. International Use</h3>
                    <p>While this agreement is governed by the laws of England and Wales, you agree to comply with all applicable local and international laws and regulations regarding the download, installation, and use of the Software. You agree that you will not export or re-export the Software in violation of any applicable laws or regulations.</p>

                    <h3>10. General Provisions</h3>
                    <ol type="a">
                        <li><strong>Severability:</strong> If any provision of this EULA is held to be unenforceable, the remaining provisions shall remain in full force and effect.</li>
                        <li><strong>Entire Agreement:</strong> This EULA constitutes the entire agreement between you and the Licensor relating to the Software and supersedes all prior or contemporaneous oral or written communications, proposals, and representations with respect to the Software.</li>
                        <li><strong>No Waiver:</strong> No failure to exercise, and no delay in exercising, on the part of either party, any right or any power hereunder shall operate as a waiver thereof, nor shall any single or partial exercise of any right or power hereunder preclude further exercise of that or any other right hereunder.</li>
                    </ol>

                    <p class="mt-8">By accepting this EULA, you acknowledge that you have read this agreement, understand it, and agree to be bound by its terms and conditions.</p>
                </div>
                    </div>
                   
                </main>
            </div>

            <style jsx>{`
                .nav-link.active {
                    background-color: #e2e8f0;
                    color: #1e293b;
                    font-weight: 600;
                }
                .summary-card {
                    transition: all 0.3s ease-in-out;
                    cursor: pointer;
                }
                .full-text {
                    display: none;
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.5s ease-in-out, margin-top 0.5s ease-in-out;
                }
                .full-text.open {
                    display: block;
                    max-height: 1000px; /* Adjust as needed */
                    margin-top: 1rem;
                }
            `}</style>
        </Layout>
    );
}