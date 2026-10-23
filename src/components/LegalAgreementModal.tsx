import React, { useState } from 'react';
import { X, ShieldAlert, Scale, FileText, CheckCircle2 } from 'lucide-react';

interface LegalAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalAgreementModal: React.FC<LegalAgreementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'acceptable-use' | 'dmca' | 'liability'>('terms');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border-[4px] border-black shadow-brutal-2xl w-full max-w-2xl max-h-[90vh] flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="bg-neo-yellow border-b-[4px] border-black px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-neo-pink text-black border-2 border-black flex items-center justify-center shadow-brutal-sm -rotate-2">
              <Scale className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-black flex items-center gap-1.5">
                License & Legal Agreement
              </h2>
              <span className="text-[11px] font-mono font-bold text-black/70 block">
                ImgLink Platform Terms // Applicable Laws
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-neo-pink hover:bg-neo-red hover:text-white border-2 border-black shadow-brutal-sm active:translate-x-0.5 active:translate-y-0.5 transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-[3px] border-black bg-neo-bg overflow-x-auto text-[11px] font-mono font-black uppercase flex-shrink-0">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-4 py-2.5 border-r-2 border-black transition-colors whitespace-nowrap ${
              activeTab === 'terms' ? 'bg-neo-yellow text-black' : 'hover:bg-white text-black/70'
            }`}
          >
            1. Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('acceptable-use')}
            className={`px-4 py-2.5 border-r-2 border-black transition-colors whitespace-nowrap ${
              activeTab === 'acceptable-use' ? 'bg-neo-cyan text-black' : 'hover:bg-white text-black/70'
            }`}
          >
            2. Acceptable Use
          </button>
          <button
            onClick={() => setActiveTab('dmca')}
            className={`px-4 py-2.5 border-r-2 border-black transition-colors whitespace-nowrap ${
              activeTab === 'dmca' ? 'bg-neo-lime text-black' : 'hover:bg-white text-black/70'
            }`}
          >
            3. DMCA & Copyright
          </button>
          <button
            onClick={() => setActiveTab('liability')}
            className={`px-4 py-2.5 transition-colors whitespace-nowrap ${
              activeTab === 'liability' ? 'bg-neo-pink text-black' : 'hover:bg-white text-black/70'
            }`}
          >
            4. Liability & Indemnity
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 font-mono text-xs text-black leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <div className="bg-neo-yellow/30 border-2 border-black p-3 font-black text-xs uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 stroke-[2.5]" />
                <span>General License & Service Agreement</span>
              </div>
              <p>
                By accessing, authenticating, or uploading any media to ImgLink (imglink.web.id), you enter into a legally binding agreement governed by these terms.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">1.1 Scope of Service</h4>
              <p>
                ImgLink provides direct image-to-URL hosting and delivery services. Uploaded images generate unique URLs for sharing, embedding, or archiving. ImgLink is an infrastructure conduit and does not claim ownership over user-uploaded content.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">1.2 User Ownership & License Grant</h4>
              <p>
                You retain complete intellectual property ownership of your uploaded files. By uploading to ImgLink, you grant ImgLink a limited, worldwide, non-exclusive, royalty-free license solely to host, cache, display, and deliver the media as requested by the user possessing the generated link.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">1.3 Termination & Content Removal</h4>
              <p>
                Users can permanently delete their uploaded media at any time through their account dashboard. ImgLink reserves the right to terminate access or remove any material violating these terms immediately and without notice.
              </p>
            </div>
          )}

          {activeTab === 'acceptable-use' && (
            <div className="space-y-3">
              <div className="bg-neo-pink/30 border-2 border-black p-3 font-black text-xs uppercase flex items-center gap-2 text-black">
                <ShieldAlert className="w-4 h-4 stroke-[2.5]" />
                <span>Acceptable Use Policy // Prohibited Content</span>
              </div>
              <p>
                To maintain a safe platform and prevent legal liabilities, ImgLink enforces strict zero-tolerance policies regarding unlawful content.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">2.1 Absolute Prohibitions</h4>
              <p>You agree not to upload, store, or distribute any material that includes:</p>
              <ul className="list-disc pl-5 space-y-1.5 font-bold">
                <li>Child Sexual Abuse Material (CSAM) or any exploitation of minors.</li>
                <li>Non-consensual sexual imagery, voyeurism, or intimate material published without consent.</li>
                <li>Malware, viruses, ransomware, phishing vectors, or malicious payloads.</li>
                <li>Terrorist propaganda, violent extremism, or credible incitement to physical harm.</li>
                <li>Personal Identifiable Information (PII) distributed for harassment, doxxing, or fraud.</li>
                <li>Stolen, infringing, or counterfeit digital assets.</li>
              </ul>
              <h4 className="font-black text-sm uppercase text-black pt-2">2.2 Mandatory Legal Reporting</h4>
              <p className="bg-neo-pink border-2 border-black p-3 text-[11px] font-bold">
                MANDATORY REPORTING: In the event of CSAM or illegal exploitation materials, ImgLink cooperates unconditionally with law enforcement agencies (NCMEC, Interpol, Kepolisian RI, and international cybercrime units). Associated IP addresses, upload timestamps, and identity records will be preserved and forwarded to authorities.
              </p>
            </div>
          )}

          {activeTab === 'dmca' && (
            <div className="space-y-3">
              <div className="bg-neo-lime/30 border-2 border-black p-3 font-black text-xs uppercase flex items-center gap-2">
                <Scale className="w-4 h-4 stroke-[2.5]" />
                <span>DMCA Notice & Intellectual Property Protection</span>
              </div>
              <p>
                ImgLink respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA) and equivalent international copyright directives.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">3.1 User Warranty</h4>
              <p>
                By uploading any file, you warrant and represent that you own the necessary copyrights, trademarks, or licenses, or that the file is in the public domain. You assume total responsibility for all copyright compliance.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">3.2 Takedown Procedure</h4>
              <p>
                If you are a copyright owner or authorized representative and believe that content hosted on ImgLink infringes your rights, submit a takedown request to our designated agent at <span className="underline font-bold">legal@imglink.web.id</span>.
              </p>
              <p>Your notification must include:</p>
              <ul className="list-disc pl-5 space-y-1 font-bold">
                <li>Identification of the copyrighted work claimed to have been infringed.</li>
                <li>The exact ImgLink URL(s) containing the infringing material.</li>
                <li>Contact information of the complaining party (name, address, email).</li>
                <li>A statement made under penalty of perjury that the claim is accurate.</li>
              </ul>
              <p>Valid takedown requests will be acted upon with expedited removal of the contested material.</p>
            </div>
          )}

          {activeTab === 'liability' && (
            <div className="space-y-3">
              <div className="bg-neo-cyan/30 border-2 border-black p-3 font-black text-xs uppercase flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>Disclaimer of Warranties & Indemnification</span>
              </div>
              <h4 className="font-black text-sm uppercase text-black pt-1">4.1 "As-Is" Service Disclaimer</h4>
              <p>
                ImgLink is provided strictly on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied. ImgLink does not warrant that the service will be uninterrupted, error-free, immune to data loss, or perpetually available. ImgLink is not an archival backup service; users are advised to retain primary backups of all uploaded files.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">4.2 Limitation of Liability</h4>
              <p>
                Under no circumstances shall ImgLink, its developers, administrators, or service providers be liable for direct, indirect, incidental, punitive, or consequential damages resulting from the use, inability to use, or unauthorized access to user-uploaded content.
              </p>
              <h4 className="font-black text-sm uppercase text-black pt-2">4.3 User Indemnification</h4>
              <p className="bg-neo-yellow border-2 border-black p-3 text-[11px] font-bold">
                INDEMNIFICATION CLAUSE: You agree to defend, indemnify, and hold harmless ImgLink, its creators, operators, and hosting partners from and against any claims, liabilities, damages, losses, and legal expenses (including reasonable attorney fees) arising from or connected with your content, your violation of these terms, or your infringement of third-party rights.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t-[3px] border-black p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <span className="text-[11px] font-mono font-bold text-black/70">
            Version 1.0 // Effective October 2026
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-neo-yellow hover:bg-neo-lime active:translate-x-0.5 active:translate-y-0.5 border-2 border-black font-mono font-black text-xs uppercase shadow-brutal-sm transition-all"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
