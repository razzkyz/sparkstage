import { useEffect } from 'react';
import { createChat } from '@n8n/chat';

export default function ChatWidget() {
  useEffect(() => {
    createChat({
      webhookUrl: 'https://sparkland.app.n8n.cloud/webhook/e916a394-f8ea-4714-a32b-ea769da02cc2/chat',
      mode: 'window',
      showWelcomeScreen: false,
      initialMessages: [
        'Hai! 👋 Aku Spark Assistant ✨',
        'Tanya apa saja seputar Spark Stage 55 ya — booking, aturan sesi, atau info paket!'
      ],
      i18n: {
        en: {
          title: 'Spark Stage 55 ✨',
          subtitle: 'Tanya apa saja seputar self-photo studio kami!',
          footer: '',
          getStarted: 'Mulai chat',
          inputPlaceholder: 'Tulis pertanyaanmu...',
          closeButtonTooltip: 'Tutup',
        },
      },
    });
  }, []);

  return (
    <style dangerouslySetInnerHTML={{ __html: `
      @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');

      :root {
        /* Warna Utama (Pink Spark Stage) */
        --chat--color-primary: #ff4b86;
        --chat--color-primary-shade-50: #e63d75;
        --chat--color-primary-shade-100: #cc2f64;
        --chat--color-secondary: #20b69e;
        
        /* Tombol Bulat (Toggle) */
        --chat--toggle--background: #ff4b86;
        --chat--toggle--color: #ffffff;
        
        /* Header Chat */
        --chat--header--background: linear-gradient(135deg, #ff4b86 0%, #e63d75 100%);
        --chat--header--color: #ffffff;
        
        /* Balon Chat Bot (Customer Service Spark Stage) */
        --chat--message--bot--background: #ffffff;
        --chat--message--bot--color: #1f2937;
        
        /* Balon Chat User (Customer / Anda) */
        --chat--message--user--background: #ff4b86;
        --chat--message--user--color: #ffffff;
        
        /* Ukuran Window */
        --chat--window--width: 380px;
        --chat--window--height: 600px;
        
        /* Font Utama */
        --chat--font-family: 'Nunito Sans', sans-serif !important;
      }
      
      /* --- Kustomisasi Tipografi & Tampilan Premium --- */
      
      /* Base Window dengan latar belakang soft cream/pink yang sangat tipis */
      .chat-window {
        z-index: 9999 !important;
        border-radius: 20px !important;
        overflow: hidden !important;
        box-shadow: 0 12px 48px rgba(230, 61, 117, 0.2) !important;
        border: 1px solid rgba(255, 75, 134, 0.15) !important;
        background: linear-gradient(180deg, #ffffff 0%, #fffafc 100%) !important;
        font-family: 'Nunito Sans', sans-serif !important;
      }
      
      /* Header Chat - Teks lebih tebal, elegan, dan ada shadow lembut */
      .chat-header {
        border-radius: 20px 20px 0 0 !important;
        padding: 24px 20px !important;
        box-shadow: 0 4px 15px rgba(230, 61, 117, 0.15) !important;
      }
      
      .chat-header h1 {
        font-weight: 800 !important;
        letter-spacing: 0.5px !important;
        font-size: 1.25rem !important;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
      }
      
      .chat-header p {
        font-weight: 400 !important;
        font-size: 0.9rem !important;
        opacity: 0.95 !important;
        margin-top: 4px !important;
        line-height: 1.4 !important;
      }
      
      /* Area Chat (Tempat balon chat muncul) */
      .chat-history {
        padding: 20px !important;
      }

      /* Balon Chat Secara Umum: Line height lebih besar agar enak dibaca */
      .chat-message {
        font-weight: 600 !important;
        font-size: 0.95rem !important;
        line-height: 1.5 !important;
        padding: 12px 16px !important;
      }

      /* Balon Chat Bot (CS) */
      [data-chat-message-type="bot"], .chat-message-bot {
        border-radius: 18px 18px 18px 4px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.04) !important;
        border: 1px solid #ffe1ec !important;
        background: #ffffff !important;
      }

      /* Balon Chat User */
      [data-chat-message-type="user"], .chat-message-user {
        border-radius: 18px 18px 4px 18px !important;
        box-shadow: 0 4px 12px rgba(230, 61, 117, 0.25) !important;
        background: #ff4b86 !important;
      }

      /* Input area (Footer) */
      .chat-footer {
        border-radius: 0 0 20px 20px !important;
        border-top: 1px solid #ffe1ec !important;
        background: #ffffff !important;
        padding: 16px !important;
      }
      
      /* Kotak input teks */
      .chat-input {
        border-radius: 24px !important;
        background: #fff1f6 !important;
        border: 1px solid transparent !important;
        transition: all 0.3s ease !important;
        font-family: 'Nunito Sans', sans-serif !important;
        font-weight: 600 !important;
        padding: 12px 16px !important;
      }
      
      .chat-input:focus-within {
        border: 1px solid #ff4b86 !important;
        background: #ffffff !important;
        box-shadow: 0 0 0 4px rgba(255, 75, 134, 0.1) !important;
      }

      /* Tombol Kirim (Send) */
      .chat-submit-button {
        color: #ff4b86 !important;
        transition: transform 0.2s !important;
      }
      .chat-submit-button:hover {
        transform: scale(1.1) !important;
      }

      /* Chat Toggle Button (Bulat mengambang) */
      .chat-toggle {
        z-index: 9999 !important;
        box-shadow: 0 10px 30px rgba(230, 61, 117, 0.4) !important;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        width: 60px !important;
        height: 60px !important;
      }
      
      .chat-toggle:hover {
        transform: scale(1.1) translateY(-6px) !important;
      }
    `}} />
  );
}
