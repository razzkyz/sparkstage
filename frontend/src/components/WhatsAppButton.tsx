import { MessageCircle } from 'lucide-react';

const WHATSAPP_LINK = 'https://wa.me/6281558200089';

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-[#128C7E] transition-all hover:scale-110 hover:shadow-xl"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
    </a>
  );
}
