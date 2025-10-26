import { ContactInfo, ShareableCertificate, CleanCertificateData } from '@/types/certificates';

export const contactInfoList: ContactInfo[] = [
  {
    recipientName: "Robert Adamo",
    email: "robert.adamo@example.com",
    phone: "+1234567890",
    whatsapp: "+1234567890",
    facebook: "https://facebook.com/robertadamo",
    linkedin: "https://linkedin.com/in/robertadamo",
    twitter: "https://twitter.com/robertadamo",
    preferredMethod: 'whatsapp'
  },
  // duplicate name (different email) — useful to test ambiguity handling
  {
    recipientName: "Robert Adamo",
    email: "robert.adamo2@example.com",
    phone: "+1234500000",
    whatsapp: "+1234500000",
    facebook: "https://facebook.com/robertadamo.official",
    linkedin: "https://linkedin.com/in/robertadamo2",
    twitter: "https://twitter.com/robertadamo2",
    preferredMethod: 'email'
  },
  {
    recipientName: "Bob Smith",
    email: "bob.smith@example.com",
    phone: "+1234567891",
    whatsapp: "+1234567891",
    facebook: "https://facebook.com/bobsmith",
    linkedin: "https://linkedin.com/in/bobsmith",
    preferredMethod: 'email'
  },
  // duplicate Bob Smith with a work email
  {
    recipientName: "Bob Smith",
    email: "bob.smith.work@example.com",
    phone: "+1234599999",
    whatsapp: "+1234599999",
    facebook: "https://facebook.com/bobsmith.work",
    linkedin: "https://linkedin.com/in/bobsmith-work",
    preferredMethod: 'whatsapp'
  },
  {
    recipientName: "Alice Johnson",
    email: "alice.johnson@example.com",
    phone: "+1234567892",
    whatsapp: "+1234567892",
    facebook: "https://facebook.com/alicejohnson",
    linkedin: "https://linkedin.com/in/alicejohnson",
    twitter: "https://twitter.com/alicejohnson",
    preferredMethod: 'whatsapp'
  },
  // duplicate Alice (alternate email/profile)
  {
    recipientName: "Alice Johnson",
    email: "alice.johnson_alt@example.com",
    phone: "+1234567000",
    whatsapp: "+1234567000",
    facebook: "https://facebook.com/alice.j",
    linkedin: "https://linkedin.com/in/alicejohnson-alt",
    preferredMethod: 'email'
  },
  {
    recipientName: "Charlie Brown",
    email: "charlie.brown@example.com",
    phone: "+1234567893",
    whatsapp: "+1234567893",
    facebook: "https://facebook.com/charliebrown",
    linkedin: "https://linkedin.com/in/charliebrown",
    preferredMethod: 'facebook'
  },
  // another Charlie with different email
  {
    recipientName: "Charlie Brown",
    email: "charlie.brown2@example.com",
    phone: "+1234567111",
    whatsapp: "+1234567111",
    facebook: "https://facebook.com/charlie.brown2",
    linkedin: "https://linkedin.com/in/charliebrown2",
    preferredMethod: 'facebook'
  },
  {
    recipientName: "Diana Prince",
    email: "diana.prince@example.com",
    phone: "+1234567894",
    whatsapp: "+1234567894",
    facebook: "https://facebook.com/dianaprince",
    linkedin: "https://linkedin.com/in/dianaprince",
    preferredMethod: 'email'
  },
  {
    recipientName: "Fiona Gallagher",
    email: "fiona.gallagher@example.com",
    phone: "+1234567895",
    whatsapp: "+1234567895",
    facebook: "https://facebook.com/fionagallagher",
    linkedin: "https://linkedin.com/in/fionagallagher",
    preferredMethod: 'whatsapp'
  },
  {
    recipientName: "George Martin",
    email: "george.martin@example.com",
    phone: "+1234567896",
    whatsapp: "+1234567896",
    facebook: "https://facebook.com/georgemartin",
    linkedin: "https://linkedin.com/in/georgemartin",
    preferredMethod: 'whatsapp'
  },
  {
    recipientName: "Helen Carter",
    email: "helen.carter@example.com",
    phone: "+1234567897",
    whatsapp: "+1234567897",
    facebook: "https://facebook.com/helencarter",
    linkedin: "https://linkedin.com/in/helencarter",
    twitter: "https://twitter.com/helencarter",
    preferredMethod: 'facebook'
  },
  {
    recipientName: "Ian Wright",
    email: "ian.wright@example.com",
    phone: "+1234567898",
    whatsapp: "+1234567898",
    facebook: "https://facebook.com/ianwright",
    linkedin: "https://linkedin.com/in/ianwright",
    preferredMethod: 'whatsapp'
  }
];


// Helper function to find contact info by recipient name
export function getContactInfoByEmail(email: string): ContactInfo | undefined {
  return contactInfoList.find(contact =>
    (contact.email ?? "").toLowerCase() === email.toLowerCase()
  );
}


