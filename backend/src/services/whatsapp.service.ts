import { WASocket } from '@whiskeysockets/baileys';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require('qrcode');

export class WhatsAppService {
  private sock: WASocket | null = null;
  private qrCodeStr: string | null = null;
  private status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'QR_READY' = 'DISCONNECTED';
  private initialized = false;

  // Lazy init — do NOT connect in constructor to prevent server crash
  public async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      await this.connectToWhatsApp();
    } catch (err) {
      console.error('[WA] Failed to initialize WhatsApp service:', err);
      this.status = 'DISCONNECTED';
      this.initialized = false;
    }
  }

  private disconnectLogged = false;

  public async connectToWhatsApp() {
    this.status = 'CONNECTING';
    const authFolder = path.join(process.cwd(), 'auth_info_baileys');

    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    // Dynamic import to prevent crash if baileys has issues at load time
    const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys');
    const P = require('pino');

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[WA] Using WA v${version.join('.')}, isLatest: ${isLatest}`);

    this.sock = makeWASocket({
      version,
      auth: state,
      logger: P({ level: 'silent' }), // Hide noisy JSON logs
      browser: Browsers.macOS('Desktop'),
      printQRInTerminal: false,
      connectTimeoutMs: 60000,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.status = 'QR_READY';
        QRCode.toDataURL(qr, (err: any, url: string) => {
          if (!err) this.qrCodeStr = url;
        });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const errorMsg = (lastDisconnect?.error as any)?.message || 'Unknown error';
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        this.status = 'DISCONNECTED';

        if (shouldReconnect) {
          if (!this.disconnectLogged) {
            console.log(`[WA] WhatsApp tidak terhubung (Code: ${statusCode}, Err: ${errorMsg}). Auto-retry aktif (silent mode).`);
            this.disconnectLogged = true;
          }
          setTimeout(() => this.connectToWhatsApp(), 15000);
        } else {
          console.log('[WA] Session logged out. Cleaning auth...');
          fs.rmSync(authFolder, { recursive: true, force: true });
          setTimeout(() => this.connectToWhatsApp(), 15000);
        }
      } else if (connection === 'open') {
        console.log('[WA] ✅ WhatsApp connected successfully!');
        this.status = 'CONNECTED';
        this.qrCodeStr = null;
        this.disconnectLogged = false; // Reset so next disconnect logs once
      }
    });
  }

  public getStatus() {
    return {
      status: this.status,
      qrCodeUrl: this.qrCodeStr
    };
  }

  public async sendMessage(toNumber: string, text: string): Promise<boolean> {
    if (this.status !== 'CONNECTED' || !this.sock) {
      console.warn('[WA] Cannot send message — not connected.');
      return false;
    }

    let formattedNumber = toNumber.replace(/\D/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    }
    const jid = `${formattedNumber}@s.whatsapp.net`;

    try {
      await this.sock.sendMessage(jid, { text });
      console.log(`[WA] Message sent to ${jid}`);
      return true;
    } catch (error) {
      console.error(`[WA] Failed to send to ${jid}`, error);
      return false;
    }
  }

  public async sendDocument(toNumber: string, documentBuffer: Buffer, fileName: string, caption?: string): Promise<boolean> {
    if (this.status !== 'CONNECTED' || !this.sock) {
      console.warn('[WA] Cannot send document — not connected.');
      return false;
    }

    let formattedNumber = toNumber.replace(/\D/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    }
    const jid = `${formattedNumber}@s.whatsapp.net`;

    try {
      await this.sock.sendMessage(jid, { 
        document: documentBuffer, 
        mimetype: 'application/pdf', 
        fileName: fileName,
        caption: caption
      });
      console.log(`[WA] Document sent to ${jid}`);
      return true;
    } catch (error) {
      console.error(`[WA] Failed to send doc to ${jid}`, error);
      return false;
    }
  }

  public async resetSession(): Promise<void> {
    console.log('[WA] Resetting session — deleting auth folder...');
    
    // Disconnect current socket
    if (this.sock) {
      try { this.sock.end(undefined); } catch (_) { /* ignore */ }
      this.sock = null;
    }
    
    this.status = 'DISCONNECTED';
    this.qrCodeStr = null;
    this.initialized = false;
    
    // Delete auth folder
    const authFolder = path.join(process.cwd(), 'auth_info_baileys');
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
    
    console.log('[WA] Session cleared. Reconnecting...');
    await this.init();
  }
}

// Singleton — but NOT auto-connected. Call waService.init() when ready.
export const waService = new WhatsAppService();