// WhatsApp sharing
export function getWhatsAppShareLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

// Facebook Messenger sharing (direct messaging)
export function getFacebookMessengerLink(phoneOrUsername: string, message: string): string {
  const encodedMessage = encodeURIComponent(message);
  // For phone numbers (if you have them)
  if (phoneOrUsername.startsWith('+')) {
    return `https://m.me/${phoneOrUsername.replace('+', '')}?text=${encodedMessage}`;
  }
  // For Facebook usernames or profile URLs
  const username = phoneOrUsername.replace('https://facebook.com/', '').replace('https://www.facebook.com/', '');
  return `https://m.me/${username}?text=${encodedMessage}`;
}

// Facebook sharing (public post sharing)
export function getFacebookShareLink(message: string, url?: string): string {
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  
  if (url) {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
  }
  
  return `https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`;
}

// LinkedIn sharing
export function getLinkedInShareLink(message: string, url?: string): string {
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  
  if (url) {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedMessage}`;
  }
  
  return `https://www.linkedin.com/sharing/share-offsite/?summary=${encodedMessage}`;
}

// Twitter sharing
export function getTwitterShareLink(message: string, url?: string): string {
  const encodedMessage = encodeURIComponent(message);
  const encodedUrl = url ? encodeURIComponent(url) : '';
  
  if (url) {
    return `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
  }
  
  return `https://twitter.com/intent/tweet?text=${encodedMessage}`;
}

// Email sharing
export function getEmailShareLink(
  email: string, 
  certificate: CleanCertificateData, 
  downloadUrl?: string
): string {
  const subject = `Your Certificate: ${certificate.programName}`;
  const body = getCertificateShareMessage(certificate, downloadUrl);
  
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Certificate message template
export function getCertificateShareMessage(certificate: CleanCertificateData, downloadUrl?: string): string {
  const baseMessage = `🎓 Certificate of Achievement

Congratulations ${certificate.recipientName}!

You have successfully completed: ${certificate.programName}

Organization: ${certificate.organization}
Category: ${certificate.category}
${certificate.fieldOfInterest ? `Field: ${certificate.fieldOfInterest}` : ''}

${certificate.achievementText}

Awarded: ${certificate.certificateDate}`;

  if (downloadUrl) {
    return `${baseMessage}

📄 Download your certificate: ${downloadUrl}`;
  }

  return baseMessage;
}

// Prepare certificate for sharing
export function prepareCertificateForSharing(
  certificate: CleanCertificateData,
  downloadUrl?: string
): ShareableCertificate {
 const contactInfo = getContactInfoByEmail(certificate.email);
  const shareMessage = getCertificateShareMessage(certificate, downloadUrl);
  
  return {
    ...certificate,
    contactInfo,
    downloadUrl,
    shareMessage
  };
}

// Share certificate via preferred method
export function shareCertificate(
  certificate: ShareableCertificate, 
  method?: 'whatsapp' | 'email' | 'facebook-messenger' | 'facebook' | 'linkedin' | 'twitter'
): void {
  const shareMethod = method || certificate.contactInfo?.preferredMethod || 'whatsapp';
  const contactInfo = certificate.contactInfo;

  if (!contactInfo) {
    console.warn('No contact info available for', certificate.recipientName);
    return;
  }

  switch (shareMethod) {
    case 'whatsapp':
      if (contactInfo.whatsapp) {
        const whatsappLink = getWhatsAppShareLink(contactInfo.whatsapp, certificate.shareMessage || '');
        window.open(whatsappLink, '_blank');
      }
      break;
      
    case 'email':
      if (contactInfo.email) {
        const emailLink = getEmailShareLink(contactInfo.email, certificate, certificate.downloadUrl);
        window.open(emailLink, '_blank');
      }
      break;
      
    case 'facebook-messenger':
      // Facebook Messenger direct messaging
      if (contactInfo.facebook) {
        const messengerLink = getFacebookMessengerLink(contactInfo.facebook, certificate.shareMessage || '');
        window.open(messengerLink, '_blank');
      }
      break;
      
    case 'facebook':
      // Facebook public post sharing
      const facebookLink = getFacebookShareLink(certificate.shareMessage || '', certificate.downloadUrl);
      window.open(facebookLink, '_blank');
      break;
      
    case 'linkedin':
      const linkedinLink = getLinkedInShareLink(certificate.shareMessage || '', certificate.downloadUrl);
      window.open(linkedinLink, '_blank');
      break;
      
    case 'twitter':
      const twitterLink = getTwitterShareLink(certificate.shareMessage || '', certificate.downloadUrl);
      window.open(twitterLink, '_blank');
      break;
  }
}

// Bulk share preparation
export function prepareCertificatesForSharing(
  certificates: CleanCertificateData[],
  getDownloadUrl?: (certificate: CleanCertificateData) => string
): ShareableCertificate[] {
  return certificates.map(certificate => 
    prepareCertificateForSharing(certificate, getDownloadUrl?.(certificate))
  );
}